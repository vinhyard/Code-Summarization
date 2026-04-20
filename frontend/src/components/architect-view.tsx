import { useState, useEffect, useRef } from 'react';
import { MermaidDiagram } from './mermaid-diagram';
import { Sparkles, RefreshCw } from 'lucide-react'; // Added RefreshCw icon

interface ArchitectViewProps {
  analysisData?: any;
  mermaidChart: string | null;
  setMermaidChart: React.Dispatch<React.SetStateAction<string | null>>;
}

export function ArchitectView({ analysisData , mermaidChart, setMermaidChart}: ArchitectViewProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  
  // NEW: Retry logic state
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  // Added the useRef lock from our previous steps to prevent double-fetching in React 18
  const hasFetched = useRef(false);

  useEffect(() => {
    if (analysisData && !mermaidChart && !isGenerating && !hasFetched.current) {
      hasFetched.current = true;
      fetchArchitecture();
    }
  }, [analysisData]);

  const fetchArchitecture = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch("http://localhost:3001/generate-architecture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          summary: analysisData.summary,
          tech_stack: analysisData.tech_stack || []
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMermaidChart(data.architecture);
      }
    } catch (err) {
      console.error("Failed to generate architecture chart", err);
      hasFetched.current = false; // Unlock so user can try again
    } finally {
      setIsGenerating(false);
    }
  };

  // NEW: The handler that MermaidDiagram will call if it crashes
  const handleMermaidError = () => {
    if (retryCount < MAX_RETRIES) {
      console.log(`Syntax error detected. Retrying... (${retryCount + 1}/${MAX_RETRIES})`);
      setRetryCount((prev) => prev + 1);
      setMermaidChart(null); // Clear the bad chart
      fetchArchitecture();   // Ask Ollama to try again
    }
  };

  if (!analysisData) {
    return <div className="p-8 text-gray-500">Waiting for repository data...</div>;
  }

  return (
    <div className="p-8 max-w-6xl">
      <h2 className="text-2xl mb-1">System Architecture</h2>
      <p className="text-gray-500 text-sm mb-8">Auto-generated from repository analysis</p>

      {/* Dynamic Diagram Area */}
      <div className="bg-white border border-gray-200 rounded-xl mb-8 w-full h-[500px] relative overflow-hidden">
        {isGenerating ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-blue-600 animate-pulse">
            {retryCount > 0 ? <RefreshCw className="size-8 animate-spin" /> : <Sparkles className="size-8" />}
            <p>{retryCount > 0 ? `Fixing syntax error (Attempt ${retryCount}/${MAX_RETRIES})...` : 'Drafting architecture diagram...'}</p>
          </div>
        ) : mermaidChart ? (
          // NEW: Pass the error handler into the diagram component
          <MermaidDiagram chart={mermaidChart} onError={handleMermaidError} />
        ) : (
          <p className="text-gray-500 flex w-full h-full items-center justify-center">Failed to generate diagram.</p>
        )}
      </div>

      {/* Dynamic Service Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {analysisData.tech_stack?.slice(0, 4).map((tech: any) => (
          <div key={tech.name} className="border border-gray-200 rounded-lg p-4 bg-white">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-sm">{tech.name}</span>
              <span className="px-2 py-0.5 bg-cyan-50 text-cyan-700 rounded text-xs font-mono">
                {tech.category}
              </span>
            </div>
            <p className="text-xs text-gray-500 line-clamp-2 mb-3">{tech.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}