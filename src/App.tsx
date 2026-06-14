import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import { AuthProvider } from "./auth/AuthContext";
import { AuthGate } from "./components/AuthGate";
import { Layout } from "./components/Layout";
import { AddPage } from "./pages/Add";
import { BrowsePage } from "./pages/Browse";
import { CallbackPage } from "./pages/Callback";
import { DashboardPage } from "./pages/Dashboard";
import { DetailPage } from "./pages/Detail";
import { StatsPage } from "./pages/Stats";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

export function App() {
  return (
    <BrowserRouter basename="/manage">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Routes>
            <Route path="/auth/callback" element={<CallbackPage />} />
            <Route
              path="/"
              element={
                <AuthGate>
                  <Layout />
                </AuthGate>
              }
            >
              <Route index element={<BrowsePage />} />
              <Route path="add" element={<AddPage />} />
              <Route path="detail/:targetId" element={<DetailPage />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="stats" element={<StatsPage />} />
            </Route>
          </Routes>
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
}
