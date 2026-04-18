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

OVERVIEW_PRIORITY_FILES = {
    "readme", "readme.md", "package.json", "requirements.txt", "pyproject.toml",
    "go.mod", "cargo.toml", "pom.xml", "build.gradle", "docker-compose.yml",
    "dockerfile", ".env.example", "tsconfig.json", "vite.config.ts", "vite.config.js"
}

OVERVIEW_ENTRYPOINT_NAMES = {
    "main.py", "main.ts", "main.tsx", "main.js", "main.jsx",
    "app.py", "app.ts", "app.tsx", "app.js", "app.jsx",
    "server.py", "server.ts", "server.js", "index.ts", "index.tsx",
    "index.js", "index.jsx"
}

# In-memory cache of the last analyzed repos so per-file requests can
# look up content without re-running gitingest. Keyed by repo_url.
# Keeping this simple and bare-bones as requested.
REPO_FILE_CACHE = {}

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
    
class Persona(BaseModel):
    role: str
    desc: str
    badge: str

class Flow(BaseModel):
    title: str
    color: str = Field(description="Must be exactly one of: 'blue', 'green', or 'purple'")
    steps: List[str]

class Endpoint(BaseModel):
    method: str = Field(description="HTTP Method like GET, POST, PUT, etc.")
    path: str
    desc: str
    auth: bool

class ErrorDef(BaseModel):
    code: str = Field(description="HTTP Status Code like 404, 500, etc.")
    label: str
    desc: str

class EndUserData(BaseModel):
    personas: List[Persona]
    flows: List[Flow]
    endpoints: List[Endpoint]
    errors: List[ErrorDef]

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


def parse_gitingest_files(gitingest_content: str):
    """
        This parses the gitingest content into a list of files, 
        this way we can select/utilize specific files instead of the entire content.
    """

    # Split by new new line and content i.e we get the title then its contents
    # i used example gitinject files for this, might need a better regex
    parts = re.split(r'={10,}\nFILE: (.*?)\n={10,}\n', gitingest_content)
    files = []

    for i in range(1, len(parts), 2):
        filepath = parts[i].strip()
        filecontent = parts[i + 1].strip()
        files.append({"path": filepath, "content": filecontent})

    return files


def score_overview_file(filepath: str):
    """
        This will score the files based on the name, I have a
        priority list above, we can use to decide what files to
        prioritize for the overview.
    """
    normalized_path = filepath.lower()
    filename = os.path.basename(normalized_path)
    score = 0

    if filename in OVERVIEW_PRIORITY_FILES:
        score += 100
    if filename in OVERVIEW_ENTRYPOINT_NAMES:
        score += 80
    if normalized_path.count('/') == 0:
        score += 25
    if any(token in normalized_path for token in ('/config/', '/routes/', '/route/', '/api/', '/controller/', '/service/')):
        score += 20
    if any(test_token in normalized_path for test_token in ('/tests/', '/test/', '.spec.', '.test.')):
        score -= 40

    return score


def extract_overview_snippet(filecontent: str, max_lines=20, max_chars=1200):
    """
        This will extract the overview snippet from the file,
        we can use this to get the most important lines of the file, 
        basically reducing the bigger files into just important sections
        enough that the llm should be able to pull context itself.
    """
    important_lines = []
    fallback_lines = []

    for line in filecontent.splitlines():
        #remove whitespace
        stripped = line.strip()
        if not stripped:
            continue

        #shorten the line to a max of 180 characters
        shortened = stripped[:180]
        #check if we're past the max lines, if not add it to fallback lines
        if len(fallback_lines) < max_lines:
            fallback_lines.append(shortened)

        # checks the line for keywords, things like if its a class identifier, 
        # function etc, since we can usually derive the function use from
        # the name we mark these as important lines.
        if stripped.startswith((
            '#', '//', '/*', '*', 'import ', 'from ', 'export ',
            'class ', 'def ', 'function ', 'interface ', 'type ',
            'enum ', 'package ', 'module ', '@'
        )):
            important_lines.append(shortened)

        #if we've hit the max lines, break
        if len(important_lines) >= max_lines:
            break

    # if we have less than 4 important lines, use the fallback lines
    # this is to ensure we have enough lines to make a good overview
    # and keep in mind the fall-back lines already include the important ones.
    selected_lines = important_lines if len(important_lines) >= 4 else fallback_lines
    return "\n".join(selected_lines)[:max_chars]

