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

  private async _send(
    path: string,
    init: RequestInit,
    forceRefresh: boolean
  ): Promise<Response> {
    const headers = new Headers(init.headers ?? {});
    const token = await this.tokenSource.getToken(forceRefresh);
    if (token) headers.set("Authorization", `Bearer ${token}`);
    return fetch(`${this.baseUrl}${path}`, { ...init, headers });
  }

  async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    let resp = await this._send(path, init, false);

    // Token aged out mid-session (the dashboard is built for long vote
    // passes that outlive a ~60-90 min access token). On a 401, force a
    // silent refresh via the refresh token and retry once. The request
    // bodies we send (JSON strings, FormData) are reusable across the
    // retry. If it's STILL 401, the refresh token itself is dead —
    // trigger interactive re-auth (may redirect).
    if (resp.status === 401) {
      resp = await this._send(path, init, true);
      if (resp.status === 401 && this.tokenSource.reauth) {
        await this.tokenSource.reauth();
        // reauth typically navigates away; if it didn't, fall through and
        // surface the 401 so the caller isn't left hanging.
      }
    }

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
