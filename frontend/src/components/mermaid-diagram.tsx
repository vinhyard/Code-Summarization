import React, { useEffect, useRef, useId, useState } from 'react';
import mermaid from 'mermaid';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { ZoomIn, ZoomOut, Maximize, AlertTriangle } from 'lucide-react';

mermaid.initialize({
  startOnLoad: false,
  suppressErrorRendering: true,
  theme: 'base',
  
  themeVariables: {
    primaryColor: '#eff6ff',
    primaryBorderColor: '#3b82f6',
    primaryTextColor: '#1e3a8a',
    lineColor: '#94a3b8',
    fontFamily: 'ui-sans-serif, system-ui, sans-serif',
  },
});

interface MermaidDiagramProps {
  chart: string;
  onError?: () => void;
}

export function MermaidDiagram({ chart, onError }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const uniqueId = `mermaid-${useId().replace(/:/g, '')}`;
  const [hasError, setHasError] = useState(false);

  // 1. Store the latest callback in a ref so it doesn't trigger re-renders
  const onErrorRef = useRef(onError);
  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    // 2. React Strict Mode safety net
    let isCancelled = false; 

    if (containerRef.current && chart) {
      setHasError(false);
      containerRef.current.innerHTML = '';
      
      // 3. Force a totally unique ID for every single render pass to bypass Mermaid's cache
      const renderId = `${uniqueId}-${Math.random().toString(36).substr(2, 9)}`;

      mermaid.render(renderId, chart).then(({ svg }) => {
        if (!isCancelled && containerRef.current) {
          containerRef.current.innerHTML = svg;
        }
      }).catch((err) => {
        if (!isCancelled) {
          console.error('Mermaid rendering failed', err);
          setHasError(true);
          if (onErrorRef.current) {
            onErrorRef.current();
          }
        }
      });
    }

    // Cleanup function runs if the component unmounts or re-renders
    return () => {
      isCancelled = true; 
    };
  }, [chart, uniqueId]); // <-- Notice onError is safely removed from here!

  // The Error Boundary UI
  if (hasError) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-gray-50/50">
        <div className="bg-red-50 text-red-800 border border-red-200 rounded-lg p-6 w-full max-w-2xl flex flex-col items-center text-center shadow-sm">
          <AlertTriangle className="size-10 text-red-500 mb-3" />
          <p className="font-semibold text-lg mb-1">AI Syntax Error Detected</p>
          <p className="text-sm mb-4">The local model generated invalid Mermaid syntax. Here is the raw output:</p>
          <pre className="text-xs font-mono bg-white p-4 rounded border border-red-200 overflow-auto whitespace-pre-wrap w-full text-left shadow-inner">
            {chart}
          </pre>
        </div>
      </div>
    );
  }

  // The Zoomable Canvas
  return (
    <div className="w-full h-full relative group">
      <TransformWrapper
        initialScale={1}
        minScale={0.2}
        maxScale={4}
        centerOnInit={true}
        wheel={{ step: 0.1 }}
      >
        {({ zoomIn, zoomOut, resetTransform }) => (
          <>
            <div className="absolute top-4 right-4 z-10 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur-sm border border-gray-200 shadow-sm rounded-lg p-1.5">
              <button onClick={() => zoomIn()} className="p-1.5 hover:bg-gray-100 rounded text-gray-600 transition-colors" title="Zoom In">
                <ZoomIn className="size-4" />
              </button>
              <button onClick={() => zoomOut()} className="p-1.5 hover:bg-gray-100 rounded text-gray-600 transition-colors" title="Zoom Out">
                <ZoomOut className="size-4" />
              </button>
              <button onClick={() => resetTransform()} className="p-1.5 hover:bg-gray-100 rounded text-gray-600 transition-colors" title="Reset View">
                <Maximize className="size-4" />
              </button>
            </div>

            <TransformComponent 
              wrapperStyle={{ width: "100%", height: "100%" }}
              contentStyle={{ width: "100%", height: "100%", display: "flex", justifyContent: "center", alignItems: "center" }}
            >
              <div 
                ref={containerRef} 
                className="w-full h-full flex items-center justify-center p-4 cursor-grab active:cursor-grabbing [&>svg]:max-w-full [&>svg]:max-h-full [&>svg]:w-auto [&>svg]:h-auto" 
              />
            </TransformComponent>
          </>
        )}
      </TransformWrapper>
    </div>
  );
}