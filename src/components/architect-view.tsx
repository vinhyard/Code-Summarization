export function ArchitectView() {
  return (
    <div className="p-8 max-w-6xl">
      <h2 className="text-2xl mb-1">System Architecture</h2>
      <p className="text-gray-500 text-sm mb-8">Auto-generated from repository analysis · api-gateway</p>

      {/* SVG Diagram */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8 overflow-x-auto">
        <svg viewBox="0 0 860 410" className="w-full" style={{ minWidth: '640px' }}>
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#94a3b8" />
            </marker>
            <marker id="arrow-blue" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#3b82f6" />
            </marker>
          </defs>

          {/* ── Edges ── */}
          {/* Client → API Gateway */}
          <line x1="122" y1="200" x2="183" y2="200" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#arrow)" />
          {/* API Gateway → Auth Service */}
          <line x1="370" y1="162" x2="443" y2="87" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="5,3" markerEnd="url(#arrow-blue)" />
          {/* API Gateway → User Service */}
          <line x1="370" y1="200" x2="443" y2="200" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="5,3" markerEnd="url(#arrow-blue)" />
          {/* API Gateway → Order Service */}
          <line x1="370" y1="238" x2="443" y2="313" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="5,3" markerEnd="url(#arrow-blue)" />
          {/* API Gateway ↔ Redis */}
          <line x1="272" y1="282" x2="265" y2="333" stroke="#f97316" strokeWidth="1.5" markerEnd="url(#arrow)" />
          {/* Services → PostgreSQL */}
          <line x1="600" y1="87"  x2="663" y2="158" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#arrow)" />
          <line x1="600" y1="200" x2="663" y2="200" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#arrow)" />
          <line x1="600" y1="313" x2="663" y2="243" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#arrow)" />

          {/* ── Edge labels ── */}
          {/* HTTP */}
          <rect x="137" y="185" width="30" height="14" rx="3" fill="white" stroke="#e2e8f0" strokeWidth="1" />
          <text x="152" y="196" textAnchor="middle" fontSize="9" fill="#64748b" fontFamily="monospace">HTTP</text>
          {/* gRPC labels */}
          <rect x="393" y="117" width="30" height="14" rx="3" fill="#eff6ff" stroke="#bfdbfe" strokeWidth="1" />
          <text x="408" y="128" textAnchor="middle" fontSize="9" fill="#3b82f6" fontFamily="monospace">gRPC</text>
          <rect x="393" y="185" width="30" height="14" rx="3" fill="#eff6ff" stroke="#bfdbfe" strokeWidth="1" />
          <text x="408" y="196" textAnchor="middle" fontSize="9" fill="#3b82f6" fontFamily="monospace">gRPC</text>
          <rect x="393" y="260" width="30" height="14" rx="3" fill="#eff6ff" stroke="#bfdbfe" strokeWidth="1" />
          <text x="408" y="271" textAnchor="middle" fontSize="9" fill="#3b82f6" fontFamily="monospace">gRPC</text>
          {/* Redis label */}
          <rect x="224" y="300" width="38" height="14" rx="3" fill="#fff7ed" stroke="#fed7aa" strokeWidth="1" />
          <text x="243" y="311" textAnchor="middle" fontSize="9" fill="#ea580c" fontFamily="monospace">Redis</text>
          {/* SQL labels */}
          <rect x="621" y="111" width="22" height="14" rx="3" fill="white" stroke="#e2e8f0" strokeWidth="1" />
          <text x="632" y="122" textAnchor="middle" fontSize="9" fill="#64748b" fontFamily="monospace">SQL</text>
          <rect x="621" y="185" width="22" height="14" rx="3" fill="white" stroke="#e2e8f0" strokeWidth="1" />
          <text x="632" y="196" textAnchor="middle" fontSize="9" fill="#64748b" fontFamily="monospace">SQL</text>
          <rect x="621" y="263" width="22" height="14" rx="3" fill="white" stroke="#e2e8f0" strokeWidth="1" />
          <text x="632" y="274" textAnchor="middle" fontSize="9" fill="#64748b" fontFamily="monospace">SQL</text>

          {/* ── Nodes ── */}

          {/* Client */}
          <rect x="10" y="170" width="112" height="60" rx="8" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
          <text x="66" y="196" textAnchor="middle" fontSize="12" fontWeight="600" fill="#334155" fontFamily="sans-serif">Client</text>
          <text x="66" y="214" textAnchor="middle" fontSize="10" fill="#94a3b8" fontFamily="sans-serif">Browser / Mobile</text>

          {/* API Gateway — main hero box */}
          <rect x="183" y="118" width="187" height="164" rx="10" fill="#eff6ff" stroke="#3b82f6" strokeWidth="2" />
          <text x="276" y="148" textAnchor="middle" fontSize="13" fontWeight="700" fill="#1d4ed8" fontFamily="sans-serif">API Gateway</text>
          <line x1="196" y1="158" x2="357" y2="158" stroke="#bfdbfe" strokeWidth="1" />
          <text x="276" y="176" textAnchor="middle" fontSize="10" fill="#3b82f6" fontFamily="sans-serif">● Rate Limiting</text>
          <text x="276" y="194" textAnchor="middle" fontSize="10" fill="#3b82f6" fontFamily="sans-serif">● JWT Auth</text>
          <text x="276" y="212" textAnchor="middle" fontSize="10" fill="#3b82f6" fontFamily="sans-serif">● Load Balancing</text>
          <text x="276" y="230" textAnchor="middle" fontSize="10" fill="#3b82f6" fontFamily="sans-serif">● Request Routing</text>
          <text x="276" y="266" textAnchor="middle" fontSize="9" fill="#93c5fd" fontFamily="monospace">Go 1.22 · :8080</text>

          {/* Auth Service */}
          <rect x="443" y="57" width="157" height="60" rx="8" fill="#f0fdf4" stroke="#22c55e" strokeWidth="1.5" />
          <text x="521" y="83" textAnchor="middle" fontSize="12" fontWeight="600" fill="#15803d" fontFamily="sans-serif">Auth Service</text>
          <text x="521" y="101" textAnchor="middle" fontSize="10" fill="#86efac" fontFamily="monospace">:3001 · RS256 JWT</text>

          {/* User Service */}
          <rect x="443" y="170" width="157" height="60" rx="8" fill="#f0fdf4" stroke="#22c55e" strokeWidth="1.5" />
          <text x="521" y="196" textAnchor="middle" fontSize="12" fontWeight="600" fill="#15803d" fontFamily="sans-serif">User Service</text>
          <text x="521" y="214" textAnchor="middle" fontSize="10" fill="#86efac" fontFamily="monospace">:3002 · REST</text>

          {/* Order Service */}
          <rect x="443" y="283" width="157" height="60" rx="8" fill="#f0fdf4" stroke="#22c55e" strokeWidth="1.5" />
          <text x="521" y="309" textAnchor="middle" fontSize="12" fontWeight="600" fill="#15803d" fontFamily="sans-serif">Order Service</text>
          <text x="521" y="327" textAnchor="middle" fontSize="10" fill="#86efac" fontFamily="monospace">:3003 · REST</text>

          {/* Redis Cache */}
          <rect x="198" y="333" width="144" height="55" rx="8" fill="#fff7ed" stroke="#f97316" strokeWidth="1.5" />
          <text x="270" y="358" textAnchor="middle" fontSize="12" fontWeight="600" fill="#c2410c" fontFamily="sans-serif">Redis Cache</text>
          <text x="270" y="376" textAnchor="middle" fontSize="10" fill="#fdba74" fontFamily="monospace">Rate limit counters</text>

          {/* PostgreSQL */}
          <rect x="663" y="118" width="170" height="164" rx="10" fill="#faf5ff" stroke="#a855f7" strokeWidth="1.5" />
          <text x="748" y="148" textAnchor="middle" fontSize="13" fontWeight="700" fill="#7e22ce" fontFamily="sans-serif">PostgreSQL</text>
          <line x1="676" y1="158" x2="820" y2="158" stroke="#e9d5ff" strokeWidth="1" />
          <text x="748" y="176" textAnchor="middle" fontSize="10" fill="#a855f7" fontFamily="sans-serif">users</text>
          <text x="748" y="194" textAnchor="middle" fontSize="10" fill="#a855f7" fontFamily="sans-serif">sessions</text>
          <text x="748" y="212" textAnchor="middle" fontSize="10" fill="#a855f7" fontFamily="sans-serif">orders</text>
          <text x="748" y="230" textAnchor="middle" fontSize="10" fill="#a855f7" fontFamily="sans-serif">order_items</text>
          <text x="748" y="266" textAnchor="middle" fontSize="9" fill="#d8b4fe" fontFamily="monospace">Postgres 16 · :5432</text>
        </svg>
      </div>

      {/* Service cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { name: 'API Gateway', lang: 'Go', color: 'blue', detail: 'Entry point · Port 8080', tags: ['Rate limit', 'JWT', 'Routing'] },
          { name: 'Auth Service', lang: 'Go', color: 'green', detail: 'RS256 JWT · Port 3001', tags: ['Login', 'Refresh', 'Revoke'] },
          { name: 'User Service', lang: 'Go', color: 'green', detail: 'CRUD profiles · Port 3002', tags: ['GET /users', 'PUT /users', 'DELETE'] },
          { name: 'Order Service', lang: 'Go', color: 'green', detail: 'Order lifecycle · Port 3003', tags: ['Create', 'Track', 'Fulfill'] },
        ].map((svc) => (
          <div key={svc.name} className="border border-gray-200 rounded-lg p-4 bg-white">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-sm">{svc.name}</span>
              <span className="px-2 py-0.5 bg-cyan-50 text-cyan-700 rounded text-xs font-mono">{svc.lang}</span>
            </div>
            <p className="text-xs text-gray-500 mb-3">{svc.detail}</p>
            <div className="flex flex-wrap gap-1">
              {svc.tags.map((t) => (
                <span key={t} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{t}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
