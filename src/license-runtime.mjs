export function isWebDemoRuntime(isRunningInTauri) {
  return !isRunningInTauri;
}

export function resolveLicenseStatusForRuntime(licenseStatus, isRunningInTauri) {
  return isWebDemoRuntime(isRunningInTauri) ? "valid" : licenseStatus;
}

export function resolveProductEnabledForRuntime(
  productEnabled,
  isRunningInTauri
) {
  return isWebDemoRuntime(isRunningInTauri) ? true : productEnabled;
}
