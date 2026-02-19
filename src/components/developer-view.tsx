import { useState } from 'react';
import { FileExplorer, FileNode } from './file-explorer';

const MOCK_FILE_TREE: FileNode[] = [
  {
    id: 'cmd',
    name: 'cmd',
    type: 'folder',
    children: [
      {
        id: 'cmd-gateway',
        name: 'gateway',
        type: 'folder',
        children: [
          {
            id: 'main-go',
            name: 'main.go',
            type: 'file',
            summary: 'Entry point for the API gateway binary. Loads configuration from environment variables, initialises the router with all middleware chains, and starts the HTTP server. A graceful-shutdown handler listens for SIGTERM so in-flight requests complete before the process exits.',
            content: `package main

import (
\t"context"
\t"log"
\t"net/http"
\t"os"
\t"os/signal"
\t"syscall"
\t"time"

\t"github.com/acme/api-gateway/internal/config"
\t"github.com/acme/api-gateway/internal/router"
)

func main() {
\tcfg := config.Load()

\tsrv := &http.Server{
\t\tAddr:         ":" + cfg.Port,
\t\tHandler:      router.New(cfg),
\t\tReadTimeout:  10 * time.Second,
\t\tWriteTimeout: 30 * time.Second,
\t\tIdleTimeout:  60 * time.Second,
\t}

\tgo func() {
\t\tlog.Printf("API Gateway listening on :%s", cfg.Port)
\t\tif err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
\t\t\tlog.Fatalf("server error: %v", err)
\t\t}
\t}()

\tquit := make(chan os.Signal, 1)
\tsignal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
\t<-quit

\tctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
\tdefer cancel()
\tlog.Println("Shutting down gracefully…")
\tsrv.Shutdown(ctx)
}`,
          },
        ],
      },
    ],
  },
  {
    id: 'internal',
    name: 'internal',
    type: 'folder',
    children: [
      {
        id: 'internal-config',
        name: 'config',
        type: 'folder',
        children: [
          {
            id: 'config-go',
            name: 'config.go',
            type: 'file',
            summary: 'Reads all runtime configuration from environment variables with sensible defaults. Returns a Config struct consumed by the router and middleware. The JWT public key is loaded from a PEM file path so it can be mounted as a Kubernetes secret.',
            content: `package config

import (
\t"os"

\t"github.com/redis/go-redis/v9"
)

type Config struct {
\tPort         string
\tServices     map[string]string
\tJWTPublicKey []byte
\tRedis        *redis.Client
}

func Load() *Config {
\trdb := redis.NewClient(&redis.Options{
\t\tAddr:     getEnv("REDIS_ADDR", "localhost:6379"),
\t\tPassword: getEnv("REDIS_PASSWORD", ""),
\t\tDB:       0,
\t})

\tpubKey, err := os.ReadFile(getEnv("JWT_PUBLIC_KEY_PATH", "./keys/public.pem"))
\tif err != nil {
\t\tpubKey = nil // auth middleware will reject all requests
\t}

\treturn &Config{
\t\tPort: getEnv("PORT", "8080"),
\t\tServices: map[string]string{
\t\t\t"auth":  getEnv("AUTH_SERVICE_URL",  "http://auth-service:3001"),
\t\t\t"user":  getEnv("USER_SERVICE_URL",  "http://user-service:3002"),
\t\t\t"order": getEnv("ORDER_SERVICE_URL", "http://order-service:3003"),
\t\t},
\t\tJWTPublicKey: pubKey,
\t\tRedis:        rdb,
\t}
}

func getEnv(key, fallback string) string {
\tif v := os.Getenv(key); v != "" {
\t\treturn v
\t}
\treturn fallback
}`,
          },
        ],
      },
      {
        id: 'internal-router',
        name: 'router',
        type: 'folder',
        children: [
          {
            id: 'router-go',
            name: 'router.go',
            type: 'file',
            summary: 'Registers all route groups and attaches the appropriate middleware chains to each. Auth routes are unauthenticated; user and order routes require a valid JWT and are rate-limited. Each route group proxies requests to its corresponding downstream service.',
            content: `package router

import (
\t"net/http"

\t"github.com/acme/api-gateway/internal/config"
\t"github.com/acme/api-gateway/internal/middleware"
\t"github.com/acme/api-gateway/internal/proxy"
)

func New(cfg *config.Config) http.Handler {
\tmux := http.NewServeMux()

\tauthProxy  := proxy.New(cfg.Services["auth"])
\tuserProxy  := proxy.New(cfg.Services["user"])
\torderProxy := proxy.New(cfg.Services["order"])

\t// Auth routes — no JWT required
\tmux.Handle("/auth/",
\t\tmiddleware.Chain(middleware.Logging)(authProxy),
\t)

\t// User routes — JWT + 100 req/min rate limit
\tmux.Handle("/users/",
\t\tmiddleware.Chain(
\t\t\tmiddleware.Logging,
\t\t\tmiddleware.Authenticate(cfg.JWTPublicKey),
\t\t\tmiddleware.RateLimit(cfg.Redis, 100),
\t\t)(userProxy),
\t)

\t// Order routes — JWT + 50 req/min rate limit
\tmux.Handle("/orders/",
\t\tmiddleware.Chain(
\t\t\tmiddleware.Logging,
\t\t\tmiddleware.Authenticate(cfg.JWTPublicKey),
\t\t\tmiddleware.RateLimit(cfg.Redis, 50),
\t\t)(orderProxy),
\t)

\treturn mux
}`,
          },
        ],
      },
      {
        id: 'internal-middleware',
        name: 'middleware',
        type: 'folder',
        children: [
          {
            id: 'auth-go',
            name: 'auth.go',
            type: 'file',
            summary: 'JWT authentication middleware. Extracts the Bearer token from the Authorization header, validates the RS256 signature against the gateway\'s public key, and stores the parsed claims in the request context. Returns 401 if the token is missing or invalid.',
            content: `package middleware

import (
\t"context"
\t"net/http"
\t"strings"

\t"github.com/golang-jwt/jwt/v5"
)

type contextKey string

const ClaimsKey contextKey = "claims"

func Authenticate(publicKey []byte) func(http.Handler) http.Handler {
\treturn func(next http.Handler) http.Handler {
\t\treturn http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
\t\t\tauthHeader := r.Header.Get("Authorization")
\t\t\tif !strings.HasPrefix(authHeader, "Bearer ") {
\t\t\t\thttp.Error(w, \`{"error":"unauthorized"}\`, http.StatusUnauthorized)
\t\t\t\treturn
\t\t\t}

\t\t\ttokenStr := strings.TrimPrefix(authHeader, "Bearer ")
\t\t\tclaims, err := parseJWT(tokenStr, publicKey)
\t\t\tif err != nil {
\t\t\t\thttp.Error(w, \`{"error":"invalid token"}\`, http.StatusUnauthorized)
\t\t\t\treturn
\t\t\t}

\t\t\tctx := context.WithValue(r.Context(), ClaimsKey, claims)
\t\t\tnext.ServeHTTP(w, r.WithContext(ctx))
\t\t})
\t}
}

func parseJWT(tokenStr string, pubKeyPEM []byte) (jwt.MapClaims, error) {
\tkey, err := jwt.ParseRSAPublicKeyFromPEM(pubKeyPEM)
\tif err != nil {
\t\treturn nil, err
\t}
\ttoken, err := jwt.Parse(tokenStr, func(t *jwt.Token) (interface{}, error) {
\t\tif _, ok := t.Method.(*jwt.SigningMethodRSA); !ok {
\t\t\treturn nil, jwt.ErrSignatureInvalid
\t\t}
\t\treturn key, nil
\t})
\tif err != nil || !token.Valid {
\t\treturn nil, err
\t}
\treturn token.Claims.(jwt.MapClaims), nil
}`,
          },
          {
            id: 'ratelimit-go',
            name: 'ratelimit.go',
            type: 'file',
            summary: 'Redis-backed sliding-window rate limiter. Increments a per-IP counter keyed by remote address and the current minute, sets a 1-minute TTL on first increment, and rejects requests that exceed the configured limit with 429. Sets X-RateLimit-* headers on every response.',
            content: `package middleware

import (
\t"fmt"
\t"net/http"
\t"time"

\t"github.com/redis/go-redis/v9"
)

func RateLimit(rdb *redis.Client, requestsPerMin int) func(http.Handler) http.Handler {
\treturn func(next http.Handler) http.Handler {
\t\treturn http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
\t\t\tkey := fmt.Sprintf("rl:%s:%d", r.RemoteAddr, time.Now().Unix()/60)

\t\t\tcount, err := rdb.Incr(r.Context(), key).Result()
\t\t\tif err != nil {
\t\t\t\t// Redis unavailable — fail open to avoid outage
\t\t\t\tnext.ServeHTTP(w, r)
\t\t\t\treturn
\t\t\t}
\t\t\tif count == 1 {
\t\t\t\trdb.Expire(r.Context(), key, time.Minute)
\t\t\t}

\t\t\tremaining := max(0, requestsPerMin-int(count))
\t\t\tw.Header().Set("X-RateLimit-Limit",     fmt.Sprintf("%d", requestsPerMin))
\t\t\tw.Header().Set("X-RateLimit-Remaining", fmt.Sprintf("%d", remaining))

\t\t\tif int(count) > requestsPerMin {
\t\t\t\tw.Header().Set("Retry-After", "60")
\t\t\t\thttp.Error(w, \`{"error":"rate limit exceeded"}\`, http.StatusTooManyRequests)
\t\t\t\treturn
\t\t\t}

\t\t\tnext.ServeHTTP(w, r)
\t\t})
\t}
}

func max(a, b int) int {
\tif a > b { return a }
\treturn b
}`,
          },
          {
            id: 'logging-go',
            name: 'logging.go',
            type: 'file',
            summary: 'HTTP request/response logging middleware. Wraps the ResponseWriter to capture the status code, then logs the method, path, status, and latency after the handler returns. Uses structured output compatible with log aggregators like Loki.',
            content: `package middleware

import (
\t"log"
\t"net/http"
\t"time"
)

type statusRecorder struct {
\thttp.ResponseWriter
\tstatus int
}

func (r *statusRecorder) WriteHeader(code int) {
\tr.status = code
\tr.ResponseWriter.WriteHeader(code)
}

func Logging(next http.Handler) http.Handler {
\treturn http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
\t\tstart := time.Now()
\t\trec := &statusRecorder{ResponseWriter: w, status: http.StatusOK}

\t\tnext.ServeHTTP(rec, r)

\t\tlog.Printf(
\t\t\t"method=%s path=%s status=%d latency=%s ip=%s",
\t\t\tr.Method, r.URL.Path, rec.status,
\t\t\ttime.Since(start).Round(time.Millisecond),
\t\t\tr.RemoteAddr,
\t\t)
\t})
}

// Chain composes multiple middleware into a single handler.
func Chain(middlewares ...func(http.Handler) http.Handler) func(http.Handler) http.Handler {
\treturn func(final http.Handler) http.Handler {
\t\tfor i := len(middlewares) - 1; i >= 0; i-- {
\t\t\tfinal = middlewares[i](final)
\t\t}
\t\treturn final
\t}
}`,
          },
        ],
      },
      {
        id: 'internal-proxy',
        name: 'proxy',
        type: 'folder',
        children: [
          {
            id: 'proxy-go',
            name: 'proxy.go',
            type: 'file',
            summary: 'Creates a reverse proxy to a named downstream service. Uses net/http/httputil.ReverseProxy with a custom transport tuned for high-concurrency: 100 max idle connections, 90 s idle timeout. Adds an X-Forwarded-For header and rewrites the Host header to the target service.',
            content: `package proxy

import (
\t"net/http"
\t"net/http/httputil"
\t"net/url"
\t"time"
)

type ServiceProxy struct {
\ttarget *url.URL
\tproxy  *httputil.ReverseProxy
}

func New(targetURL string) *ServiceProxy {
\tu, err := url.Parse(targetURL)
\tif err != nil {
\t\tpanic("invalid service URL: " + targetURL)
\t}

\tp := httputil.NewSingleHostReverseProxy(u)
\tp.Transport = &http.Transport{
\t\tMaxIdleConns:        100,
\t\tMaxIdleConnsPerHost: 20,
\t\tIdleConnTimeout:     90 * time.Second,
\t\tTLSHandshakeTimeout: 10 * time.Second,
\t}
\tp.ModifyResponse = func(resp *http.Response) error {
\t\t// Strip internal headers before returning to client
\t\tresp.Header.Del("X-Internal-Service")
\t\treturn nil
\t}

\treturn &ServiceProxy{target: u, proxy: p}
}

func (sp *ServiceProxy) ServeHTTP(w http.ResponseWriter, r *http.Request) {
\tr.Header.Set("X-Forwarded-Host", r.Host)
\tr.Host = sp.target.Host
\tsp.proxy.ServeHTTP(w, r)
}`,
          },
        ],
      },
    ],
  },
  {
    id: 'go-mod',
    name: 'go.mod',
    type: 'file',
    summary: 'Go module definition for the api-gateway. Declares the module path and minimum Go version. Direct dependencies are the JWT library for RS256 validation and the official Redis client for rate-limit storage.',
    content: `module github.com/acme/api-gateway

go 1.22

require (
\tgithub.com/golang-jwt/jwt/v5 v5.2.1
\tgithub.com/redis/go-redis/v9  v9.5.1
)

require (
\tgithub.com/bsm/redislock          v0.9.4 // indirect
\tgithub.com/cespare/xxhash/v2      v2.3.0 // indirect
\tgithub.com/dgryski/go-rendezvous  v0.0.0-20200823014737-9f7001d12a5f // indirect
)`,
  },
  {
    id: 'docker-compose',
    name: 'docker-compose.yml',
    type: 'file',
    summary: 'Defines the full local development stack: api-gateway, three downstream services, Redis, and PostgreSQL. Service URLs are wired via environment variables so no code changes are needed between local and production deployments.',
    content: `version: '3.9'

services:
  api-gateway:
    build: .
    ports:
      - "8080:8080"
    environment:
      PORT: "8080"
      REDIS_ADDR: "redis:6379"
      AUTH_SERVICE_URL:  "http://auth-service:3001"
      USER_SERVICE_URL:  "http://user-service:3002"
      ORDER_SERVICE_URL: "http://order-service:3003"
      JWT_PUBLIC_KEY_PATH: "/run/secrets/jwt_public"
    depends_on: [redis, auth-service, user-service, order-service]

  auth-service:
    image: acme/auth-service:latest
    ports: ["3001:3001"]
    environment:
      DATABASE_URL: "postgres://postgres:secret@db:5432/auth"

  user-service:
    image: acme/user-service:latest
    ports: ["3002:3002"]
    environment:
      DATABASE_URL: "postgres://postgres:secret@db:5432/users"

  order-service:
    image: acme/order-service:latest
    ports: ["3003:3003"]
    environment:
      DATABASE_URL: "postgres://postgres:secret@db:5432/orders"

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_PASSWORD: secret
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:`,
  },
  {
    id: 'makefile',
    name: 'Makefile',
    type: 'file',
    summary: 'Developer convenience targets: build and run the gateway locally, run the full test suite with race detection, generate protobuf stubs from /proto, and build multi-arch Docker images for CI.',
    content: `BINARY   = bin/api-gateway
IMAGE    = acme/api-gateway
VERSION ?= $(shell git describe --tags --always)

.PHONY: build run test docker proto lint

build:
\tgo build -ldflags="-s -w -X main.version=$(VERSION)" -o $(BINARY) ./cmd/gateway

run: build
\t./$(BINARY)

test:
\tgo test -race -cover ./...

lint:
\tgolangci-lint run ./...

proto:
\tprotoc --go_out=. --go-grpc_out=. proto/*.proto

docker:
\tdocker buildx build \\
\t  --platform linux/amd64,linux/arm64 \\
\t  --tag $(IMAGE):$(VERSION) \\
\t  --tag $(IMAGE):latest \\
\t  --push .

clean:
\trm -rf bin/`,
  },
];

