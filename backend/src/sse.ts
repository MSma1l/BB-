import type { Request, Response } from "express";

/**
 * Minimal Server-Sent-Events hub. One channel per domain ("conversations",
 * "photos", "texts", "reviews"). `broadcast(channel)` pings every open client on
 * that channel; the frontend's EventSource then re-fetches. Keeps the frontend
 * `subscribe(cb)` contract intact (cb fires on any change).
 */
type Channel = "conversations" | "photos" | "texts" | "reviews";

const clients: Record<Channel, Set<Response>> = {
  conversations: new Set(),
  photos: new Set(),
  texts: new Set(),
  reviews: new Set(),
};

/** Attach an SSE stream for a channel to the current request. */
export function sseHandler(channel: Channel) {
  return (req: Request, res: Response) => {
    res.set({
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    });
    res.flushHeaders?.();
    res.write(`event: ready\ndata: {}\n\n`);

    clients[channel].add(res);

    // Heartbeat so proxies don't drop the idle connection.
    const beat = setInterval(() => {
      res.write(`: ping\n\n`);
    }, 25000);

    req.on("close", () => {
      clearInterval(beat);
      clients[channel].delete(res);
    });
  };
}

/** Notify all listeners on a channel that something changed. */
export function broadcast(channel: Channel): void {
  const payload = `event: message\ndata: {"t":${Date.now()}}\n\n`;
  for (const res of clients[channel]) {
    try {
      res.write(payload);
    } catch {
      clients[channel].delete(res);
    }
  }
}
