import { Github, Check } from 'lucide-react';
import { useState } from 'react';

interface Repo {
  id: string;
  name: string;
  description: string;
  language: string;
}

interface LoginScreenProps {
  onConnect: (repos: Repo[]) => void;
}

const MOCK_REPOS: Repo[] = [
  { id: '1', name: 'react-dashboard', description: 'Modern analytics dashboard', language: 'TypeScript' },
  { id: '2', name: 'api-gateway', description: 'Microservices API gateway', language: 'Go' },
  { id: '3', name: 'mobile-app', description: 'Cross-platform mobile app', language: 'React Native' },
  { id: '4', name: 'ml-pipeline', description: 'Machine learning data pipeline', language: 'Python' },
  { id: '5', name: 'design-system', description: 'Component library and design tokens', language: 'TypeScript' },
];

export function LoginScreen({ onConnect }: LoginScreenProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selectedRepos, setSelectedRepos] = useState<Set<string>>(new Set());

  const handleGitHubLogin = () => {
    setIsAuthenticated(true);
  };

  const toggleRepo = (repoId: string) => {
    const newSelected = new Set(selectedRepos);
    if (newSelected.has(repoId)) {
      newSelected.delete(repoId);
    } else {
      newSelected.add(repoId);
    }
    setSelectedRepos(newSelected);
  };

  const handleConnect = () => {
    const repos = MOCK_REPOS.filter(repo => selectedRepos.has(repo.id));
    onConnect(repos);
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-8">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl mb-3">Git-Onboard</h1>
          <p className="text-gray-600">Understand any codebase in minutes</p>
        </div>

        {!isAuthenticated ? (
          <div className="flex flex-col items-center gap-6">
            <button
              onClick={handleGitHubLogin}
              className="flex items-center gap-3 px-8 py-4 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              <Github className="size-5" />
              Continue with GitHub
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl mb-4">Select repositories to connect</h2>
              <div className="space-y-2">
                {MOCK_REPOS.map((repo) => (
                  <div
                    key={repo.id}
                    onClick={() => toggleRepo(repo.id)}
                    className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-colors"
                  >
                    <div className="pt-0.5">
                      <div
                        className={`size-5 rounded border-2 flex items-center justify-center transition-colors ${
                          selectedRepos.has(repo.id)
                            ? 'bg-blue-600 border-blue-600'
                            : 'border-gray-300'
                        }`}
                      >
                        {selectedRepos.has(repo.id) && (
                          <Check className="size-3.5 text-white" />
                        )}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3>{repo.name}</h3>
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-sm">
                          {repo.language}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm">{repo.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={handleConnect}
              disabled={selectedRepos.size === 0}
              className="w-full py-3 px-6 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Connect {selectedRepos.size > 0 ? `${selectedRepos.size} ${selectedRepos.size === 1 ? 'Repository' : 'Repositories'}` : 'Repository'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
