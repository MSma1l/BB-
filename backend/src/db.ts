import { PrismaClient } from "@prisma/client";

/** Single shared Prisma client. */
export const prisma = new PrismaClient();

/**
 * Prisma returns BigInt for epoch-ms fields; JSON.stringify can't serialize
 * BigInt. Convert to Number at the API boundary (JS ms fits in a safe integer).
 */
export function toMs(v: bigint | number): number {
  return typeof v === "bigint" ? Number(v) : v;
}
