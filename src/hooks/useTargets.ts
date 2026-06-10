import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

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
