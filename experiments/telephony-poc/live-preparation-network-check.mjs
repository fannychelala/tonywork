import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";

const compose = ["compose", "-f", "experiments/telephony-poc/compose.live-preparation.yml"];
const id = service => execFileSync("docker", [...compose, "ps", "-q", service], { encoding: "utf8" }).trim();
const inspect = value => JSON.parse(execFileSync("docker", ["inspect", value], { encoding: "utf8" }))[0];
const preflight = inspect(id("poc-live-preflight"));
const postgres = inspect(id("poc-live-postgres"));
const networkNames = value => Object.keys(value.NetworkSettings.Networks);
const privateNames = networkNames(preflight);

assert.equal(privateNames.length, 1);
assert.deepEqual(privateNames, networkNames(postgres));
const network = JSON.parse(execFileSync("docker", ["network", "inspect", privateNames[0]], { encoding: "utf8" }))[0];
assert.equal(network.Internal, true);
assert.equal(preflight.HostConfig.ReadonlyRootfs, true);
assert(preflight.HostConfig.CapDrop.includes("ALL"));
assert(preflight.HostConfig.SecurityOpt.includes("no-new-privileges:true"));
assert.equal(Object.keys(preflight.HostConfig.PortBindings ?? {}).length, 0);
assert.equal(Object.keys(postgres.HostConfig.PortBindings ?? {}).length, 0);
assert(!preflight.Config.Env.some(value => /^(TWILIO_|DATABASE_URL|AUTH_DATABASE_URL|MIGRATION_DATABASE_URL|BETTER_AUTH)/i.test(value)));
assert(!JSON.stringify(preflight.Config).match(/SK[0-9a-f]{32}|AC[0-9a-f]{32}|\+33[0-9]{9}|postgresql:\/\//));
assert.equal(execFileSync("docker", ["logs", preflight.Id], { encoding: "utf8" }), "");

const targets = new Set([
  "/run/tony-poc/private/binding.json",
  "/run/tony-poc/secrets/database-url",
  "/run/tony-poc/secrets/api-key",
  "/run/tony-poc/secrets/api-secret",
  "/run/tony-poc/secrets/auth-token",
]);
assert.equal(preflight.Mounts.filter(mount => targets.has(mount.Destination)).length, targets.size);
for (const target of targets) {
  const mount = preflight.Mounts.find(candidate => candidate.Destination === target);
  assert(mount); assert.equal(mount.RW, false);
}
assert(!postgres.Mounts.some(mount => targets.has(mount.Destination)));

const denyFrom = (container, host, port) => {
  const source = `const s=require('net').connect({host:${JSON.stringify(host)},port:${port}});s.setTimeout(1500);s.on('connect',()=>{s.destroy();process.exit(1)});s.on('error',()=>process.exit(0));s.on('timeout',()=>{s.destroy();process.exit(0)});`;
  execFileSync("docker", ["exec", container, "node", "-e", source], { stdio: "pipe" });
};
denyFrom(preflight.Id, "api.dublin.ie1.twilio.com", 443);
denyFrom(preflight.Id, "api.twilio.com", 443);

const tonyContainer = service => execFileSync("docker", ["ps", "-q",
  "--filter", "label=com.docker.compose.project=tonywork",
  "--filter", `label=com.docker.compose.service=${service}`], { encoding: "utf8" }).trim();
const tonyAppId = tonyContainer("app");
if (tonyAppId) {
  const tonyApp = inspect(tonyAppId);
  assert(!networkNames(tonyApp).some(name => privateNames.includes(name)));
  assert(!preflight.Mounts.some(mount => tonyApp.Mounts.some(tonyMount => tonyMount.Source === mount.Source)));
  const tonyPostgresId = tonyContainer("postgres");
  if (tonyPostgresId) {
    const tonyPostgres = inspect(tonyPostgresId);
    assert(!networkNames(tonyPostgres).some(name => privateNames.includes(name)));
    const address = Object.values(tonyPostgres.NetworkSettings.Networks)[0]?.IPAddress;
    assert(address); denyFrom(preflight.Id, address, 5432);
  }
  const liveAddress = Object.values(postgres.NetworkSettings.Networks)[0]?.IPAddress;
  assert(liveAddress); denyFrom(tonyApp.Id, liveAddress, 5432);
}

console.log("LIVE_PREPARATION_DENY_ALL_ISOLATION_OK");
