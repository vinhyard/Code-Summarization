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

  const handleConnect = (repos: Repo[]) => {
    setSelectedRepos(repos);
    setAppState('loading');
  };

  useEffect(() => {
    if (appState === 'loading') {
      const timer = setTimeout(() => {
        setAppState('dashboard');
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [appState]);

  if (appState === 'login') {
    return <LoginScreen onConnect={handleConnect} />;
  }

  if (appState === 'loading') {
    return <LoadingScreen projectName={selectedRepos[0]?.name || 'Project'} />;
  }

  return (
    <Dashboard
      projectName={selectedRepos[0]?.name || 'Project'}
      repoUrl={`https://github.com/user/${selectedRepos[0]?.name || 'repo'}`}
    />
  );
}
