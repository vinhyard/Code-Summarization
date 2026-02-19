import { ArrowRight, ShieldCheck, Users, ShoppingCart, AlertCircle } from 'lucide-react';

const PERSONAS = [
  { role: 'Frontend Developer', desc: 'Browser-based SPA consuming REST endpoints via the gateway', badge: 'Web' },
  { role: 'Mobile Client', desc: 'iOS / Android app authenticating with JWT and syncing orders', badge: 'Mobile' },
  { role: 'Third-party Integrator', desc: 'External partner accessing the public API with a provisioned API key', badge: 'Partner' },
];

const FLOWS = [
  {
    icon: ShieldCheck,
    title: 'Authentication Flow',
    color: 'blue',
    steps: ['POST /auth/login with credentials', 'Receive signed JWT (RS256, 1 h TTL)', 'Attach Bearer token to every request', 'POST /auth/refresh before expiry'],
  },
  {
    icon: Users,
    title: 'User Management',
    color: 'green',
    steps: ['GET /users/{id} — fetch profile', 'PUT /users/{id} — update profile fields', 'Requires authenticated session', 'Rate limited: 100 req / min per IP'],
  },
  {
    icon: ShoppingCart,
    title: 'Order Processing',
    color: 'purple',
    steps: ['POST /orders — submit new order', 'GET /orders/{id} — poll order status', 'PUT /orders/{id}/cancel — cancel if pending', 'Rate limited: 50 req / min per IP'],
  },
];

const ENDPOINTS = [
  { method: 'POST', path: '/auth/login', desc: 'Exchange credentials for JWT', auth: false },
  { method: 'POST', path: '/auth/refresh', desc: 'Refresh an expiring token', auth: true },
  { method: 'GET',  path: '/users/{id}',  desc: 'Retrieve user profile', auth: true },
  { method: 'PUT',  path: '/users/{id}',  desc: 'Update user profile', auth: true },
  { method: 'POST', path: '/orders',      desc: 'Create a new order', auth: true },
  { method: 'GET',  path: '/orders/{id}', desc: 'Get order status', auth: true },
  { method: 'PUT',  path: '/orders/{id}/cancel', desc: 'Cancel a pending order', auth: true },
];

const METHOD_COLOR: Record<string, string> = {
  GET:  'bg-green-50 text-green-700 border border-green-200',
  POST: 'bg-blue-50 text-blue-700 border border-blue-200',
  PUT:  'bg-orange-50 text-orange-700 border border-orange-200',
};

const ERRORS = [
  { code: '401', label: 'Unauthorized', desc: 'Missing or expired JWT. Re-authenticate to get a fresh token.' },
  { code: '403', label: 'Forbidden', desc: 'Token is valid but lacks the required scope for this resource.' },
  { code: '429', label: 'Too Many Requests', desc: 'Rate limit exceeded. Back off and retry after the Retry-After header value.' },
  { code: '502', label: 'Bad Gateway', desc: 'Downstream service is unavailable. Retry with exponential back-off.' },
];

export function EndUserView() {
  return (
    <div className="p-8 max-w-5xl space-y-10">
      <div>
        <h2 className="text-2xl mb-1">API Consumer Guide</h2>
        <p className="text-gray-500 text-sm">Auto-generated from source analysis · api-gateway</p>
      </div>

      {/* Personas */}
      <section>
        <h3 className="text-lg mb-4">Who Uses This API</h3>
        <div className="grid grid-cols-3 gap-4">
          {PERSONAS.map((p) => (
            <div key={p.role} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-sm">{p.role}</span>
                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{p.badge}</span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* User flows */}
      <section>
        <h3 className="text-lg mb-4">Key User Flows</h3>
        <div className="grid grid-cols-3 gap-4">
          {FLOWS.map(({ icon: Icon, title, color, steps }) => {
            const bg: Record<string, string> = { blue: 'bg-blue-50 border-blue-100', green: 'bg-green-50 border-green-100', purple: 'bg-purple-50 border-purple-100' };
            const ic: Record<string, string> = { blue: 'text-blue-600', green: 'text-green-600', purple: 'text-purple-600' };
            return (
              <div key={title} className={`border rounded-lg p-4 ${bg[color]}`}>
                <div className="flex items-center gap-2 mb-3">
                  <Icon className={`size-4 ${ic[color]}`} />
                  <span className="font-medium text-sm">{title}</span>
                </div>
                <ol className="space-y-2">
                  {steps.map((step, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                      <ArrowRight className="size-3 mt-0.5 shrink-0 text-gray-400" />
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            );
          })}
        </div>
      </section>

      {/* Endpoint table */}
      <section>
        <h3 className="text-lg mb-4">Available Endpoints</h3>
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 w-16">Method</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Path</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Description</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 w-20">Auth</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {ENDPOINTS.map((ep) => (
                <tr key={ep.path} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-mono font-medium ${METHOD_COLOR[ep.method]}`}>{ep.method}</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-700">{ep.path}</td>
                  <td className="px-4 py-3 text-xs text-gray-600">{ep.desc}</td>
                  <td className="px-4 py-3">
                    {ep.auth
                      ? <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded text-xs">JWT</span>
                      : <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">None</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Errors */}
      <section>
        <h3 className="text-lg mb-4">Common Errors</h3>
        <div className="grid grid-cols-2 gap-3">
          {ERRORS.map((e) => (
            <div key={e.code} className="flex gap-3 border border-gray-200 rounded-lg p-4">
              <AlertCircle className="size-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-sm font-semibold text-gray-800">{e.code}</span>
                  <span className="text-sm text-gray-600">{e.label}</span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">{e.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
