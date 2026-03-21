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
    if (appState === 'loading') {
      const timer = setTimeout(() => {
        setAppState('dashboard');
      }, 3200);
      return () => clearTimeout(timer);
    }
  }, [appState]);

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
    />
  );
}
