import { ChevronRight, ChevronDown, FileText, Folder, FolderOpen } from 'lucide-react';
import { useState } from 'react';

export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  content?: string;
  summary?: string;
}

interface FileExplorerProps {
  files: FileNode[];
  onFileSelect: (file: FileNode) => void;
  selectedFileId?: string;
}

export function FileExplorer({ files, onFileSelect, selectedFileId }: FileExplorerProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['root', 'src', 'components']));

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const renderNode = (node: FileNode, depth: number = 0) => {
    const isExpanded = expandedFolders.has(node.id);
    const isSelected = selectedFileId === node.id;

    if (node.type === 'folder') {
      return (
        <div key={node.id}>
          <div
            onClick={() => toggleFolder(node.id)}
            className={`flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-gray-100 rounded transition-colors ${
              isSelected ? 'bg-blue-50' : ''
            }`}
            style={{ paddingLeft: `${depth * 16 + 12}px` }}
          >
            {isExpanded ? (
              <ChevronDown className="size-4 text-gray-500" />
            ) : (
              <ChevronRight className="size-4 text-gray-500" />
            )}
            {isExpanded ? (
              <FolderOpen className="size-4 text-blue-500" />
            ) : (
              <Folder className="size-4 text-gray-400" />
            )}
            <span className="text-sm">{node.name}</span>
          </div>
          {isExpanded && node.children && (
            <div>
              {node.children.map((child) => renderNode(child, depth + 1))}
            </div>
          )}
        </div>
      );
    }

    return (
      <div
        key={node.id}
        onClick={() => onFileSelect(node)}
        className={`flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-gray-100 rounded transition-colors ${
          isSelected ? 'bg-blue-50 border-l-2 border-blue-600' : ''
        }`}
        style={{ paddingLeft: `${depth * 16 + 12}px` }}
      >
        <div className="size-4" />
        <FileText className="size-4 text-gray-400" />
        <span className="text-sm">{node.name}</span>
      </div>
    );
  };

  return (
    <div className="h-full overflow-y-auto py-2">
      {files.map((node) => renderNode(node))}
    </div>
  );
}
