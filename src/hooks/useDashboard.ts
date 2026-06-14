import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";

import { useAuth } from "../auth/AuthContext";
import type { BurstListParams, CastVoteInput } from "../api/dashboard";
import type { BurstListPage } from "../api/types";

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
    onSuccess: (resp, input) => {
      qc.invalidateQueries({ queryKey: ["dashboard", "stats"] });
      qc.invalidateQueries({ queryKey: ["dashboard", "buckets"] });

      // Hide-already-voted: a FINISHED vote should make the card vanish from
      // any hide_voted view — but surgically, by pruning just that one burst
      // from the cached pages in place. We do NOT invalidate/refetch the
      // bursts query (that would reflow the whole list under the operator's
      // cursor mid-scroll). An UNFINISHED vote (wrong_artwork with no
      // suggestion) is left in place so it re-surfaces for round 2.
      if (!resp.is_finished) return;

      qc.getQueryCache()
        .findAll({ queryKey: ["dashboard", "bursts"] })
        .forEach((q) => {
          const params = q.queryKey[2] as { hide_voted?: boolean } | undefined;
          if (!params?.hide_voted) return; // only prune hide-voted views
          qc.setQueryData<InfiniteData<BurstListPage>>(q.queryKey, (old) => {
            if (!old) return old;
            return {
              ...old,
              pages: old.pages.map((page) => ({
                ...page,
                items: page.items.filter(
                  (it) => !(it.bid === input.bid && it.day === input.day)
                ),
              })),
            };
          });
        });
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
