import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const navItem = "block px-4 py-3 text-sm font-medium border-b border-barnes-ink/10 last:border-b-0";
const navActive = "bg-barnes-ink/5 text-barnes-ink";
const navIdle = "text-barnes-ink/70 hover:bg-barnes-ink/5";

export function Layout() {
  const { account, oauthEnabled, signIn, signOut } = useAuth();

  return (
    <div className="min-h-full flex flex-col">
      <header className="bg-barnes-ink text-barnes-paper">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
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
        <nav className="max-w-3xl mx-auto flex">
          {[
            { to: "/", label: "Browse" },
            { to: "/add", label: "Add" },
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

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-6">
        <Outlet />
      </main>

      <footer className="text-xs text-barnes-ink/50 max-w-3xl mx-auto px-4 py-4">
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
