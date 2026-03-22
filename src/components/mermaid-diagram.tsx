import React, { useEffect, useRef, useId } from 'react';
import mermaid from 'mermaid';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { ZoomIn, ZoomOut, Maximize } from 'lucide-react';

mermaid.initialize({
  startOnLoad: false,
  theme: 'base',
  themeVariables: {
    primaryColor: '#eff6ff',
    primaryBorderColor: '#3b82f6',
    primaryTextColor: '#1e3a8a',
    lineColor: '#94a3b8',
    fontFamily: 'ui-sans-serif, system-ui, sans-serif',
  },
});

export function MermaidDiagram({ chart }: { chart: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const uniqueId = `mermaid-${useId().replace(/:/g, '')}`;

  useEffect(() => {
    if (containerRef.current && chart) {
      containerRef.current.innerHTML = '';
      
      mermaid.render(uniqueId, chart).then(({ svg }) => {
        if (containerRef.current) {
          containerRef.current.innerHTML = svg;
        }
      }).catch((err) => {
        console.error('Mermaid rendering failed', err);
      });
    }
  }, [chart, uniqueId]);

  return (
    <div className="w-full h-full relative flex items-center justify-center group min-h-[350px]">
      <TransformWrapper
        initialScale={1}
        minScale={0.5}
        maxScale={4}
        centerOnInit={true}
        wheel={{ step: 0.1 }} // Smoother scrolling
      >
        {({ zoomIn, zoomOut, resetTransform }) => (
          <>
            {/* Hover Toolbar */}
            <div className="absolute top-2 right-2 z-10 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur-sm border border-gray-200 shadow-sm rounded-lg p-1.5">
              <button 
                onClick={() => zoomIn()} 
                className="p-1.5 hover:bg-gray-100 rounded text-gray-600 transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="size-4" />
              </button>
              <button 
                onClick={() => zoomOut()} 
                className="p-1.5 hover:bg-gray-100 rounded text-gray-600 transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="size-4" />
              </button>
              <button 
                onClick={() => resetTransform()} 
                className="p-1.5 hover:bg-gray-100 rounded text-gray-600 transition-colors"
                title="Reset View"
              >
                <Maximize className="size-4" />
              </button>
            </div>

            {/* Draggable/Zoomable Canvas */}
            <TransformComponent 
              wrapperClass="w-full h-full rounded-xl" 
              contentClass="w-full h-full flex items-center justify-center"
            >
              <div 
                ref={containerRef} 
                className="p-8 cursor-grab active:cursor-grabbing w-full h-full flex justify-center" 
              />
            </TransformComponent>
          </>
        )}
      </TransformWrapper>
    </div>
  );
}