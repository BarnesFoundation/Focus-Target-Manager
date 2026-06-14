import {
  InteractionRequiredAuthError,
  PublicClientApplication,
  type AccountInfo,
  type Configuration,
  type RedirectRequest,
  type SilentRequest,
  EventType,
} from "@azure/msal-browser";

import type { TokenSource } from "./tokenSource";

const tenantId = import.meta.env.VITE_AZURE_TENANT_ID || "";
const clientId = import.meta.env.VITE_AZURE_CLIENT_ID || "";
const redirectUri =
  import.meta.env.VITE_AZURE_REDIRECT_URI ||
  `${window.location.origin}/manage/auth/callback`;
const extraScope = import.meta.env.VITE_AZURE_SCOPE || "";

export const msalConfigured = Boolean(tenantId && clientId);

const config: Configuration = {
  auth: {
    clientId: clientId || "00000000-0000-0000-0000-000000000000",
    authority: tenantId
      ? `https://login.microsoftonline.com/${tenantId}`
      : "https://login.microsoftonline.com/common",
    redirectUri,
    postLogoutRedirectUri: `${window.location.origin}/manage`,
    navigateToLoginRequestUrl: true,
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false,
  },
};

export const msalInstance = new PublicClientApplication(config);

const baseScopes = ["openid", "profile", "email"];
const scopes = extraScope ? [extraScope, ...baseScopes] : baseScopes;

export const loginRequest: RedirectRequest = { scopes };

export async function ensureInitialized(): Promise<void> {
  await msalInstance.initialize();
  msalInstance.addEventCallback((event) => {
    if (event.eventType === EventType.LOGIN_SUCCESS && event.payload) {
      const result = event.payload as { account?: AccountInfo };
      if (result.account) msalInstance.setActiveAccount(result.account);
    }
  });
  const accounts = msalInstance.getAllAccounts();
  if (accounts[0] && !msalInstance.getActiveAccount()) {
    msalInstance.setActiveAccount(accounts[0]);
  }
}

export class MsalTokenSource implements TokenSource {
  async getToken(forceRefresh = false): Promise<string | null> {
    const account = msalInstance.getActiveAccount();
    if (!account) return null;
    const silentReq: SilentRequest = { scopes, account, forceRefresh };
    try {
      const result = await msalInstance.acquireTokenSilent(silentReq);
      return result.idToken || result.accessToken || null;
    } catch (e) {
      // InteractionRequiredAuthError = refresh token can't silently renew
      // (expired / revoked). Return null; the engine client will call
      // reauth() to recover interactively.
      if (e instanceof InteractionRequiredAuthError) return null;
      return null;
    }
  }

  async reauth(): Promise<void> {
    // Interactive renewal. Redirects to Microsoft and back to the
    // callback; the in-progress page state is lost but every vote cast
    // before the token died was already persisted server-side.
    await msalInstance.acquireTokenRedirect({ scopes });
  }
}
