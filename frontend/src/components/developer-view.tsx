import { useState, useEffect } from 'react';
import { FileExplorer, FileNode } from './file-explorer';
import { Sparkles, ChevronDown, ChevronUp, Search, FileText, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

// Maps file extensions to Prism language identifiers
const EXT_TO_LANG: Record<string, string> = {
  ts: 'typescript', tsx: 'tsx', js: 'javascript', jsx: 'jsx',
  py: 'python', rs: 'rust', go: 'go', java: 'java',
  c: 'c', cpp: 'cpp', cs: 'csharp', rb: 'ruby',
  php: 'php', swift: 'swift', kt: 'kotlin', sh: 'bash',
  yaml: 'yaml', yml: 'yaml', json: 'json', toml: 'toml',
  md: 'markdown', html: 'html', css: 'css', scss: 'scss',
  sql: 'sql', dockerfile: 'dockerfile',
};

function getLanguage(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  return EXT_TO_LANG[ext] ?? 'text';
}

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

// Flatten the entire tree into a list of file nodes for search results
function flattenFiles(nodes: FileNode[]): FileNode[] {
  const result: FileNode[] = [];
  for (const node of nodes) {
    if (node.type === 'file') {
      result.push(node);
    } else if (node.children) {
      result.push(...flattenFiles(node.children));
    }
  }
  return result;
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
  // Track which specific file is being summarized (not just a boolean)
  // This prevents wrong loading states when switching files quickly
  const [summarizingFileId, setSummarizingFileId] = useState<string | null>(null);
  const [isSummaryOpen, setIsSummaryOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

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
    setSummarizingFileId(file.id);
    try {
      const response = await fetch("http://localhost:3001/summarize-file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ file_name: file.name, file_content: content }),
      });

      if (response.ok) {
        const data = await response.json();
        // Only store the summary if it's actually non-empty
        if (data.summary && data.summary.trim()) {
          setFileSummaries((prev) => ({ ...prev, [file.id]: data.summary }));
        } else {
          // Mark as explicitly failed so we don't retry on every render
          setFileSummaries((prev) => ({ ...prev, [file.id]: '__failed__' }));
        }
      } else {
        setFileSummaries((prev) => ({ ...prev, [file.id]: '__failed__' }));
      }
    } catch (err) {
      console.error("Failed to fetch file summary", err);
      setFileSummaries((prev) => ({ ...prev, [file.id]: '__failed__' }));
    } finally {
      setSummarizingFileId(null);
    }
  };

  if (!fileTree) {
    return <div className="p-8 text-gray-500">Waiting for repository files...</div>;
  }

  const currentContent = selectedFile ? fileContents[selectedFile.id] : undefined;

  // Compute filtered file list whenever the search query changes
  const searchResults = searchQuery.trim()
    ? flattenFiles(fileTree).filter((f) =>
        f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (f.path ?? '').toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  return (
    <div className="flex h-full">
      {/* Sidebar (File Tree) */}
      <div className="w-72 border-r border-gray-200 bg-gray-50 shrink-0 flex flex-col">
        {/* Header + search input */}
        <div className="px-4 py-3 border-b border-gray-200 space-y-2">
          <h3 className="text-sm font-medium text-gray-700">Repository Files</h3>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-7 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {searchQuery.trim() ? (
            // Search results: flat list
            searchResults.length > 0 ? (
              <div className="py-1">
                {searchResults.map((file) => (
                  <div
                    key={file.id}
                    onClick={() => { setSelectedFile(file); setSearchQuery(''); }}
                    className={`flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-gray-100 transition-colors ${
                      selectedFile?.id === file.id ? 'bg-blue-50 border-l-2 border-blue-600' : ''
                    }`}
                  >
                    <FileText className="size-4 text-gray-400 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-gray-800 truncate">{file.name}</div>
                      <div className="text-[10px] text-gray-400 truncate">{file.path}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-4 py-6 text-center text-xs text-gray-400">
                No files match "{searchQuery}"
              </div>
            )
          ) : (
            // Normal tree view
            <FileExplorer
              files={fileTree}
              onFileSelect={setSelectedFile}
              selectedFileId={selectedFile?.id}
            />
          )}
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
                  {summarizingFileId === selectedFile.id ? (
                    <div className="flex items-center gap-2 text-blue-600 text-sm animate-pulse pt-3">
                      <Sparkles className="size-4" />
                      Generating AI summary...
                    </div>
                  ) : fileSummaries[selectedFile.id] === '__failed__' ? (
                    <p className="text-gray-400 text-sm italic pt-3">Summary unavailable for this file.</p>
                  ) : fileSummaries[selectedFile.id] ? (
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
                        {fileSummaries[selectedFile.id]}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-gray-400 text-sm animate-pulse pt-3">
                      <Sparkles className="size-4" />
                      Loading summary...
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Code preview */}
            <div className="flex-1 overflow-auto bg-[#1e1e1e]">
              {isLoadingContent && currentContent === undefined ? (
                <div className="flex items-center gap-2 text-blue-400 text-sm animate-pulse p-6">
                  <Sparkles className="size-4" />
                  Loading file content...
                </div>
              ) : (
                <SyntaxHighlighter
                  language={getLanguage(selectedFile.name)}
                  style={vscDarkPlus}
                  showLineNumbers
                  wrapLongLines={false}
                  customStyle={{
                    margin: 0,
                    borderRadius: 0,
                    fontSize: '0.8rem',
                    lineHeight: '1.6',
                    height: '100%',
                    background: '#1e1e1e',
                  }}
                  lineNumberStyle={{ color: '#555', minWidth: '2.5em' }}
                >
                  {currentContent ?? ''}
                </SyntaxHighlighter>
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
