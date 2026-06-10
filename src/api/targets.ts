import type { EngineClient } from "./client";
import type {
  AddTargetResult,
  CropBox,
  DeleteResult,
  IndexStats,
  ReindexJob,
  TargetDetail,
  TargetListPage,
} from "./types";

export interface AddTargetInput {
  imageFile: File;
  objectId: string;
  name?: string;
  refLabel?: string;
  crop?: CropBox;
}

export class TargetsApi {
  constructor(private client: EngineClient) {}

  async list(opts: {
    q?: string;
    limit?: number;
    offset?: number;
    hasRefs?: boolean;
  } = {}): Promise<TargetListPage> {
    const params = new URLSearchParams();
    if (opts.q) params.set("q", opts.q);
    if (opts.limit != null) params.set("limit", String(opts.limit));
    if (opts.offset != null) params.set("offset", String(opts.offset));
    if (opts.hasRefs != null) params.set("has_refs", String(opts.hasRefs));
    const qs = params.toString();
    return this.client.request<TargetListPage>(`/api/manage/targets${qs ? `?${qs}` : ""}`);
  }

  async get(targetId: string): Promise<TargetDetail> {
    return this.client.request<TargetDetail>(`/api/manage/targets/${encodeURIComponent(targetId)}`);
  }

  async add(input: AddTargetInput): Promise<AddTargetResult> {
    const form = new FormData();
    form.append("image", input.imageFile);
    form.append("object_id", input.objectId);
    if (input.name) form.append("name", input.name);
    if (input.refLabel) form.append("ref_label", input.refLabel);
    if (input.crop) {
      form.append("crop_x", String(input.crop.x));
      form.append("crop_y", String(input.crop.y));
      form.append("crop_w", String(input.crop.w));
      form.append("crop_h", String(input.crop.h));
    }
    return this.client.postMultipart<AddTargetResult>("/api/manage/targets", form);
  }

  async remove(targetId: string): Promise<DeleteResult> {
    return this.client.request<DeleteResult>(`/api/manage/targets/${encodeURIComponent(targetId)}`, {
      method: "DELETE",
    });
  }

  previewUrl(targetId: string): string {
    return `${this.client.baseUrl}/api/manage/targets/${encodeURIComponent(targetId)}/preview.jpg`;
  }

  async stats(): Promise<IndexStats> {
    return this.client.request<IndexStats>("/api/manage/index/stats");
  }

  async reindex(): Promise<ReindexJob> {
    return this.client.request<ReindexJob>("/api/manage/reindex", { method: "POST" });
  }

  async job(jobId: string): Promise<ReindexJob> {
    return this.client.request<ReindexJob>(`/api/manage/jobs/${encodeURIComponent(jobId)}`);
  }
}