def build_tree_outline(filepaths, max_items=12):
    """
        This will build the tree outline for the files,
        I'm using this prmarily to just build a loose file tree
        for the overview, not to represent the actual full file tree
    """
    outline = []
    seen_roots = set()

    for filepath in filepaths:
        root = filepath.split('/')[0]
        if root not in seen_roots:
            seen_roots.add(root)
            outline.append(root)
        if len(outline) >= max_items:
            break

    return "\n".join(f"- {item}" for item in outline)


def build_overview_context(summary, content, max_files=8, max_chars=18000):
    """
        Finally This will builds the overview context for the repository,
        that way we can pass this to the llm to generate the overview.
        with a max character limit of 18000 rn, but modify as needed.
        (Didn't know if ollama has a max limit i should be using as ref here)
    """
    parsed_files = parse_gitingest_files(content)
    if not parsed_files:
        return content[:max_chars]

    # Create a new sorted list
    # The lambda here is the sorting function, in short it's saying
    # For each file get the overview score, and then take points away for longer lengths
    # so its sorted by score and then by shorter paths first
    ranked_files = sorted(
        parsed_files,
        key=lambda file_info: (score_overview_file(file_info["path"]), -len(file_info["path"])),
        reverse=True
    )

    # Get the filepaths that we use to build the tree
    filepaths = [file_info["path"] for file_info in parsed_files]
    # Build the context sections, we have the summary, tree outline, and critical file snippets
    context_sections = [
        "Repository Summary:",
        summary.strip(),
        "",
        "Top-Level Structure:",
        build_tree_outline(filepaths),
        "",
        "Critical File Snippets:"
    ]

    # Track the size of the current context
    current_length = len("\n".join(context_sections))
    selected_count = 0


    for file_info in ranked_files:
        # Break if we're going pas the context limit/max files
        if selected_count >= max_files or current_length >= max_chars:
            break
        
        # Extract information relevant to the overfiew 
        snippet = extract_overview_snippet(file_info["content"])
        if not snippet:
            continue

        # Build the block we'll place into the context
        # This is pretty much the file header and then the snippet
        file_block = f"\nFILE: {file_info['path']}\n{snippet}\n"

        #Checks if that will past our context limit, and breaks if so
        if current_length + len(file_block) > max_chars:
            break

        # Add the block to the context section etc etc, you get the idea.
        context_sections.append(file_block)
        current_length += len(file_block)
        selected_count += 1

    return "\n".join(context_sections)

# I've modified the old processOverview to use the new built context
def processOverview(summary, overview_context, full_content=None):
    # Calculate lines of code
    metric_source = full_content if full_content is not None else overview_context
    all_lines = metric_source.split("\n")
    lines_of_code = len([line for line in all_lines if line.strip()])
    files_analyzed = summary.split('Files analyzed: ')[-1].split("\n")[0] if "Files analyzed:" in summary else "N/A"
    context = f"Repository Overview Context:\n{overview_context[:30000]}"
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
            'num_ctx': 32000
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
    """
        Metadata-only tree used in the initial /analyze response.
        File nodes intentionally do not include `content` so the
        payload stays small. Content is fetched per-file on demand
        via /file-content.
    """
    parts = re.split(r'={10,}\nFILE: (.*?)\n={10,}\n', gitingest_content)

    root_children = {}

    # parts[0] is the tree preamble. Actual files start at index 1.
    for i in range(1, len(parts), 2):
        filepath = parts[i].strip()

        path_parts = filepath.split('/')
        current_level = root_children

        for j, part in enumerate(path_parts):
            if j == len(path_parts) - 1:
                current_level[part] = {
                    "id": filepath.replace('/', '-'),
                    "name": part,
                    "path": filepath,
                    "type": "file",
                    "summary": f"Source file: {filepath}"
                }
            else:
                if part not in current_level:
                    current_level[part] = {
                        "id": "-".join(path_parts[:j+1]),
                        "name": part,
                        "type": "folder",
                        "children": {}
                    }
                current_level = current_level[part]["children"]

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


