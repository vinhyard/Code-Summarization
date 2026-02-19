import { Github, Check, Star, Users2, Clock } from 'lucide-react';
import { useState } from 'react';

interface Repo {
  id: string;
  name: string;
  description: string;
  language: string;
  stars: string;
  contributors: number;
  lastActive: string;
}

interface LoginScreenProps {
  onConnect: (repos: Repo[]) => void;
}

const LANG_COLORS: Record<string, string> = {
  Go: 'bg-cyan-50 text-cyan-700 border border-cyan-200',
  TypeScript: 'bg-blue-50 text-blue-700 border border-blue-200',
  Python: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
  'React Native': 'bg-purple-50 text-purple-700 border border-purple-200',
};

const MOCK_REPOS: Repo[] = [
  {
    id: '1',
    name: 'api-gateway',
    description: 'High-performance microservices gateway with JWT auth, rate limiting, and gRPC routing to downstream services',
    language: 'Go',
    stars: '2.4k',
    contributors: 18,
    lastActive: '2 hours ago',
  },
  {
    id: '2',
    name: 'ml-pipeline',
    description: 'End-to-end ML training pipeline with feature engineering, model registry, and online serving layer',
    language: 'Python',
    stars: '1.1k',
    contributors: 12,
    lastActive: '3 days ago',
  },
  {
    id: '3',
    name: 'react-dashboard',
    description: 'Analytics dashboard with real-time charts, data tables, and role-based access control',
    language: 'TypeScript',
    stars: '891',
    contributors: 9,
    lastActive: '1 day ago',
  },
  {
    id: '4',
    name: 'mobile-app',
    description: 'Cross-platform consumer app with offline-first sync, push notifications, and biometric auth',
    language: 'React Native',
    stars: '534',
    contributors: 7,
    lastActive: '5 days ago',
  },
  {
    id: '5',
    name: 'design-system',
    description: 'Shared component library and design tokens used across all frontend products',
    language: 'TypeScript',
    stars: '312',
    contributors: 5,
    lastActive: '1 week ago',
  },
];

export function LoginScreen({ onConnect }: LoginScreenProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selectedRepos, setSelectedRepos] = useState<Set<string>>(new Set());

  const toggleRepo = (repoId: string) => {
    const next = new Set(selectedRepos);
    if (next.has(repoId)) {
      next.delete(repoId);
    } else {
      next.add(repoId);
    }
    setSelectedRepos(next);
  };

  const handleConnect = () => {
    onConnect(MOCK_REPOS.filter((r) => selectedRepos.has(r.id)));
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-8">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl mb-3">Git-Onboard</h1>
          <p className="text-gray-500">Understand any codebase in minutes</p>
        </div>

        {!isAuthenticated ? (
          <div className="flex flex-col items-center gap-6">
            <button
              onClick={() => setIsAuthenticated(true)}
              className="flex items-center gap-3 px-8 py-4 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              <Github className="size-5" />
              Continue with GitHub
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl mb-1">Select a repository to analyze</h2>
              <p className="text-gray-500 text-sm mb-4">Connected as <span className="text-gray-900 font-medium">@demo-user</span></p>
              <div className="space-y-2">
                {MOCK_REPOS.map((repo) => (
                  <div
                    key={repo.id}
                    onClick={() => toggleRepo(repo.id)}
                    className={`flex items-start gap-4 p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedRepos.has(repo.id)
                        ? 'border-blue-400 bg-blue-50/40'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/20'
                    }`}
                  >
                    <div className="pt-0.5 shrink-0">
                      <div
                        className={`size-5 rounded border-2 flex items-center justify-center transition-colors ${
                          selectedRepos.has(repo.id) ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                        }`}
                      >
                        {selectedRepos.has(repo.id) && <Check className="size-3.5 text-white" />}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{repo.name}</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${LANG_COLORS[repo.language]}`}>
                          {repo.language}
                        </span>
                      </div>
                      <p className="text-gray-500 text-sm mb-2 leading-relaxed">{repo.description}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Star className="size-3" />
                          {repo.stars}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users2 className="size-3" />
                          {repo.contributors} contributors
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="size-3" />
                          {repo.lastActive}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={handleConnect}
              disabled={selectedRepos.size === 0}
              className="w-full py-3 px-6 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {selectedRepos.size > 0
                ? `Analyze ${selectedRepos.size === 1 ? '1 Repository' : `${selectedRepos.size} Repositories`}`
                : 'Select a Repository'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
