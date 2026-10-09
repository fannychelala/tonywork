import { connect } from "node:net";

const serverName = Buffer.from("api.dublin.ie1.twilio.com", "ascii");
const serverNameList = Buffer.concat([Buffer.from([0, 0, serverName.length]), serverName]);
const sni = Buffer.concat([
  Buffer.from([0, 0, 0, serverNameList.length + 2, 0, serverNameList.length]),
  serverNameList,
]);
const body = Buffer.concat([
  Buffer.from([3, 3]), Buffer.alloc(32), Buffer.from([0]),
  Buffer.from([0, 2, 0x13, 0x01]), Buffer.from([1, 0]), Buffer.from([0, sni.length]), sni,
]);
const handshake = Buffer.concat([Buffer.from([1, body.length >> 16, body.length >> 8, body.length]), body]);
const hello = Buffer.concat([Buffer.from([0x16, 3, 1, handshake.length >> 8, handshake.length]), handshake]);

const response = await new Promise((resolve, reject) => {
  const socket = connect({ host: "poc-live-egress", port: 8443 });
  const chunks = [];
  socket.setTimeout(2000, () => socket.destroy(new Error("SYNTHETIC_EGRESS_TIMEOUT")));
  socket.on("data", chunk => chunks.push(Buffer.from(chunk)));
  socket.once("error", reject);
  socket.once("close", () => resolve(Buffer.concat(chunks).toString("utf8")));
  socket.end(hello);
});
if (response !== "SYNTHETIC_EGRESS_OK") throw new Error("SYNTHETIC_EGRESS_FAILED");
console.log("SYNTHETIC_FIXED_EGRESS_OK");
