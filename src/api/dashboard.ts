import type { EngineClient } from "./client";
import type {
  BurstDetail,
  BurstListPage,
  BucketsResponse,
  DashboardStats,
  Vote,
  VoteLabel,
} from "./types";

export interface BurstListParams {
  start: string;
  end: string;
  bucket?: string | null;
  hide_voted?: boolean;
  show_matched?: boolean;
  page?: number;
  limit?: number;
}

export interface CastVoteInput {
  day: string;
  bid: string;
  label: VoteLabel;
  suggest?: string;
}

export class DashboardApi {
  constructor(private client: EngineClient) {}

  async stats(start: string, end: string): Promise<DashboardStats> {
    const params = new URLSearchParams({ start, end });
    return this.client.request<DashboardStats>(
      `/api/manage/dashboard/stats?${params}`
    );
  }

  async listBursts(p: BurstListParams): Promise<BurstListPage> {
    const params = new URLSearchParams({ start: p.start, end: p.end });
    if (p.bucket) params.set("bucket", p.bucket);
    if (p.hide_voted != null) params.set("hide_voted", String(p.hide_voted));
    if (p.show_matched != null) params.set("show_matched", String(p.show_matched));
    if (p.page != null) params.set("page", String(p.page));
    if (p.limit != null) params.set("limit", String(p.limit));
    return this.client.request<BurstListPage>(
      `/api/manage/dashboard/bursts?${params}`
    );
  }

  async burstDetail(bid: string, day: string): Promise<BurstDetail> {
    const params = new URLSearchParams({ day });
    return this.client.request<BurstDetail>(
      `/api/manage/dashboard/bursts/${encodeURIComponent(bid)}?${params}`
    );
  }

  burstFramePath(bid: string, stem: string, day: string): string {
    const params = new URLSearchParams({ day });
    return `/api/manage/dashboard/bursts/${encodeURIComponent(bid)}/frame/${encodeURIComponent(stem)}.jpg?${params}`;
  }

  async castVote(input: CastVoteInput): Promise<{ ok: boolean; vote: Vote; is_finished: boolean }> {
    return this.client.request<{ ok: boolean; vote: Vote; is_finished: boolean }>(
      "/api/manage/dashboard/votes",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      }
    );
  }

  async listBuckets(start: string, end: string): Promise<BucketsResponse> {
    const params = new URLSearchParams({ start, end });
    return this.client.request<BucketsResponse>(
      `/api/manage/dashboard/buckets?${params}`
    );
  }

  async invalidateCache(layer: "all" | "bursts" | "buckets" = "all"): Promise<{ ok: boolean; cleared: string[] }> {
    const params = new URLSearchParams({ layer });
    return this.client.request<{ ok: boolean; cleared: string[] }>(
      `/api/manage/dashboard/cache/invalidate?${params}`,
      { method: "POST" }
    );
  }
}
