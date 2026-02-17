import { ExternalLink } from 'lucide-react';
import * as Tooltip from '@radix-ui/react-tooltip';

interface TechItem {
  name: string;
  description: string;
  docsUrl: string;
}

const TECH_STACK: TechItem[] = [
  {
    name: 'React',
    description: 'A JavaScript library for building user interfaces',
    docsUrl: 'https://react.dev',
  },
  {
    name: 'Vite',
    description: 'Next generation frontend tooling',
    docsUrl: 'https://vitejs.dev',
  },
  {
    name: 'TypeScript',
    description: 'Typed superset of JavaScript',
    docsUrl: 'https://www.typescriptlang.org',
  },
  {
    name: 'Node.js',
    description: 'JavaScript runtime built on Chrome\'s V8 engine',
    docsUrl: 'https://nodejs.org',
  },
  {
    name: 'Tailwind CSS',
    description: 'A utility-first CSS framework',
    docsUrl: 'https://tailwindcss.com',
  },
  {
    name: 'PostgreSQL',
    description: 'Open source relational database',
    docsUrl: 'https://www.postgresql.org',
  },
];

export function OverviewTab() {
  return (
    <div className="p-8 max-w-5xl">
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-8 mb-8 border border-blue-100">
        <h2 className="text-2xl mb-3">Project Summary</h2>
        <p className="text-gray-700 leading-relaxed">
          This is a modern full-stack web application built with React and TypeScript.
          The project uses Vite for fast development and build times, with a PostgreSQL
          database for data persistence. The frontend leverages Tailwind CSS for styling
          and implements a component-based architecture for maintainability and scalability.
        </p>
      </div>

      <div>
        <h3 className="text-xl mb-4">Tech Stack</h3>
        <Tooltip.Provider delayDuration={200}>
          <div className="flex flex-wrap gap-3">
            {TECH_STACK.map((tech) => (
              <Tooltip.Root key={tech.name}>
                <Tooltip.Trigger asChild>
                  <button className="px-4 py-2 bg-white border border-gray-200 rounded-full hover:border-blue-400 hover:bg-blue-50 transition-colors">
                    {tech.name}
                  </button>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content
                    className="bg-gray-900 text-white px-4 py-3 rounded-lg shadow-lg max-w-xs z-50"
                    sideOffset={5}
                  >
                    <p className="text-sm mb-2">{tech.description}</p>
                    <a
                      href={tech.docsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-300 hover:text-blue-200 text-sm flex items-center gap-1"
                    >
                      View Docs
                      <ExternalLink className="size-3" />
                    </a>
                    <Tooltip.Arrow className="fill-gray-900" />
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>
            ))}
          </div>
        </Tooltip.Provider>
      </div>
    </div>
  );
}
