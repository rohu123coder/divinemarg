import { divinemarg } from "./divinemarg";
import { lagnalord } from "./lagnalord";
import type { TenantConfig } from "./types";

export const tenantRegistry: Record<string, TenantConfig> = {
  divinemarg,
  lagnalord,
};

const DEFAULT_TENANT_ID = "divinemarg";

export function getTenant(): TenantConfig {
  const tenantId =
    process.env.NEXT_PUBLIC_TENANT?.toLowerCase() ?? DEFAULT_TENANT_ID;
  return tenantRegistry[tenantId] ?? tenantRegistry[DEFAULT_TENANT_ID];
}

export type { TenantConfig } from "./types";
