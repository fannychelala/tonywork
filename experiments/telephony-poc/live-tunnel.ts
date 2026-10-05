import { createHash } from "node:crypto";
import { assertLiveEffectsAuthorized } from "./live-config";
export const cloudflaredLock = Object.freeze({
  version: "2026.9.3", source: "https://github.com/cloudflare/cloudflared/releases/tag/2026.9.3",
  license: "Apache-2.0",
  // GitHub asset digest authenticates the archive; release notes hash its unpacked executable.
  darwinArm64: Object.freeze({ url: "https://github.com/cloudflare/cloudflared/releases/download/2026.9.3/cloudflared-darwin-arm64.tgz", sha256: "587c2cfb1c230fe36c7fa7727da78be459dae028cabe8c001291999350f07095", executableSha256: "5472c1a01c84bc31b3021056a73b4e5774ddddefc572124ea8fdf6c340639f32" }),
  linuxAmd64: Object.freeze({ url: "https://github.com/cloudflare/cloudflared/releases/download/2026.9.3/cloudflared-linux-amd64", sha256: "77e26d8d900e0b8469f416239d14b5f296525fdf79fee6f511ef55609e3fbac2" }),
});
export function verifyCloudflaredArtifact(bytes: Uint8Array, platform: "darwinArm64" | "linuxAmd64") {
  if (createHash("sha256").update(bytes).digest("hex") !== cloudflaredLock[platform].sha256) throw new Error("CLOUDFLARED_INTEGRITY_FAILED");
}
export function cloudflaredArguments(version: string) {
  if (version !== cloudflaredLock.version) throw new Error("CLOUDFLARED_VERSION_MISMATCH");
  return ["tunnel", "--no-autoupdate", "--url", "http://127.0.0.1:4316", "--protocol", "http2", "--loglevel", "info"] as const;
}
export async function launchPreparedTunnel(launch: (args: readonly string[]) => Promise<void>): Promise<void> {
  assertLiveEffectsAuthorized();
  await launch(cloudflaredArguments(cloudflaredLock.version));
}
