from flask import Flask, redirect, url_for, session, request, render_template, jsonify
import os
from requests_oauthlib import OAuth2Session
import requests
from flask_cors import CORS
from gitingest import ingest
import ollama
from pydantic import BaseModel, Field
from typing import List
import json
import re
os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'
app = Flask(__name__)
app.secret_key = os.urandom(24)
CORS(app, supports_credentials=True, origins=["http://localhost:5173"])
CLIENT_ID = os.getenv('CLIENT_ID')
CLIENT_SECRET = os.getenv("CLIENT_SECRET")
REDIRECT_URI = os.getenv('REDIRECT_URI')
AUTHORIZATION_BASE_URL = 'https://github.com/login/oauth/authorize'
TOKEN_URL = 'https://github.com/login/oauth/access_token'
USER_API_URL = 'https://api.github.com/user'

# Pydantic Schema
class TechItem(BaseModel):
    name: str
    category: str = Field(description="Must be a category such as: Language, Cache, Database, Infrastructure, Protocol, Auth")
    description: str = Field(description="A 1-2 sentence description of how it is used in the repo")
    docsUrl: str = Field(description="The official documentation URL. If you do not know the exact URL, provide the main website URL. DO NOT leave this blank.")
class OverviewData(BaseModel):
    summary: str = Field(description="A 3-4 sentence project summary explaining what the repo does")
    tech_stack: List[TechItem]
    insights: List[str] = Field(description="5 key technical insights about the entry points, architecture, or unique configurations")
    dependencies_list: List[str] = Field(description="Extract the names of external packages/libraries found in dependency files (e.g., package.json, go.mod, requirements.txt, pom.xml).")
    services_list: List[str] = Field(description="Extract the names of distinct microservices, containers, or applications defined in orchestration files (e.g., docker-compose.yml) or entry point directories (e.g., cmd/). Return ['Monolith] if it is a single service.")
    


# When user clicks "Continue with Github"
@app.route('/login')
def github_login():
    # Github handshake
    github = OAuth2Session(CLIENT_ID, redirect_uri=REDIRECT_URI, scope=["read:user", "repo"])
    # state: randomly generated string. Use Case: Stored for validation.
    authorization_url, state = github.authorization_url(AUTHORIZATION_BASE_URL)
    #Store the state in session cookie
    session['oauth_state'] = state
    # Redirect user to Github authorization page
    return redirect(authorization_url)

# Github redirects to this route after user authorizes their account.
# Contains a temp auth code 
@app.route('/callback')
def github_callback():
    github = OAuth2Session(CLIENT_ID, state=session.get('oauth_state'), redirect_uri=REDIRECT_URI)
    try:
        # Get the User's access token
        # Access token: token['access_token']
        token = github.fetch_token(
            TOKEN_URL,
            client_secret=CLIENT_SECRET,
            authorization_response=request.url
        )
        session['github_token'] = token
        # Redirect back to React with success param
        return redirect("http://localhost:5173?auth=success")
    # Error handling
    except Exception:
        return redirect("http://localhost:5173?auth=failed")

@app.route('/repos')
def get_github_repos():
    token = session.get('github_token')
    if not token:
        return {"error": "Unauthorized"}, 401
    headers = {
        'Authorization': f"Bearer {token['access_token']}"
    }
    response = requests.get('https://api.github.com/user/repos', headers=headers)
    if response.status_code == 200:
        raw_repos = response.json()
        clean_repos = []
        for repo in raw_repos:
            clean_repos.append({
                "id": str(repo.get("id")),
                "name": repo.get("name"),
                "description": repo.get("description") or "No description.",
                "language": repo.get("language") or "",
                "stars": repo.get("stargazers_count", 0),
                "lastActive": repo.get("updated_at")
            })
        return jsonify(clean_repos)
    else:
        return jsonify({"Error": "Failed to fetch repositories"}), response.status_code
