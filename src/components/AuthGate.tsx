import type { ReactNode } from "react";
import { useAuth } from "../auth/AuthContext";

export function AuthGate({ children }: { children: ReactNode }) {
  const { ready, account, oauthEnabled, signIn } = useAuth();

  if (!ready) {
    return (
      <div className="flex items-center justify-center py-16 text-barnes-ink/60">
        Loading…
      </div>
    );
  }

  if (oauthEnabled && !account) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <p className="text-sm text-barnes-ink/70">Sign in with your Barnes account to continue.</p>
        <button className="btn-primary" onClick={() => signIn()}>
          Sign in with Microsoft
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
