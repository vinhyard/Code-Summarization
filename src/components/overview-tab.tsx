import { ExternalLink, FileCode2, GitBranch, Package, Server, Lightbulb } from 'lucide-react';
import * as Tooltip from '@radix-ui/react-tooltip';

// 1. Define the interfaces for the incoming Python data
interface TechItem {
  name: string;
  category: string;
  description: string;
  docsUrl?: string;
}

interface MetricItem {
  label: string;
  value: string;
  color: string;
  bg: string;
}

interface OverviewTabProps {
  analysisData: {
    summary: string;
    tech_stack: TechItem[]; // Python uses snake_case here!
    insights: string[];
    metrics: MetricItem[];
  };
}

// 2. Map string labels from Python to Lucide Icons
const ICON_MAP: Record<string, any> = {
  'Files Analyzed': FileCode2,
  'Lines of Code': GitBranch,
  'Dependencies': Package,
  'Services': Server,
};

const CATEGORY_COLOR: Record<string, string> = {
  Language:       'bg-cyan-50 text-cyan-700 border border-cyan-200',
  Cache:          'bg-orange-50 text-orange-700 border border-orange-200',
  Database:       'bg-purple-50 text-purple-700 border border-purple-200',
  Infrastructure: 'bg-gray-100 text-gray-600 border border-gray-200',
  Protocol:       'bg-blue-50 text-blue-700 border border-blue-200',
  Auth:           'bg-green-50 text-green-700 border border-green-200',
};

const DEFAULT_CATEGORY_COLOR = 'bg-gray-100 text-gray-700 border border-gray-200';

export function OverviewTab({ analysisData }: OverviewTabProps) {
  
  // Safety check: If data hasn't arrived yet, show a loader
  if (!analysisData) {
    return <div className="p-8 text-gray-500">Waiting for repository analysis...</div>;
  }

  // Destructure the live data (using tech_stack to match Python's JSON output)
  const { summary, tech_stack = [], insights = [], metrics = [] } = analysisData;

  return (
    <div className="p-8 max-w-5xl space-y-8">

      {/* Summary card */}
      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-8 border border-blue-100">
        <h2 className="text-2xl mb-3">Project Summary</h2>
        <p className="text-gray-700 leading-relaxed">
          {summary || "No summary was generated."}
        </p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-4 gap-4">
        {metrics.map(({ label, value, color, bg }) => {
          // Grab the correct icon from our map, or fallback to a default
          const Icon = ICON_MAP[label] || FileCode2; 
          
          return (
            <div key={label} className="border border-gray-200 rounded-xl p-4 bg-white">
              <div className={`inline-flex items-center justify-center size-9 rounded-lg ${bg} mb-3`}>
                <Icon className={`size-4 ${color}`} />
              </div>
              <div className="text-2xl font-semibold text-gray-900 mb-0.5">{value}</div>
              <div className="text-xs text-gray-500">{label}</div>
            </div>
          );
        })}
      </div>

      {/* Tech stack */}
      <div>
        <h3 className="text-lg mb-4">Tech Stack</h3>
        <Tooltip.Provider delayDuration={150}>
          <div className="flex flex-wrap gap-2">
            {tech_stack.map((tech) => (
              <Tooltip.Root key={tech.name}>
                <Tooltip.Trigger asChild>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-full hover:border-blue-400 hover:bg-blue-50 transition-colors">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${CATEGORY_COLOR[tech.category] || DEFAULT_CATEGORY_COLOR}`}>
                      {tech.category}
                    </span>
                    <span className="text-sm text-gray-800">{tech.name}</span>
                  </button>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content
                    className="bg-gray-900 text-white px-4 py-3 rounded-lg shadow-xl max-w-xs z-50"
                    sideOffset={6}
                  >
                    <p className="text-sm mb-2 leading-relaxed">{tech.description}</p>
                    {tech.docsUrl && tech.docsUrl !== "" && (
                      <a
                        href={tech.docsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-300 hover:text-blue-200 text-xs flex items-center gap-1"
                      >
                        View Docs <ExternalLink className="size-3" />
                      </a>
                    )}
                    <Tooltip.Arrow className="fill-gray-900" />
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>
            ))}
          </div>
        </Tooltip.Provider>
      </div>

      {/* Key insights */}
      <div>
        <h3 className="text-lg mb-4 flex items-center gap-2">
          <Lightbulb className="size-5 text-amber-500" />
          Key Insights
        </h3>
        <ul className="space-y-2">
          {insights.map((insight, i) => (
            <li key={i} className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-100 rounded-lg text-sm text-gray-700">
              <span className="shrink-0 size-5 flex items-center justify-center bg-amber-200 text-amber-800 rounded-full text-xs font-semibold mt-0.5">
                {i + 1}
              </span>
              {insight}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}