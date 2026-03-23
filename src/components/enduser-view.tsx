import { useState, useEffect, useRef } from 'react';
import { ArrowRight, ShieldCheck, Users, ShoppingCart, AlertCircle, Sparkles, Server } from 'lucide-react';

interface EndUserViewProps {
  analysisData?: any;
  endUserData: any;
  setEndUserData: React.Dispatch<React.SetStateAction<any>>;
}

const METHOD_COLOR: Record<string, string> = {
  GET:  'bg-green-50 text-green-700 border border-green-200',
  POST: 'bg-blue-50 text-blue-700 border border-blue-200',
  PUT:  'bg-orange-50 text-orange-700 border border-orange-200',
  DELETE: 'bg-red-50 text-red-700 border border-red-200',
};

export function EndUserView({ analysisData, endUserData, setEndUserData }: EndUserViewProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (analysisData && !endUserData && !isGenerating && !hasFetched.current) {
      hasFetched.current = true;
      fetchEndUserData();
    }
  }, [analysisData, endUserData]);

  const fetchEndUserData = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch("http://localhost:3001/generate-enduser", {
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
        setEndUserData(data);
      }
    } catch (err) {
      console.error("Failed to generate end user guide", err);
      hasFetched.current = false;
    } finally {
      setIsGenerating(false);
    }
  };

  if (!analysisData) return <div className="p-8 text-gray-500">Waiting for repository data...</div>;

  if (isGenerating || !endUserData) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-blue-600 animate-pulse">
        <Sparkles className="size-8" />
        <p>Drafting API & Consumer Guide...</p>
      </div>
    );
  }

  // Use dynamic data
  const { personas = [], flows = [], endpoints = [], errors = [] } = endUserData;

  return (
    <div className="p-8 max-w-5xl space-y-10">
      <div>
        <h2 className="text-2xl mb-1">API Consumer Guide</h2>
        <p className="text-gray-500 text-sm">Auto-generated from source analysis</p>
      </div>

      {/* Personas */}
      <section>
        <h3 className="text-lg mb-4">Who Uses This API</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {personas.map((p: any) => (
            <div key={p.role} className="border border-gray-200 rounded-lg p-4 bg-white">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-sm">{p.role}</span>
                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{p.badge}</span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* User flows */}
      <section>
        <h3 className="text-lg mb-4">Key User Flows</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {flows.map((flow: any) => {
            const bg: Record<string, string> = { blue: 'bg-blue-50 border-blue-100', green: 'bg-green-50 border-green-100', purple: 'bg-purple-50 border-purple-100' };
            const ic: Record<string, string> = { blue: 'text-blue-600', green: 'text-green-600', purple: 'text-purple-600' };
            const safeColor = bg[flow.color] ? flow.color : 'blue'; // Fallback if AI hallucinates color
            
            return (
              <div key={flow.title} className={`border rounded-lg p-4 ${bg[safeColor]}`}>
                <div className="flex items-center gap-2 mb-3">
                  <Server className={`size-4 ${ic[safeColor]}`} />
                  <span className="font-medium text-sm">{flow.title}</span>
                </div>
                <ol className="space-y-2">
                  {flow.steps.map((step: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                      <ArrowRight className="size-3 mt-0.5 shrink-0 text-gray-400" />
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            );
          })}
        </div>
      </section>

      {/* Endpoint table */}
      <section>
        <h3 className="text-lg mb-4">Available Endpoints</h3>
        <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 w-20">Method</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Path</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Description</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 w-20">Auth</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {endpoints.map((ep: any) => (
                <tr key={ep.path} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-mono font-medium ${METHOD_COLOR[ep.method] || 'bg-gray-100'}`}>{ep.method}</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-700">{ep.path}</td>
                  <td className="px-4 py-3 text-xs text-gray-600">{ep.desc}</td>
                  <td className="px-4 py-3">
                    {ep.auth
                      ? <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded text-xs">JWT</span>
                      : <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">None</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Errors */}
      <section>
        <h3 className="text-lg mb-4">Common Errors</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {errors.map((e: any) => (
            <div key={e.code} className="flex gap-3 border border-gray-200 rounded-lg p-4 bg-white">
              <AlertCircle className="size-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-sm font-semibold text-gray-800">{e.code}</span>
                  <span className="text-sm text-gray-600">{e.label}</span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">{e.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}