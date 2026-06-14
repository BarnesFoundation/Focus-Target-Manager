import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

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

type InfiniteBurstParams = Omit<BurstListParams, "page">;

export function useInfiniteBursts(p: InfiniteBurstParams) {
  const { dashboard } = useAuth();
  return useInfiniteQuery({
    queryKey: ["dashboard", "bursts", p],
    queryFn: ({ pageParam }) => dashboard.listBursts({ ...p, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, pages } = lastPage.pagination;
      return page < pages ? page + 1 : undefined;
    },
    enabled: !!p.start && !!p.end,
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
      qc.invalidateQueries({ queryKey: ["dashboard", "stats"] });
      qc.invalidateQueries({ queryKey: ["dashboard", "buckets"] });
      // NOTE: deliberately do NOT invalidate the bursts infinite query here.
      // With hide-already-voted on, invalidation would yank the just-voted
      // card out from under the operator mid-scroll and reflow the list.
      // The card updates its own header locally; the list re-syncs on the
      // next filter/range change or manual refresh.
    },
  });
}

export function useTriggerReplay() {
  const { dashboard } = useAuth();
  return useMutation({
    mutationFn: ({ start, end }: { start: string; end: string }) =>
      dashboard.triggerReplay(start, end),
  });
}

export function useReplayStatus(jobId: string | null) {
  const { dashboard } = useAuth();
  const qc = useQueryClient();
  return useQuery({
    queryKey: ["dashboard", "replay", jobId],
    queryFn: async () => {
      const s = await dashboard.replayStatus(jobId!);
      if (s.status === "succeeded" || s.status === "failed") {
        // results landed — refresh the taxonomy-dependent views
        qc.invalidateQueries({ queryKey: ["dashboard", "buckets"] });
        qc.invalidateQueries({ queryKey: ["dashboard", "stats"] });
        qc.invalidateQueries({ queryKey: ["dashboard", "bursts"] });
      }
      return s;
    },
    enabled: !!jobId,
    refetchInterval: (q) => {
      const st = q.state.data?.status;
      return st === "succeeded" || st === "failed" ? false : 3000;
    },
  });
}
