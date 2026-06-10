/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ENGINE_BASE_URL?: string;
  readonly VITE_AZURE_TENANT_ID?: string;
  readonly VITE_AZURE_CLIENT_ID?: string;
  readonly VITE_AZURE_REDIRECT_URI?: string;
  readonly VITE_AZURE_SCOPE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
