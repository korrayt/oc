declare module "*.mjs" {
  export type LicenseStatus = "missing" | "valid" | "invalid" | "restricted";

  export function isWebDemoRuntime(isRunningInTauri: boolean): boolean;
  export function resolveLicenseStatusForRuntime(
    licenseStatus: string,
    isRunningInTauri: boolean
  ): LicenseStatus;
  export function resolveProductEnabledForRuntime(
    productEnabled: boolean,
    isRunningInTauri: boolean
  ): boolean;
}
