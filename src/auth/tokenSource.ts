// Abstraction over "where does the bearer token come from" so the engine
// client doesn't depend on MSAL directly. Three concrete sources match the
// three engine auth modes.

export interface TokenSource {
  /** Return a bearer token. `forceRefresh` asks the source to bypass any
   * cached token and mint a fresh one (used by the client on a 401 to
   * recover from a token that aged out mid-session). */
  getToken(forceRefresh?: boolean): Promise<string | null>;
  /** Optional interactive re-auth (may navigate away). Called when even a
   * forced refresh can't produce a valid token — e.g. the refresh token
   * itself expired. No-op sources omit it. */
  reauth?(): Promise<void>;
}

export const NullTokenSource: TokenSource = {
  async getToken() {
    return null;
  },
};

export class StaticTokenSource implements TokenSource {
  constructor(private token: string) {}
  async getToken() {
    return this.token;
  }
}

// MsalTokenSource is implemented in ./msal.ts to keep the @azure/msal-browser
// dependency out of test paths that don't need it.
