import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "../auth/AuthContext";
import type { BurstListParams, CastVoteInput } from "../api/dashboard";

export function useDashboardStats(start: string, end: string) {
  const { dashboard } = useAuth();
  return useQuery({
    queryKey: ["dashboard", "stats", start, end],
    queryFn: () => dashboard.stats(start, end),
    enabled: !!start && !!end,
    refetchInterval: 30_000,
  });
}

export function useDashboardBursts(p: BurstListParams) {
  const { dashboard } = useAuth();
  return useQuery({
    queryKey: ["dashboard", "bursts", p],
    queryFn: () => dashboard.listBursts(p),
    enabled: !!p.start && !!p.end,
    placeholderData: (prev) => prev,
  });
}

export function useDashboardBuckets(start: string, end: string) {
  const { dashboard } = useAuth();
  return useQuery({
    queryKey: ["dashboard", "buckets", start, end],
    queryFn: () => dashboard.listBuckets(start, end),
    enabled: !!start && !!end,
    refetchInterval: 30_000,
  });
}

export function useCastVote() {
  const { dashboard } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CastVoteInput) => dashboard.castVote(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dashboard", "bursts"] });
      qc.invalidateQueries({ queryKey: ["dashboard", "stats"] });
      qc.invalidateQueries({ queryKey: ["dashboard", "buckets"] });
    },
  });
}
