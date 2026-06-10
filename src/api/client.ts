// Engine HTTP client. Reads the bearer token from the active MSAL session
// when OAuth is wired; falls back to no auth in disabled/dev mode.

import type { TokenSource } from "../auth/tokenSource";

export class HttpError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, body: unknown, message: string) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

export interface ClientOptions {
  baseUrl?: string;
  tokenSource: TokenSource;
}

export class EngineClient {
  baseUrl: string;
  tokenSource: TokenSource;

  constructor(opts: ClientOptions) {
    this.baseUrl = (opts.baseUrl ?? "").replace(/\/$/, "");
    this.tokenSource = opts.tokenSource;
  }

  private async authHeader(): Promise<Record<string, string>> {
    const token = await this.tokenSource.getToken();
    if (!token) return {};
    return { Authorization: `Bearer ${token}` };
  }

  async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers ?? {});
    const auth = await this.authHeader();
    for (const [k, v] of Object.entries(auth)) headers.set(k, v);
    const resp = await fetch(`${this.baseUrl}${path}`, { ...init, headers });
    const ct = resp.headers.get("content-type") ?? "";
    const isJson = ct.includes("application/json");
    if (!resp.ok) {
      const body = isJson ? await resp.json().catch(() => null) : await resp.text();
      throw new HttpError(resp.status, body, `${resp.status} ${resp.statusText} at ${path}`);
    }
    if (isJson) return (await resp.json()) as T;
    return (await resp.blob()) as unknown as T;
  }

  async postMultipart<T>(path: string, form: FormData): Promise<T> {
    return this.request<T>(path, { method: "POST", body: form });
  }
}