def processOverview(summary, content):
    # Calculate lines of code
    all_lines = content.split("\n")
    lines_of_code = len([line for line in all_lines if line.strip()])
    files_analyzed = summary.split('Files analyzed: ')[-1].split("\n")[0] if "Files analyzed:" in summary else "N/A"
    safe_content = content[:30000]
    context = f"File Contents:\n{safe_content}"
    print("Analyzing with Ollama")
    schema = OverviewData.model_json_schema()
    prompt = f"""
    Analyze the following source code and extract the project summary, tech stack, and key insights.
    CRITICAL INSTRUCTION: DO NOT output the schema itself. You must output a populated JSON object with the ACTUAL extracted data that conforms to this schema:
    {json.dumps(schema, indent=2)}
    Source Code Context:
    {context}

    """
    response = ollama.chat(
        model='llama3.1',
        messages=[{'role': 'user', 'content': prompt}],
        format='json',
        options={
            'num_ctx': 16000
        }
    )
    
    ai_data = json.loads(response['message']['content'])

    dependency_count = len(ai_data.get("dependencies_list", []))
    service_count = len(ai_data.get("services_list", []))
    metrics = [
        {"label": "Files Analyzed", "value": files_analyzed, "color": "text-blue-600", "bg": "bg-blue-50"},
        {"label": "Lines of Code", "value": f"{lines_of_code:,}", "color": "text-green-600", "bg": "bg-green-50"},
        {"label": "Dependencies", "value": str(dependency_count), "color": "text-orange-600", "bg": "bg-orange-50"},
        {"label": "Services", "value": str(service_count), "color": "text-purple-600", "bg": "bg-purple-50"}
    ]
    return {
        "summary": ai_data.get("summary", "No summary generated"),
        "tech_stack": ai_data.get("tech_stack", []),
        "insights": ai_data.get("insights", []),
        "metrics": metrics
    }
@app.route('/username')
def get_github_username():
    token = session.get('github_token')
    if not token:
        return {"error": "Unauthorized"}, 401
    headers = {
        'Authorization': f"Bearer {token['access_token']}"
    }
    response = requests.get('https://api.github.com/user', headers=headers)
    if response.status_code == 200:
        return jsonify({"username": response.json().get("login")})
    else:
        return jsonify({"Error": "Failed to fetch username"}), response.status_code
def build_file_tree(gitingest_content: str):
    # Split the content by the gitingest file separator
    parts = re.split(r'={10,}\nFILE: (.*?)\n={10,}\n', gitingest_content)
    
    root_children = {}

    # parts[0] is the tree preamble. Actual files start at index 1.
    for i in range(1, len(parts), 2):
        filepath = parts[i].strip()
        filecontent = parts[i+1].strip()
        
        path_parts = filepath.split('/')
        current_level = root_children

        for j, part in enumerate(path_parts):
            if j == len(path_parts) - 1:
                # We've reached the actual file
                current_level[part] = {
                    "id": filepath.replace('/', '-'),
                    "name": part,
                    "type": "file",
                    "content": filecontent,
                    "summary": f"Source file: {filepath}" # Placeholder summary
                }
            else:
                # We're building the folder structure
                if part not in current_level:
                    current_level[part] = {
                        "id": "-".join(path_parts[:j+1]),
                        "name": part,
                        "type": "folder",
                        "children": {}
                    }
                current_level = current_level[part]["children"]

    # Helper to convert the nested dictionaries into lists for React
    def dict_to_list(node_dict):
        result = []
        for key, val in node_dict.items():
            if val["type"] == "folder":
                val["children"] = dict_to_list(val["children"])
            result.append(val)
        # Sort folders first, then files alphabetically
        result.sort(key=lambda x: (x["type"] == "file", x["name"].lower()))
        return result
    return dict_to_list(root_children)
@app.route('/analyze', methods=['POST'])
def analyze_repo():
    # Implementation for analyzing repositories
    token = session.get('github_token')
    if not token:
        return jsonify({"error": "Unauthorized"}), 401
    data = request.get_json()
    repo_url = data.get('repo_url')
    if not repo_url:
        return jsonify({"error": "Repository URL is missing"}), 400
    summary, content = get_gitIngest_data(repo_url)
    overview_data = processOverview(summary, content)
    overview_data['fileTree'] = build_file_tree(content)
    return jsonify(overview_data)

