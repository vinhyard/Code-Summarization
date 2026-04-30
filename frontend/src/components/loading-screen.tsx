interface LoadingScreenProps {
  projectName: string;
}





export function LoadingScreen({ projectName }: LoadingScreenProps) {



  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-8">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <h2 className="text-2xl mb-2">{projectName}</h2>
          <p className="text-gray-500 text-sm">Analyzing repository…</p>
        </div>

        <div className="space-y-4">
        </div>
      </div>
    </div>
  );
}
