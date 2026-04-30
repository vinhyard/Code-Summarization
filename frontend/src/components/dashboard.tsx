import { ExternalLink, LayoutDashboard, GitBranch, Code, Users, RotateCw, PlusCircle, Search, Clock } from 'lucide-react';
import { useState } from 'react';
import { OverviewTab } from './overview-tab';
import { ArchitectView } from './architect-view';
import { DeveloperView } from './developer-view';
import { EndUserView } from './enduser-view';

interface DashboardProps {
  projectName: string;
  repoUrl: string;
  analysisData: any;
  allRepos: any[]; // The full list of user repos
  onReanalyze: () => void;
  onSwitchRepo: (repo: any) => void;
}

type TabType = 'overview' | 'architect' | 'developer' | 'enduser';

const TABS = [
  { id: 'overview'  as TabType, label: 'Overview',        icon: LayoutDashboard },
  { id: 'architect' as TabType, label: 'Architect View',  icon: GitBranch },
  { id: 'developer' as TabType, label: 'Developer View',  icon: Code },
  { id: 'enduser'   as TabType, label: 'End User View',   icon: Users },
];

export function Dashboard({ projectName, repoUrl, analysisData, allRepos, onReanalyze, onSwitchRepo }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [mermaidChart, setMermaidChart] =  useState<string | null>(null);
  const [fileSummaries, setFileSummaries] = useState<Record<string, string>>({});
  const [fileContents, setFileContents] = useState<Record<string, string>>({});
  const [endUserData, setEndUserData] = useState<any>(null);
  const [isSwitchModalOpen, setIsSwitchModalOpen] = useState(false);
  const [repoSearch, setRepoSearch] = useState('');
  const lastAnalyzed = new Date().toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 px-8 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl mb-1 font-semibold text-gray-900">{projectName}</h1>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <a
                href={repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-blue-600 transition-colors font-medium border-b border-transparent hover:border-blue-600 pb-px"
              >
                View Repository
                <ExternalLink className="size-3" />
              </a>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Clock className="size-3" />
                Updated: {lastAnalyzed}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onReanalyze}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
              title="Re-run analysis on current repository"
            >
              <RotateCw className="size-4" />
              <span>Re-analyze</span>
            </button>
            <button
              onClick={() => setIsSwitchModalOpen(true)}
              className="flex items-center gap-2 px-4 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
            >
              <PlusCircle className="size-4" />
              <span>Switch Project</span>
            </button>
          </div>
        </div>
      </header>

      {/* Switch Project Modal */}
      {isSwitchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setIsSwitchModalOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="font-semibold text-gray-900">Switch Repository</h3>
              <button onClick={() => setIsSwitchModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <Search className="size-4" />
              </button>
            </div>
            
            <div className="p-4 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search your repositories..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 transition-all"
                  value={repoSearch}
                  onChange={(e) => setRepoSearch(e.target.value)}
                  autoFocus
                />
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto p-2">
              {allRepos
                .filter(r => r.name.toLowerCase().includes(repoSearch.toLowerCase()))
                .map((repo) => (
                  <button
                    key={repo.id}
                    onClick={() => {
                      onSwitchRepo(repo);
                      setIsSwitchModalOpen(false);
                    }}
                    className="w-full text-left p-3 rounded-xl hover:bg-blue-50 group transition-all border border-transparent hover:border-blue-100"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-900 group-hover:text-blue-700">{repo.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-mono">
                        {repo.language || 'Unknown'}
                      </span>
                    </div>
                    {repo.description && (
                      <p className="text-xs text-gray-500 line-clamp-1">{repo.description}</p>
                    )}
                  </button>
                ))}
              {allRepos.length === 0 && (
                <div className="py-12 text-center text-gray-500">
                  <p className="text-sm italic">No repositories found.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <aside className="w-56 border-r border-gray-200 bg-gray-50 p-4 shrink-0">
          <nav className="space-y-1">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-left text-sm transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Icon className="size-4 shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          {activeTab === 'overview'  && <OverviewTab analysisData={analysisData} />}
          {activeTab === 'architect' && <ArchitectView analysisData={analysisData} mermaidChart={mermaidChart} setMermaidChart={setMermaidChart}/>}
          {activeTab === 'developer' && <DeveloperView repoUrl={analysisData?.repoUrl || repoUrl} fileTree={analysisData?.fileTree} fileSummaries={fileSummaries} setFileSummaries={setFileSummaries} fileContents={fileContents} setFileContents={setFileContents}/>}
          {activeTab === 'enduser'   && <EndUserView analysisData={analysisData} endUserData={endUserData} setEndUserData={setEndUserData}/>}
        </main>
      </div>
    </div>
  );
}
