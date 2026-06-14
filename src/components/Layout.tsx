import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export function Layout() {
  const { account, oauthEnabled, signIn, signOut } = useAuth();
  const { pathname } = useLocation();
  // The dashboard is a dense review surface — let it use the full screen
  // width. The mobile-first form pages (Browse/Add/Detail/Stats) stay
  // narrow so their full-width inputs don't stretch absurdly.
  const wide = pathname.startsWith("/dashboard");
  const containerW = wide ? "max-w-[1800px]" : "max-w-3xl";

  return (
    <div className="min-h-full flex flex-col">
      <header className="bg-barnes-ink text-barnes-paper">
        <div className={`${containerW} mx-auto px-4 py-3 flex items-center justify-between`}>
          <NavLink to="/" className="font-semibold tracking-tight">
            Focus Target Manager
          </NavLink>
          <div className="text-xs">
            {oauthEnabled ? (
              account ? (
                <button
                  onClick={() => signOut()}
                  className="opacity-80 hover:opacity-100"
                >
                  {account.username} — sign out
                </button>
              ) : (
                <button onClick={() => signIn()} className="opacity-80 hover:opacity-100">
                  Sign in
                </button>
              )
            ) : (
              <span className="opacity-50">auth: dev</span>
            )}
          </div>
        </div>
        <nav className={`${containerW} mx-auto flex`}>
          {[
            { to: "/", label: "Browse" },
            { to: "/add", label: "Add" },
            { to: "/dashboard", label: "Dashboard" },
            { to: "/stats", label: "Stats" },
          ].map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `flex-1 text-center py-2 text-sm border-b-2 ${
                  isActive ? "border-barnes-paper" : "border-transparent opacity-70"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className={`flex-1 ${containerW} w-full mx-auto px-4 py-6`}>
        <Outlet />
      </main>

      <footer className={`text-xs text-barnes-ink/50 ${containerW} mx-auto px-4 py-4`}>
        Engine:{" "}
        <a
          href={import.meta.env.VITE_ENGINE_BASE_URL || "/"}
          className="underline"
          target="_blank"
          rel="noreferrer"
        >
          {import.meta.env.VITE_ENGINE_BASE_URL || "current origin"}
        </a>
      </footer>
    </div>
  );
}
