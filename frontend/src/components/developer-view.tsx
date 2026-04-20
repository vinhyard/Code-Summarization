import { useState, useEffect } from 'react';
import { FileExplorer, FileNode } from './file-explorer';
import { Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

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
  const [isSummaryOpen, setIsSummaryOpen] = useState(true);

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
            <div className="border-b border-gray-200 bg-white shrink-0">
              {/* Always-visible header row */}
              <div
                className="flex items-center justify-between gap-2 px-6 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setIsSummaryOpen((prev) => !prev)}
              >
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-medium">{selectedFile.name}</h3>
                  <span className="px-2 py-0.5 bg-cyan-50 text-cyan-700 border border-cyan-200 rounded text-xs font-mono">
                    {selectedFile.name.split('.').pop()?.toUpperCase() || 'FILE'}
                  </span>
                </div>
                <button
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors shrink-0"
                  title={isSummaryOpen ? 'Collapse summary' : 'Expand summary'}
                >
                  {isSummaryOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                  <span>{isSummaryOpen ? 'Hide' : 'Summary'}</span>
                </button>
              </div>

              {/* Collapsible summary body */}
              {isSummaryOpen && (
                <div className="px-6 pb-4 max-h-64 overflow-y-auto border-t border-gray-100">
                  {isSummarizing && !fileSummaries[selectedFile.id] ? (
                    <div className="flex items-center gap-2 text-blue-600 text-sm animate-pulse pt-3">
                      <Sparkles className="size-4" />
                      Generating AI summary...
                    </div>
                  ) : (
                    <div className="text-gray-600 text-sm leading-relaxed prose prose-sm max-w-none pt-3">
                      <ReactMarkdown
                        components={{
                          h1: ({ children }) => <h1 className="text-base font-semibold text-gray-900 mt-4 mb-1">{children}</h1>,
                          h2: ({ children }) => <h2 className="text-sm font-semibold text-gray-800 mt-3 mb-1">{children}</h2>,
                          strong: ({ children }) => <strong className="font-semibold text-gray-800">{children}</strong>,
                          ul: ({ children }) => <ul className="list-disc list-inside space-y-0.5 my-1">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal list-inside space-y-0.5 my-1">{children}</ol>,
                          li: ({ children }) => <li className="text-gray-600">{children}</li>,
                          p: ({ children }) => <p className="mb-1">{children}</p>,
                          code: ({ children }) => <code className="bg-gray-100 text-gray-800 px-1 rounded text-xs font-mono">{children}</code>,
                        }}
                      >
                        {fileSummaries[selectedFile.id] || selectedFile.summary}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
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
