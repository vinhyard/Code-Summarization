# Git-Onboard
 
> **Understand any codebase in minutes.** Connect a GitHub repository and get an AI-powered dashboard with a plain-English summary, architecture diagram, per-file code explanations, and a full API consumer guide — all generated automatically.
 
---
 
## ✨ Features
 
- **GitHub OAuth Login** — Securely authenticate with GitHub and browse all your repositories in one place.
- **Overview Tab** — AI-generated project summary, key metrics (files analyzed, lines of code, dependencies, services), interactive tech stack badges with tooltips, and numbered key insights.
- **Architect View** — Auto-generated [Mermaid.js](https://mermaid.js.org/) architecture diagram rendered from the repository's structure and tech stack, with zoom/pan controls and automatic retry on syntax errors.
- **Developer View** — Full file-tree explorer with search, syntax-highlighted code viewer (VS Code Dark+ theme), and per-file AI summaries rendered as Markdown.
- **End User View** — AI-generated API consumer guide covering user personas, key user flows, an endpoint reference table (method, path, description, auth), and common error codes.
- **Switch & Re-analyze** — Switch to any other repo or re-run the full analysis at any time from the dashboard header.
---
 
## 🗂️ Project Structure
 
```
Code-Summarization/
├── backend/              # Python / Flask API server
│   └── github_oauth.py   # GitHub OAuth flow + session management
└── frontend/             # React + TypeScript app (Vite)
    └── src/
        ├── App.tsx                  # Root state machine (login → loading → dashboard)
        ├── main.tsx                 # React entry point
        └── components/
            ├── login-screen.tsx     # GitHub auth + repo selector
            ├── loading-screen.tsx   # Analysis loading state
            ├── dashboard.tsx        # Tab shell + Switch Project modal
            ├── overview-tab.tsx     # Summary, metrics, tech stack, insights
            ├── architect-view.tsx   # Mermaid architecture diagram
            ├── developer-view.tsx   # File explorer + syntax viewer + AI summaries
            ├── enduser-view.tsx     # API consumer guide
            ├── file-explorer.tsx    # Recursive file tree component
            └── mermaid-diagram.tsx  # Zoomable Mermaid renderer
```
 
---
 
## 🛠️ Tech Stack
 
| Layer       | Technology                                                                 |
|-------------|----------------------------------------------------------------------------|
| Frontend    | React 18, TypeScript, Vite, Tailwind CSS                                   |
| UI / Icons  | Lucide React, Radix UI (Tooltip)                                           |
| Diagrams    | Mermaid.js, react-zoom-pan-pinch                                           |
| Code View   | react-syntax-highlighter (VS Code Dark+), ReactMarkdown                    |
| Backend     | Python, Flask                                                              |
| Auth        | GitHub OAuth 2.0 (session-based)                                           |
| AI / LLM    | Local LLM via Ollama (or compatible endpoint)                              |
 
---
 
## 🚀 Getting Started
 
### Prerequisites
 
- **Node.js** v18+
- **Python** 3.9+
- **Ollama** (or a compatible local LLM server) running locally
- A **GitHub OAuth App** ([create one here](https://github.com/settings/developers))
---
 
### 1. Clone the Repository
 
```bash
git clone https://github.com/vinhyard/Code-Summarization.git
cd Code-Summarization
```
 
---
 
### 2. Backend Setup
 
```bash
cd backend
 
# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
 
# Install dependencies
pip install -r requirements.txt
```
 
Create a `.env` file inside `backend/`:
 
```env
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
FLASK_SECRET_KEY=a_random_secret_key
FRONTEND_URL=http://localhost:5173
```
 
> In your GitHub OAuth App settings, set the **Authorization callback URL** to:
> `http://localhost:3001/callback`
 
Start the backend server:
 
```bash
python github_oauth.py
```
 
The Flask server runs on **http://localhost:3001**.
 
---
 
### 3. Frontend Setup
 
```bash
cd frontend
 
# Install dependencies
npm install
 
# Start the dev server
npm run dev
```
 
The frontend runs on **http://localhost:5173** (or the port Vite selects).
 
---
 
## 🔌 API Reference
 
All endpoints are served by the Flask backend at `http://localhost:3001`.
 
| Method | Endpoint                   | Description                                              | Auth Required |
|--------|----------------------------|----------------------------------------------------------|---------------|
| GET    | `/login`                   | Redirects to GitHub OAuth authorization page             | No            |
| GET    | `/callback`                | GitHub OAuth callback; sets session cookie               | No            |
| GET    | `/username`                | Returns the authenticated user's GitHub username         | Yes (session) |
| GET    | `/repos`                   | Returns a list of the user's GitHub repositories         | Yes (session) |
| POST   | `/analyze`                 | Clones & analyzes a repo; returns summary + file tree    | Yes (session) |
| POST   | `/generate-architecture`   | Generates a Mermaid diagram from summary + tech stack    | Yes (session) |
| POST   | `/generate-enduser`        | Generates the API consumer guide                         | Yes (session) |
| POST   | `/file-content`            | Returns the raw content of a specific file               | Yes (session) |
| POST   | `/summarize-file`          | Returns an AI summary for a single file                  | Yes (session) |
 
---
 
## 🖼️ Usage
 
1. Open **http://localhost:5173** in your browser.
2. Click **Continue with GitHub** and authorize the app.
3. Select a repository from your list and click **Analyze Repository**.
4. Wait for the analysis to complete — then explore:
   - **Overview** for a high-level summary and tech stack
   - **Architect View** for an auto-generated architecture diagram
   - **Developer View** to browse files with AI-powered explanations
   - **End User View** for an API consumer guide
5. Use **Re-analyze** to refresh or **Switch Project** to load a different repo.
---
 
## 🤝 Contributing
 
This is a Senior Capstone Project. Contributions and suggestions are welcome.
 
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'Add your feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request
---
 
## 📄 License
 
This project was developed for academic purposes as a Senior Capstone. Contact the author for usage permissions.
 
---
 
## 👤 Author
 
**vinhyard** — [GitHub](https://github.com/vinhyard)
**FourtIdStudio** - [Github](https://github.com/FourIDStudios)
