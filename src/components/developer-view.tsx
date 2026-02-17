import { useState } from 'react';
import { FileExplorer, FileNode } from './file-explorer';

const MOCK_FILE_TREE: FileNode[] = [
  {
    id: 'src',
    name: 'src',
    type: 'folder',
    children: [
      {
        id: 'components',
        name: 'components',
        type: 'folder',
        children: [
          {
            id: 'button',
            name: 'Button.tsx',
            type: 'file',
            summary: 'A reusable button component that supports multiple variants (primary, secondary, outline) and sizes. It handles click events and can be disabled. Uses Tailwind CSS for styling and accepts custom className props for additional styling.',
            content: `import React from 'react';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  onClick,
  disabled = false,
  className = '',
}: ButtonProps) {
  const baseStyles = 'rounded-lg transition-colors';
  
  const variantStyles = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
    outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50',
  };
  
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={\`\${baseStyles} \${variantStyles[variant]} \${sizeStyles[size]} \${className}\`}
    >
      {children}
    </button>
  );
}`,
          },
          {
            id: 'header',
            name: 'Header.tsx',
            type: 'file',
            summary: 'The main navigation header component that displays the app logo, navigation links, and user profile. It includes responsive behavior and sticky positioning. The header uses a white background with subtle shadow for depth.',
            content: `import { Link } from 'react-router-dom';
import { User } from 'lucide-react';

export function Header() {
  return (
    <header className="sticky top-0 bg-white border-b border-gray-200 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <h1 className="text-xl">MyApp</h1>
            <nav className="flex gap-6">
              <Link to="/" className="text-gray-600 hover:text-gray-900">
                Home
              </Link>
              <Link to="/dashboard" className="text-gray-600 hover:text-gray-900">
                Dashboard
              </Link>
            </nav>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100">
            <User className="size-5" />
            <span>Profile</span>
          </button>
        </div>
      </div>
    </header>
  );
}`,
          },
        ],
      },
      {
        id: 'app',
        name: 'App.tsx',
        type: 'file',
        summary: 'The root application component that sets up routing, global providers, and theme configuration. It wraps the entire app with necessary context providers and handles initial app setup and authentication checks.',
        content: `import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Header } from './components/Header';
import { Home } from './pages/Home';
import { Dashboard } from './pages/Dashboard';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}`,
      },
    ],
  },
  {
    id: 'public',
    name: 'public',
    type: 'folder',
    children: [
      {
        id: 'index',
        name: 'index.html',
        type: 'file',
        summary: 'The main HTML template file that serves as the entry point for the application. Contains meta tags for SEO, favicon links, and the root div where React mounts the application.',
        content: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>MyApp</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`,
      },
    ],
  },
  {
    id: 'package',
    name: 'package.json',
    type: 'file',
    summary: 'The npm package configuration file that defines project dependencies, scripts, and metadata. Includes both runtime dependencies (React, Vite, etc.) and development dependencies (TypeScript, ESLint, etc.).',
    content: `{
  "name": "my-app",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0"
  }
}`,
  },
];

export function DeveloperView() {
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);

  return (
    <div className="flex h-full">
      {/* File tree */}
      <div className="w-80 border-r border-gray-200 bg-gray-50">
        <div className="p-4 border-b border-gray-200">
          <h3>File Explorer</h3>
        </div>
        <FileExplorer
          files={MOCK_FILE_TREE}
          onFileSelect={setSelectedFile}
          selectedFileId={selectedFile?.id}
        />
      </div>

      {/* Content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedFile && selectedFile.type === 'file' ? (
          <>
            {/* Summary section */}
            <div className="border-b border-gray-200 p-6 bg-white">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-lg">{selectedFile.name}</h3>
                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-sm">
                  {selectedFile.name.split('.').pop()?.toUpperCase()}
                </span>
              </div>
              <p className="text-gray-700 leading-relaxed">
                {selectedFile.summary}
              </p>
            </div>

            {/* Code preview */}
            <div className="flex-1 overflow-auto p-6 bg-gray-50">
              <div className="mb-2 text-sm text-gray-500">Code Preview</div>
              <pre className="bg-gray-900 text-gray-100 p-6 rounded-lg overflow-x-auto text-sm leading-relaxed">
                <code>{selectedFile.content}</code>
              </pre>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <p>Select a file to view its details</p>
          </div>
        )}
      </div>
    </div>
  );
}
