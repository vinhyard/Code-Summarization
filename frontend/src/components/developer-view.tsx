import { useState, useEffect } from 'react';
import { FileExplorer, FileNode } from './file-explorer';
import { Sparkles } from 'lucide-react';

interface DeveloperViewProps {
  repoUrl: string;
  fileTree?: FileNode[];
  fileSummaries: Record<string, string>;
  setFileSummaries: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  fileContents: Record<string, string>;
  setFileContents: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

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

export function DeveloperView({
  repoUrl,
  fileTree,
  fileSummaries,
  setFileSummaries,
  fileContents,
  setFileContents,
}: DeveloperViewProps) {
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);

  useEffect(() => {
    if (fileTree && fileTree.length > 0 && !selectedFile) {
      setSelectedFile(findFirstFile(fileTree));
    }
  }, [fileTree, selectedFile]);

  useEffect(() => {
    if (!selectedFile || selectedFile.type !== 'file') return;

    const cachedContent = fileContents[selectedFile.id];

    if (cachedContent !== undefined) {
      if (!fileSummaries[selectedFile.id]) {
        summarizeFile(selectedFile, cachedContent);
      }
      return;
    }

    loadFileContent(selectedFile);
  }, [selectedFile]);

  const loadFileContent = async (file: FileNode) => {
    if (!file.path) return;
    setIsLoadingContent(true);
    try {
      const response = await fetch("http://localhost:3001/file-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ repo_url: repoUrl, path: file.path }),
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.content ?? "";
        setFileContents((prev) => ({ ...prev, [file.id]: content }));

        if (!fileSummaries[file.id]) {
          summarizeFile(file, content);
        }
      }
    } catch (err) {
      console.error("Failed to fetch file content", err);
    } finally {
      setIsLoadingContent(false);
    }
  };

  const summarizeFile = async (file: FileNode, content: string) => {
    setIsSummarizing(true);
    try {
      const response = await fetch("http://localhost:3001/summarize-file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ file_name: file.name, file_content: content }),
      });

      if (response.ok) {
        const data = await response.json();
        setFileSummaries((prev) => ({ ...prev, [file.id]: data.summary }));
      }
    } catch (err) {
      console.error("Failed to fetch file summary", err);
    } finally {
      setIsSummarizing(false);
    }
  };

  if (!fileTree) {
    return <div className="p-8 text-gray-500">Waiting for repository files...</div>;
  }

  const currentContent = selectedFile ? fileContents[selectedFile.id] : undefined;

  return (
    <div className="flex h-full">
      {/* Sidebar (File Tree) */}
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

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        {selectedFile && selectedFile.type === 'file' ? (
          <>
            {/* File Header & Dynamic Summary */}
            <div className="border-b border-gray-200 p-6 bg-white shrink-0">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-lg font-medium">{selectedFile.name}</h3>
                <span className="px-2 py-0.5 bg-cyan-50 text-cyan-700 border border-cyan-200 rounded text-xs font-mono">
                  {selectedFile.name.split('.').pop()?.toUpperCase() || 'FILE'}
                </span>
              </div>

              {isSummarizing && !fileSummaries[selectedFile.id] ? (
                <div className="flex items-center gap-2 text-blue-600 text-sm animate-pulse">
                  <Sparkles className="size-4" />
                  Generating AI summary...
                </div>
              ) : (
                <p className="text-gray-600 text-sm leading-relaxed">
                  {fileSummaries[selectedFile.id] || selectedFile.summary}
                </p>
              )}
            </div>

            {/* Code preview */}
            <div className="flex-1 overflow-auto p-6 bg-gray-50">
              {isLoadingContent && currentContent === undefined ? (
                <div className="flex items-center gap-2 text-blue-600 text-sm animate-pulse">
                  <Sparkles className="size-4" />
                  Loading file content...
                </div>
              ) : (
                <pre className="bg-gray-900 text-gray-100 p-6 rounded-lg overflow-x-auto text-sm leading-relaxed font-mono">
                  <code>{currentContent ?? ''}</code>
                </pre>
              )}
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
