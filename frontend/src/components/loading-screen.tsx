import { CheckCircle2, Circle, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';

interface LoadingScreenProps {
  projectName: string;
}

const STEPS = [
  'Cloning repository',
  'Parsing 47 source files',
  'Resolving module dependencies',
  'Generating architecture map',
  'Summarizing modules with AI',
];

// Cumulative delays (ms) at which each step is marked complete
const STEP_DELAYS = [400, 900, 1450, 2050, 2700];

export function LoadingScreen({ projectName }: LoadingScreenProps) {
  const [completedCount, setCompletedCount] = useState(0);

  useEffect(() => {
    const timers = STEP_DELAYS.map((delay, i) =>
      setTimeout(() => setCompletedCount(i + 1), delay)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-8">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <h2 className="text-2xl mb-2">{projectName}</h2>
          <p className="text-gray-500 text-sm">Analyzing repository…</p>
        </div>

        <div className="space-y-4">
          {STEPS.map((step, i) => {
            const isDone = i < completedCount;
            const isActive = i === completedCount;
            return (
              <div
                key={step}
                className={`flex items-center gap-3 transition-opacity duration-300 ${
                  i > completedCount ? 'opacity-30' : 'opacity-100'
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="size-5 text-green-500 shrink-0" />
                ) : isActive ? (
                  <Loader2 className="size-5 text-blue-600 animate-spin shrink-0" />
                ) : (
                  <Circle className="size-5 text-gray-300 shrink-0" />
                )}
                <span
                  className={`text-sm transition-colors ${
                    isDone
                      ? 'text-gray-400 line-through'
                      : isActive
                      ? 'text-gray-900 font-medium'
                      : 'text-gray-400'
                  }`}
                >
                  {step}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