def cache_repo_files(repo_url: str, gitingest_content: str):
    """
        Parses the gitingest output once and caches a path -> content
        map so per-file endpoints can answer without re-ingesting.
    """
    parsed_files = parse_gitingest_files(gitingest_content)
    file_map = {file_info["path"]: file_info["content"] for file_info in parsed_files}
    REPO_FILE_CACHE[repo_url] = file_map
    return file_map
@app.route('/analyze', methods=['POST'])

# Updated analyze to use the new overview context, should be faster.
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
    cache_repo_files(repo_url, content)
    overview_context = build_overview_context(summary, content)
    overview_data = processOverview(summary, overview_context, full_content=content)
    overview_data['fileTree'] = build_file_tree(content)
    overview_data['repoUrl'] = repo_url
    return jsonify(overview_data)


@app.route('/file-content', methods=['POST'])
def get_file_content():
    """
        Returns the content for a single file from the cached
        gitingest parse. Expects {repo_url, path} in the body.
    """
    token = session.get('github_token')
    if not token:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.get_json() or {}
    repo_url = data.get('repo_url')
    file_path = data.get('path')

    if not repo_url or not file_path:
        return jsonify({"error": "Missing repo_url or path"}), 400

    file_map = REPO_FILE_CACHE.get(repo_url)
    if file_map is None:
        return jsonify({"error": "Repository not analyzed yet"}), 404

    file_content = file_map.get(file_path)
    if file_content is None:
        return jsonify({"error": "File not found"}), 404

    return jsonify({"path": file_path, "content": file_content})

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
    
@app.route('/generate-enduser', methods=['POST'])
def generate_enduser():
    token = session.get('github_token')
    if not token:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.get_json()
    summary = data.get('summary', '')
    tech_stack = data.get('tech_stack', [])
    tech_details = "\n".join([f"- {tech['name']} ({tech['category']}): {tech['description']}" for tech in tech_stack])

    prompt = f"""
    Based on the following project summary and tech stack, act as a Technical Writer and generate an API/Consumer Guide.
    Infer the likely personas, key usage flows, API endpoints (or core functions), and common errors.
    
    Project Summary: {summary}
    Tech Stack: {tech_details}
    
    CRITICAL INSTRUCTION: Output ONLY a valid JSON object matching this EXACT skeleton. Do not add any outer wrappers like "EndUserData".
    {{
      "personas": [
        {{ "role": "Role Name", "desc": "1 sentence description", "badge": "Web/Mobile/Partner" }}
      ],
      "flows": [
        {{ "title": "Flow Name", "color": "blue", "steps": ["step 1", "step 2", "step 3"] }}
      ],
      "endpoints": [
        {{ "method": "GET", "path": "/api/example", "desc": "What it does", "auth": true }}
      ],
      "errors": [
        {{ "code": "400", "label": "Bad Request", "desc": "Why it happens" }}
      ]
    }}
    """

    try:
        response = ollama.chat(
            model='llama3.1',
            messages=[{"role": "user", "content": prompt}],
            format='json',
            options={'temperature': 0.2, 'num_predict': 1000}
        )
        
        # Parse the string into a python dictionary
        ai_data = json.loads(response['message']['content'])
        
        
        return jsonify(ai_data)
    
    except Exception as e:
        print(f"Error generating end user guide: {e}")
        return jsonify({"error": "Failed to generate guide"}), 500
if __name__ == '__main__':
    app.run(port=3001, debug=True)
