declare module "cloudflare:workers" {
  export const env: { DB: Parameters<typeof import("drizzle-orm/d1").drizzle>[0] };
}

interface Fetcher {
  fetch(request: Request): Promise<Response>;
}

interface D1Database {
  prepare(query: string): unknown;
}
