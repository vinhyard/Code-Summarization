from flask import Flask, redirect, url_for, session, request, render_template, jsonify
import os
from requests_oauthlib import OAuth2Session
import requests
from flask_cors import CORS
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
clean_repos = []
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
        print(response.json().get("login"))
        return jsonify({"username": response.json().get("login")})
    else:
        return jsonify({"Error": "Failed to fetch username"}), response.status_code
if __name__ == '__main__':
    app.run(port=3001, debug=True)
