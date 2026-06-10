import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { AccountInfo } from "@azure/msal-browser";

import { EngineClient } from "../api/client";
import { TargetsApi } from "../api/targets";
import { MsalTokenSource, ensureInitialized, loginRequest, msalConfigured, msalInstance } from "./msal";
import { NullTokenSource, type TokenSource } from "./tokenSource";

export interface AuthState {
  ready: boolean;
  account: AccountInfo | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  client: EngineClient;
  targets: TargetsApi;
  oauthEnabled: boolean;
}

const AuthCtx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(!msalConfigured);
  const [account, setAccount] = useState<AccountInfo | null>(null);

  useEffect(() => {
    if (!msalConfigured) return;
    let cancelled = false;
    (async () => {
      await ensureInitialized();
      const handled = await msalInstance.handleRedirectPromise().catch(() => null);
      if (handled?.account) msalInstance.setActiveAccount(handled.account);
      if (cancelled) return;
      setAccount(msalInstance.getActiveAccount());
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const tokenSource: TokenSource = useMemo(
    () => (msalConfigured ? new MsalTokenSource() : NullTokenSource),
    []
  );

  const client = useMemo(
    () => new EngineClient({ baseUrl: import.meta.env.VITE_ENGINE_BASE_URL ?? "", tokenSource }),
    [tokenSource]
  );
  const targets = useMemo(() => new TargetsApi(client), [client]);

  const value: AuthState = {
    ready,
    account,
    oauthEnabled: msalConfigured,
    client,
    targets,
    async signIn() {
      if (!msalConfigured) return;
      await msalInstance.loginRedirect(loginRequest);
    },
    async signOut() {
      if (!msalConfigured) return;
      await msalInstance.logoutRedirect();
    },
  };

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth(): AuthState {
  const v = useContext(AuthCtx);
  if (!v) throw new Error("useAuth must be used inside <AuthProvider>");
  return v;
}
