// Abstraction over "where does the bearer token come from" so the engine
// client doesn't depend on MSAL directly. Three concrete sources match the
// three engine auth modes.

export interface TokenSource {
  getToken(): Promise<string | null>;
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
