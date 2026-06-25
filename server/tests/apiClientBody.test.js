import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { createApp } from "../app.js";

async function startServer() {
  const app = createApp();
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;
  return {
    server,
    baseUrl: `http://127.0.0.1:${port}`,
    async close() {
      await new Promise((resolve) => server.close(resolve));
    },
  };
}

test("POST /auth/token accepts empty body (no literal null JSON crash)", async () => {
  const srv = await startServer();
  try {
    const empty = await fetch(`${srv.baseUrl}/api/auth/token`, { method: "POST" });
    assert.notEqual(empty.status, 400, "empty body should not 400 from JSON parser");

    const nullBody = await fetch(`${srv.baseUrl}/api/auth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "null",
    });
    assert.notEqual(nullBody.status, 400, "legacy null body should not crash parser");
  } finally {
    await srv.close();
  }
});
