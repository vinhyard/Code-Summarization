import { Loader2 } from 'lucide-react';

interface LoadingScreenProps {
  projectName: string;
}

export function LoadingScreen({ projectName }: LoadingScreenProps) {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="mb-8 flex justify-center">
          <Loader2 className="size-16 text-blue-600 animate-spin" />
        </div>
        <h2 className="text-2xl mb-3">{projectName}</h2>
        <p className="text-gray-600">
          Analyzing architecture, tech stack, and files…
        </p>
      </div>
    </div>
  );
}
