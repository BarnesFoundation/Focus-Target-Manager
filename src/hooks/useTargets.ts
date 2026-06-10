import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { useAuth } from "../auth/AuthContext";
import type { AddTargetInput } from "../api/targets";

export function useTargetList(opts: { q?: string; hasRefs?: boolean } = {}) {
  const { targets } = useAuth();
  return useQuery({
    queryKey: ["targets", opts],
    queryFn: () => targets.list({ ...opts, limit: 200 }),
  });
}

export function useTargetDetail(targetId: string | null) {
  const { targets } = useAuth();
  return useQuery({
    queryKey: ["target", targetId],
    queryFn: () => targets.get(targetId!),
    enabled: !!targetId,
  });
}

export function useAddTarget() {
  const { targets } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AddTargetInput) => targets.add(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["targets"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}

export function useDeleteTarget() {
  const { targets } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (targetId: string) => targets.remove(targetId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["targets"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}

export function useIndexStats() {
  const { targets } = useAuth();
  return useQuery({
    queryKey: ["stats"],
    queryFn: () => targets.stats(),
    refetchInterval: 15_000,
  });
}

function useDebounced<T>(value: T, delay = 200): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export function useCatalogLookup(q: string, limit = 10) {
  const { targets } = useAuth();
  const debounced = useDebounced(q.trim(), 200);
  return useQuery({
    queryKey: ["catalog", "lookup", debounced, limit],
    queryFn: () => targets.catalogLookup(debounced, limit),
    enabled: debounced.length >= 1,
    staleTime: 60_000,
    placeholderData: (prev) => prev,
  });
}

export function useCatalogStatus() {
  const { targets } = useAuth();
  return useQuery({
    queryKey: ["catalog", "status"],
    queryFn: () => targets.catalogStatus(),
    refetchInterval: 60_000,
  });
}
