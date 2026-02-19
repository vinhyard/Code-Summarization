import { ExternalLink, FileCode2, GitBranch, Package, Server, Lightbulb } from 'lucide-react';
import * as Tooltip from '@radix-ui/react-tooltip';

interface TechItem {
  name: string;
  category: string;
  description: string;
  docsUrl: string;
}

const METRICS = [
  { label: 'Files Analyzed', value: '47', icon: FileCode2, color: 'text-blue-600', bg: 'bg-blue-50' },
  { label: 'Lines of Code', value: '8,234', icon: GitBranch, color: 'text-green-600', bg: 'bg-green-50' },
  { label: 'Dependencies', value: '23', icon: Package, color: 'text-orange-600', bg: 'bg-orange-50' },
  { label: 'Services', value: '3', icon: Server, color: 'text-purple-600', bg: 'bg-purple-50' },
];

const TECH_STACK: TechItem[] = [
  { name: 'Go 1.22', category: 'Language', description: 'Primary language for the gateway and all downstream services. Chosen for its low-latency concurrency model and small binary footprint.', docsUrl: 'https://go.dev' },
  { name: 'Redis', category: 'Cache', description: 'Stores sliding-window rate-limit counters and short-lived session tokens. Configured for LRU eviction.', docsUrl: 'https://redis.io' },
  { name: 'PostgreSQL 16', category: 'Database', description: 'Primary relational store for users, sessions, orders, and order_items. Uses pg_trgm for full-text search on user profiles.', docsUrl: 'https://www.postgresql.org' },
  { name: 'Docker', category: 'Infrastructure', description: 'Each service ships as a multi-stage Docker image. Final images are ~12 MB using distroless base.', docsUrl: 'https://www.docker.com' },
  { name: 'Kubernetes', category: 'Infrastructure', description: 'Production deployment target. HPA scales the gateway pod from 2 to 20 replicas based on CPU and RPS metrics.', docsUrl: 'https://kubernetes.io' },
  { name: 'gRPC', category: 'Protocol', description: 'Internal communication between the gateway and downstream services. Protobuf contracts are defined in /proto.', docsUrl: 'https://grpc.io' },
  { name: 'JWT (RS256)', category: 'Auth', description: 'Access tokens are RS256-signed JWTs with a 1-hour TTL. The public key is mounted as a Kubernetes secret.', docsUrl: 'https://jwt.io' },
];

const CATEGORY_COLOR: Record<string, string> = {
  Language:       'bg-cyan-50 text-cyan-700 border border-cyan-200',
  Cache:          'bg-orange-50 text-orange-700 border border-orange-200',
  Database:       'bg-purple-50 text-purple-700 border border-purple-200',
  Infrastructure: 'bg-gray-100 text-gray-600 border border-gray-200',
  Protocol:       'bg-blue-50 text-blue-700 border border-blue-200',
  Auth:           'bg-green-50 text-green-700 border border-green-200',
};

const INSIGHTS = [
  'Entry point: cmd/gateway/main.go — sets up the router and starts the HTTP server on :8080',
  'JWT auth middleware validates RS256 tokens before any request reaches a downstream service',
  'Redis-backed sliding-window rate limiting: 100 req/min for user endpoints, 50 req/min for orders',
  'Reverse proxy uses httputil.ReverseProxy with a 90 s idle connection timeout',
  'All services are Kubernetes-ready — HPA, liveness, and readiness probes are configured',
];

export function OverviewTab() {
  return (
    <div className="p-8 max-w-5xl space-y-8">

      {/* Summary card */}
      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-8 border border-blue-100">
        <h2 className="text-2xl mb-3">Project Summary</h2>
        <p className="text-gray-700 leading-relaxed">
          <strong>api-gateway</strong> is a high-performance API gateway written in Go that acts as the single
          entry point for all client traffic. It handles JWT authentication, Redis-backed rate limiting,
          and reverse-proxy routing to three downstream gRPC/REST services — <em>Auth</em>, <em>User</em>,
          and <em>Order</em>. The project is fully containerized with Docker and ships Kubernetes manifests
          for production deployment with horizontal auto-scaling.
        </p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-4 gap-4">
        {METRICS.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="border border-gray-200 rounded-xl p-4 bg-white">
            <div className={`inline-flex items-center justify-center size-9 rounded-lg ${bg} mb-3`}>
              <Icon className={`size-4 ${color}`} />
            </div>
            <div className="text-2xl font-semibold text-gray-900 mb-0.5">{value}</div>
            <div className="text-xs text-gray-500">{label}</div>
          </div>
        ))}
      </div>

      {/* Tech stack */}
      <div>
        <h3 className="text-lg mb-4">Tech Stack</h3>
        <Tooltip.Provider delayDuration={150}>
          <div className="flex flex-wrap gap-2">
            {TECH_STACK.map((tech) => (
              <Tooltip.Root key={tech.name}>
                <Tooltip.Trigger asChild>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-full hover:border-blue-400 hover:bg-blue-50 transition-colors">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${CATEGORY_COLOR[tech.category]}`}>
                      {tech.category}
                    </span>
                    <span className="text-sm text-gray-800">{tech.name}</span>
                  </button>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content
                    className="bg-gray-900 text-white px-4 py-3 rounded-lg shadow-xl max-w-xs z-50"
                    sideOffset={6}
                  >
                    <p className="text-sm mb-2 leading-relaxed">{tech.description}</p>
                    <a
                      href={tech.docsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-300 hover:text-blue-200 text-xs flex items-center gap-1"
                    >
                      View Docs <ExternalLink className="size-3" />
                    </a>
                    <Tooltip.Arrow className="fill-gray-900" />
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>
            ))}
          </div>
        </Tooltip.Provider>
      </div>

      {/* Key insights */}
      <div>
        <h3 className="text-lg mb-4 flex items-center gap-2">
          <Lightbulb className="size-5 text-amber-500" />
          Key Insights
        </h3>
        <ul className="space-y-2">
          {INSIGHTS.map((insight, i) => (
            <li key={i} className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-100 rounded-lg text-sm text-gray-700">
              <span className="shrink-0 size-5 flex items-center justify-center bg-amber-200 text-amber-800 rounded-full text-xs font-semibold mt-0.5">
                {i + 1}
              </span>
              {insight}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