function findFileById(nodes: FileNode[], id: string): FileNode | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findFileById(node.children, id);
      if (found) return found;
    }
  }
  return null;
}

export function DeveloperView() {
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(
    () => findFileById(MOCK_FILE_TREE, 'main-go')
  );

  return (
    <div className="flex h-full">
      {/* File tree */}
      <div className="w-72 border-r border-gray-200 bg-gray-50 shrink-0">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-sm font-medium text-gray-700">api-gateway</h3>
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
            {/* Summary */}
            <div className="border-b border-gray-200 p-6 bg-white">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-lg">{selectedFile.name}</h3>
                <span className="px-2 py-0.5 bg-cyan-50 text-cyan-700 border border-cyan-200 rounded text-xs font-mono">
                  {selectedFile.name.split('.').pop()?.toUpperCase()}
                </span>
              </div>
              <p className="text-gray-600 leading-relaxed text-sm">{selectedFile.summary}</p>
            </div>

            {/* Code preview */}
            <div className="flex-1 overflow-auto p-6 bg-gray-50">
              <div className="mb-2 text-xs text-gray-400 font-mono">{selectedFile.name}</div>
              <pre className="bg-gray-900 text-gray-100 p-6 rounded-lg overflow-x-auto text-sm leading-relaxed">
                <code>{selectedFile.content}</code>
              </pre>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <p className="text-sm">Select a file to view its summary and code</p>
          </div>
        )}
      </div>
    </div>
  );
}
