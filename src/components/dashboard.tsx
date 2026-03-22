import { ExternalLink, LayoutDashboard, GitBranch, Code, Users } from 'lucide-react';
import { useState } from 'react';
import { OverviewTab } from './overview-tab';
import { ArchitectView } from './architect-view';
import { DeveloperView } from './developer-view';
import { EndUserView } from './enduser-view';

interface DashboardProps {
  projectName: string;
  repoUrl: string;
  analysisData: any;
}

type TabType = 'overview' | 'architect' | 'developer' | 'enduser';

const TABS = [
  { id: 'overview'  as TabType, label: 'Overview',        icon: LayoutDashboard },
  { id: 'architect' as TabType, label: 'Architect View',  icon: GitBranch },
  { id: 'developer' as TabType, label: 'Developer View',  icon: Code },
  { id: 'enduser'   as TabType, label: 'End User View',   icon: Users },
];

export function Dashboard({ projectName, repoUrl, analysisData }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  const [fileSummaries, setFileSummaries] = useState<Record<string, string>>({});
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
            <h1 className="text-2xl mb-1">{projectName}</h1>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <a
                href={repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-blue-600 transition-colors"
              >
                View Repository
                <ExternalLink className="size-3.5" />
              </a>
              <span>•</span>
              <span>Last analyzed: {lastAnalyzed}</span>
            </div>
          </div>
        </div>
      </header>

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
          {activeTab === 'architect' && <ArchitectView analysisData={analysisData}/>}
          {activeTab === 'developer' && <DeveloperView fileTree={analysisData?.fileTree} fileSummaries={fileSummaries} setFileSummaries={setFileSummaries}/>}
          {activeTab === 'enduser'   && <EndUserView />}
        </main>
      </div>
    </div>
  );
}
