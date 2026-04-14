import { useState, useEffect } from 'react';
import { LoginScreen } from './components/login-screen';
import { LoadingScreen } from './components/loading-screen';
import { Dashboard } from './components/dashboard';

type AppState = 'login' | 'loading' | 'dashboard';

interface Repo {
  id: string;
  name: string;
  description: string;
  language: string;
}

export default function App() {
  const [appState, setAppState] = useState<AppState>('login');
  const [selectedRepos, setSelectedRepos] = useState<Repo[]>([]);
  const [isExternalAuth, setisExternalAuth] = useState(false);
  const [username, setUsername] = useState<string>("");
  const [analysisData, setAnalysisData] = useState<any>(null);
  // Check for redirect from Flask
  useEffect(() => {
    // On app load, check if we were redirected back from Github auth
    const params = new URLSearchParams(window.location.search);
    if (params.get('auth') === 'success') {
      setisExternalAuth(true);
      //Clean the URL so a refresh doesn't trigger this again
      window.history.replaceState({}, document.title, '/');
    }
    
  }, []);
  const handleConnect = (repos: Repo[], githubUsername: string) => {
    setSelectedRepos(repos);
    setUsername(githubUsername);
    setAppState('loading');
  };

useEffect(() => {
    // Only run this if we are in the loading state and actually have a repo selected
    if (appState === 'loading' && selectedRepos.length > 0) {
      
      const analyzeRepository = async () => {
        try {
          // Construct the URL you are sending to Python
          const repoUrl = `https://github.com/${username}/${selectedRepos[0].name}`;
          
          // Make the POST request to your Flask backend
          const response = await fetch("http://localhost:3001/analyze", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include", // Crucial: Sends the session token to Flask
            body: JSON.stringify({ repo_url: repoUrl }),
          });

          if (response.ok) {
            // Parse the data from the LLM and Git Ingest
            const data = await response.json();
            
            // Save the data to state and move to the Dashboard
            setAnalysisData(data);
            setAppState('dashboard');
          } else {
            setAppState('login'); // Kick them back if it fails
          }
        } catch (err) {
          console.error("Network error during analysis:", err);
          setAppState('login');
        }
      };

      // Trigger the function
      analyzeRepository();
    }
  }, [appState, selectedRepos, username]);

  if (appState === 'login') {
    return <LoginScreen onConnect={handleConnect} externalAuthSuccess={isExternalAuth} />;
  }

  if (appState === 'loading') {
    return <LoadingScreen projectName={selectedRepos[0]?.name || 'Project'} />;
  } 
  return (
    <Dashboard
      projectName={selectedRepos[0]?.name || 'Project'}
      repoUrl={`https://github.com/${username}/${selectedRepos[0]?.name}`}
      analysisData = {analysisData}
    />  
  );
}
