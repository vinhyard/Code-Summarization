import { useState, useEffect } from 'react';
import { FileExplorer, FileNode } from './file-explorer';

interface DeveloperViewProps {
  fileTree?: FileNode[];
}

// Helper to find the first actual file in the nested tree
function findFirstFile(nodes: FileNode[]): FileNode | null {
  for (const node of nodes) {
    if (node.type === 'file') return node;
    if (node.children) {
      const found = findFirstFile(node.children);
      if (found) return found;
    }
  }
  return null;
}

export function DeveloperView({ fileTree }: DeveloperViewProps) {
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);

  // Automatically select the first file when the fileTree loads
  useEffect(() => {
    if (fileTree && fileTree.length > 0 && !selectedFile) {
      setSelectedFile(findFirstFile(fileTree));
    }
  }, [fileTree, selectedFile]);

  if (!fileTree) {
    return <div className="p-8 text-gray-500">Waiting for repository files...</div>;
  }

  return (
    <div className="flex h-full">
      {/* File tree */}
      <div className="w-72 border-r border-gray-200 bg-gray-50 shrink-0 flex flex-col">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-sm font-medium text-gray-700">Repository Files</h3>
        </div>
        <div className="flex-1 overflow-y-auto">
          <FileExplorer
            files={fileTree}
            onFileSelect={setSelectedFile}
            selectedFileId={selectedFile?.id}
          />
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        {selectedFile && selectedFile.type === 'file' ? (
          <>
            {/* File Header / Summary */}
            <div className="border-b border-gray-200 p-6 bg-white shrink-0">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-lg font-medium">{selectedFile.name}</h3>
                <span className="px-2 py-0.5 bg-cyan-50 text-cyan-700 border border-cyan-200 rounded text-xs font-mono">
                  {selectedFile.name.split('.').pop()?.toUpperCase() || 'FILE'}
                </span>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">{selectedFile.summary}</p>
            </div>

            {/* Code preview */}
            <div className="flex-1 overflow-auto p-6 bg-gray-50">
              <pre className="bg-gray-900 text-gray-100 p-6 rounded-lg overflow-x-auto text-sm leading-relaxed font-mono">
                <code>{selectedFile.content}</code>
              </pre>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 bg-gray-50">
            <p className="text-sm">Select a file from the sidebar to view its code</p>
          </div>
        )}
      </div>
    </div>
  );
}