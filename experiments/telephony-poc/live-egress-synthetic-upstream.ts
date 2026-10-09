import { createServer } from "node:net";

// It never parses or stores the synthetic TLS fixture and has no provider egress.
const server = createServer(socket => {
  socket.once("data", () => socket.end("SYNTHETIC_EGRESS_OK"));
});
server.listen(9443, "0.0.0.0");
