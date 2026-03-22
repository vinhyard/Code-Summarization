import { useState, useEffect } from 'react';
import { MermaidDiagram } from './mermaid-diagram';
import { Sparkles } from 'lucide-react';

interface ArchitectViewProps {
  analysisData?: any;
}

export function ArchitectView({ analysisData }: ArchitectViewProps) {
  const [mermaidChart, setMermaidChart] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    // Only fetch if we have data and haven't fetched the chart yet
    if (analysisData && !mermaidChart && !isGenerating) {
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
        // Send the previously generated insights so the LLM doesn't have to read the raw code
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
    } finally {
      setIsGenerating(false);
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
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8 min-h-[400px] flex items-center justify-center">
        {isGenerating ? (
          <div className="flex flex-col items-center gap-3 text-blue-600 animate-pulse">
            <Sparkles className="size-8" />
            <p>Drafting architecture diagram...</p>
          </div>
        ) : mermaidChart ? (
          <MermaidDiagram chart={mermaidChart} />
        ) : (
          <p className="text-gray-500">Failed to generate diagram.</p>
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