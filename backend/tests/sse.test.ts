import { describe, it, expect, vi } from "vitest";
import type { Request, Response } from "express";
import { sseHandler, broadcast } from "../src/sse";

/** Build a mock Express Response that records set()/write() calls. */
function mockRes() {
  const res = {
    headers: {} as Record<string, string>,
    writes: [] as string[],
    closeCb: undefined as (() => void) | undefined,
    set(obj: Record<string, string>) {
      Object.assign(this.headers, obj);
      return this;
    },
    write(chunk: string) {
      this.writes.push(chunk);
      return true;
    },
    flushHeaders: vi.fn(),
  };
  return res;
}

/** Mock request with an `on("close", cb)` hook. */
function mockReq() {
  const req = {
    onHandlers: {} as Record<string, () => void>,
    on(event: string, cb: () => void) {
      this.onHandlers[event] = cb;
      return this;
    },
  };
  return req;
}

describe("sseHandler", () => {
  it("sets the text/event-stream content type and writes an initial event", () => {
    const handler = sseHandler("photos");
    const req = mockReq();
    const res = mockRes();
    handler(req as unknown as Request, res as unknown as Response);

    expect(res.headers["Content-Type"]).toBe("text/event-stream");
    expect(res.flushHeaders).toHaveBeenCalled();
    // First write is the "ready" event.
    expect(res.writes[0]).toContain("event: ready");

    // clean up: fire the close handler so we don't leak the heartbeat timer.
    req.onHandlers["close"]?.();
  });
});

describe("broadcast", () => {
  it("writes to a client registered on the channel, not to other channels", () => {
    const req = mockReq();
    const res = mockRes();
    sseHandler("reviews")(req as unknown as Request, res as unknown as Response);

    const initialWrites = res.writes.length;

    // Broadcasting on a different channel must not touch this client.
    broadcast("photos");
    expect(res.writes.length).toBe(initialWrites);

    // Broadcasting on the registered channel writes a message event.
    broadcast("reviews");
    expect(res.writes.length).toBe(initialWrites + 1);
    expect(res.writes[res.writes.length - 1]).toContain("event: message");

    // clean up.
    req.onHandlers["close"]?.();
  });

  it("stops writing to a client after it closes", () => {
    const req = mockReq();
    const res = mockRes();
    sseHandler("texts")(req as unknown as Request, res as unknown as Response);

    // Close the connection -> client removed from the channel set.
    req.onHandlers["close"]?.();
    const before = res.writes.length;
    broadcast("texts");
    expect(res.writes.length).toBe(before);
  });
});
