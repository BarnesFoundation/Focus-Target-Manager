// Mirror of the engine response shapes from src/api/manage.py. Keep in
// lockstep with engine v0.6+.

export interface AddTargetResult {
  target_id: string;
  object_id: string;
  name: string;
  ref_label: string | null;
  is_variant: boolean;
  descriptor_count: number;
  faiss_index_size: number | null;
  added_at: number;
  extract_ms?: number;
  faiss_ms?: number;
  total_ms?: number;
}

export interface TargetDetail {
  target_id: string;
  object_id: string;
  name: string;
  ref_label: string | null;
  is_variant: boolean;
  descriptor_count: number;
  image_width: number | null;
  image_height: number | null;
  added_at: number | null;
  faiss_present: boolean;
}

export interface RefVariantSummary {
  ref_label: string;
  target_id: string;
  added_at: number | null;
}

export interface TargetGroup {
  object_id: string;
  name: string | null;
  base_target_id: string | null;
  ref_variants: RefVariantSummary[];
  descriptor_count_total: number;
}

export interface TargetListPage {
  total: number;
  limit: number;
  offset: number;
  items: TargetGroup[];
}

export interface IndexStats {
  target_count: number;
  ref_variant_count: number;
  descriptor_count_total: number;
  faiss_index_size: number | null;
  gpu_vram_mb: number | null;
  engine_version: string;
  uptime_sec: number | null;
  auth: AuthStatus;
}

export interface AuthStatus {
  mode: "oauth" | "static" | "disabled";
  tenant_configured: boolean;
  client_configured: boolean;
  static_token_configured: boolean;
  extra_audiences_count: number;
}

export interface ReindexJob {
  job_id: string;
  status: "started" | "running" | "succeeded" | "failed";
  started_at: number | null;
  finished_at: number | null;
  error: string | null;
}

export interface DeleteResult {
  target_id: string;
  removed_from_disk: boolean;
  remaining_target_count: number;
  remaining_faiss_size: number | null;
  vote_cpu_ms?: number;
  vote_gpu_ms?: number;
  vote_gpu_ok?: boolean;
}

export interface CropBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface CatalogEntry {
  id: string;
  invno: string | null;
  title: string | null;
  people: string | null;
  classification: string | null;
  culture: string | null;
  locations: string | null;
  display_date: string | null;
  cdn_url: string | null;
}

export interface CatalogLookupResponse {
  query: string;
  limit: number;
  count: number;
  items: CatalogEntry[];
}

export interface CatalogStatus {
  item_count: number;
  invno_indexed: number;
  cached_at: number;
  age_sec: number | null;
  ttl_sec: number;
  stale: boolean;
  source_url: string;
  refreshing: boolean;
  last_error: string | null;
}