def get_gitIngest_data(repo_url):
    token = session.get('github_token')
    # Implementation for fetching Git Ingest data
    
    exclude_patterns = [
        "tests/", "test_*", "*_test.py", "*.spec.ts", 
        "docs/", "assets/", "public/", "images/",    
        "*.lock", "package-lock.json", "*.csv",       
        "migrations/", "vendor/"                     
    ]
    summary, tree, content = ingest(
        repo_url, token=token['access_token'], exclude_patterns=exclude_patterns, max_file_size=50000
    )
    return summary, content

@app.route('/summarize-file', methods=['POST'])
def summarize_file():
    token = session.get('github_token')
    if not token:
        return jsonify({"error": "Unauthorized"}), 401
    
    data = request.get_json()
    file_name = data.get('file_name')
    file_content = data.get('file_content')

    if not file_content:
        return jsonify({"error": "Missing file content"}), 400
    
    try:
        safe_content = file_content[:20000]
        prompt = f"""
        You are a senior software architect. Read the following source code file named '{file_name}' and explain its purpose in the repository.
        CRITICAL INSTRUCTION: You MUST respond in exactly 1 or 2 clear, concise sentences. DO NOT use markdown, bolding, or pleasantries. Just the summary. Do not make modification suggestions, only generate a summary of the code.
        
        File Content:
        {safe_content}
        """
        response = ollama.chat(
            model='llama3.1',
            messages=[{"role": "user", "content": prompt}],
            options={
                'temperature': 0.2,
                'num_predict': 150
            }
        )
        summary = response['message']['content'].strip()
        return jsonify({"summary": summary})
    except Exception as e:
        return jsonify({"error": "Failed to generate summary"})
@app.route('/generate-architecture', methods=['POST'])
def generate_architecture():
    token = session.get('github_token')
    if not token:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.get_json()
    summary = data.get('summary', '')
    tech_stack = data.get('tech_stack', [])

    # Format the tech stack into a readable string for the prompt
    tech_details = "\n".join([f"- {tech['name']} ({tech['category']}): {tech['description']}" for tech in tech_stack])

    prompt = f"""
    You are a software architect. Based on the following project summary and tech stack, generate a high-level system architecture flowchart using Mermaid.js syntax.
    
    Project Summary: 
    {summary}
    
    Tech Stack: 
    {tech_details}
    
    CRITICAL INSTRUCTIONS FOR MERMAID SYNTAX:
    1. Respond ONLY with the raw Mermaid.js code block starting with `graph TD`.
    2. Node IDs MUST be a single alphanumeric word with NO SPACES. If the display label needs spaces, you MUST use brackets. Example: ClientNode[Client Application] --> ServerNode[Web Server]
    3. Use ONLY standard arrows: `-->` for plain arrows, or `-->|label|` for labeled arrows.
    4. STRICTLY FORBIDDEN: Do not use invalid arrow shapes like `-->|label|>` or `=>`. 
    5. Do not include markdown formatting like ```mermaid.
    """

    try:
        response = ollama.chat(
            model='llama3.1',
            messages=[{"role": "user", "content": prompt}],
            options={
                'temperature': 0.1, # Very low temperature for strict structural output
                'num_predict': 300
            }
        )

        mermaid_code = response['message']['content'].strip()
        
        # Clean up markdown backticks just in case the LLM disobeys the instruction
        mermaid_code = mermaid_code.replace("```mermaid", "").replace("```", "").strip()
        
        mermaid_code = mermaid_code.replace("|>", "|") 
        mermaid_code = mermaid_code.replace('\xa0', ' ').replace('\u00a0', ' ')
        return jsonify({"architecture": mermaid_code})
    
    except Exception as e:
        print(f"Error generating architecture: {e}")
        return jsonify({"error": "Failed to generate architecture"}), 500
if __name__ == '__main__':
    app.run(port=3001, debug=True)
