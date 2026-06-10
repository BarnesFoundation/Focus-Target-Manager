import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export function CallbackPage() {
  const navigate = useNavigate();
  useEffect(() => {
    // MSAL handles the redirect promise in AuthContext; once that's done we
    // bounce to home. Short delay so handleRedirectPromise has a chance to
    // resolve before route effects fire.
    const t = setTimeout(() => navigate("/", { replace: true }), 200);
    return () => clearTimeout(t);
  }, [navigate]);
  return <p className="text-barnes-ink/60 text-sm">Signing in…</p>;
}
