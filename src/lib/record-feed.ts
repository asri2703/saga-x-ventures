import { timingSafeEqual } from "node:crypto";
import { recordAccounts } from "@/lib/record-accounts";
import { serviceClient } from "@/lib/supabase";

/**
 * The write side of the account record.
 *
 * The reporter EA on the VPS posts here once an hour: the balance, the
 * equity, the lowest equity it saw since the last post, and the deals closed
 * since then. Everything here is about refusing what did not come from that
 * EA, and storing what did so that a resend changes nothing.
 *
 * Server only. It holds the service role, and the secret that lets a
 * request write figures that the public page then shows as the record.
 */

/** Deals per request. The EA sends in chunks of this size or smaller. */
export const MAX_DEALS = 500;

/** A shared secret shorter than this is a password someone typed. */
const MIN_SECRET_LENGTH = 32;

export type FeedConfig = {
  secret: string;
  /** The accounts whose figures this site publishes — and no others. */
  logins: number[];
};

type Env = Record<string, string | undefined>;

/**
 * Whether the feed may accept anything.
 *
 * The list of logins is required, not optional: the reporter could be
 * attached to any terminal on the VPS, and a follower's or a demo account's
 * figures arriving here would be published as part of the record. The list
 * is the same one the page reads (`record-accounts.ts`), so an account is
 * accepted exactly when it would be shown.
 */
export function feedConfig(env: Env = process.env): FeedConfig | null {
  const secret = env.RECORD_INGEST_SECRET ?? "";
  const logins = recordAccounts(env).map((a) => a.login);
  if (secret.length < MIN_SECRET_LENGTH) return null;
  if (logins.length === 0) return null;
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }
  return { secret, logins };
}

/** `Authorization: Bearer <secret>`, compared in constant time. */
export function authorised(header: string | null, secret: string): boolean {
  const claimed = Buffer.from(header?.replace(/^Bearer\s+/i, "") ?? "", "utf8");
  const expected = Buffer.from(secret, "utf8");
  if (claimed.length !== expected.length) return false;
  return timingSafeEqual(claimed, expected);
}

export type Deal = {
  ticket: number;
  positionId: number;
  /** UTC, from the EA. */
  time: Date;
  type: number;
  entry: number;
  symbol: string;
  volume: number;
  price: number;
  profit: number;
  swap: number;
  commission: number;
  fee: number;
};

export type Report = {
  login: number;
  takenAt: Date;
  balance: number;
  equity: number;
  equityLow: number | null;
  deals: Deal[];
};

const isNum = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v);
const isId = (v: unknown): v is number =>
  typeof v === "number" && Number.isSafeInteger(v) && v >= 0;

/** Unix seconds to a Date, refusing what cannot be a reading from this era. */
function unix(v: unknown): Date | null {
  if (!isId(v)) return null;
  // 2000-01-01 to an hour from now. A clock far ahead of ours is a broken
  // conversion from server time, and a future point would sit on the chart
  // as "today" until the future arrived.
  if (v < 946_684_800 || v * 1000 > Date.now() + 3_600_000) return null;
  return new Date(v * 1000);
}

/**
 * The body, checked field by field. Returns a reason on refusal, because the
 * only person who will ever read it is the owner looking at the EA's journal.
 */
export function parseReport(
  body: unknown,
): { ok: true; report: Report } | { ok: false; reason: string } {
  if (typeof body !== "object" || body === null) {
    return { ok: false, reason: "body is not an object" };
  }
  const b = body as Record<string, unknown>;

  if (!isId(b.login) || b.login === 0) return { ok: false, reason: "login" };
  const takenAt = unix(b.taken_at);
  if (!takenAt) return { ok: false, reason: "taken_at" };
  if (!isNum(b.balance)) return { ok: false, reason: "balance" };
  if (!isNum(b.equity)) return { ok: false, reason: "equity" };
  if (b.equity_low !== undefined && b.equity_low !== null && !isNum(b.equity_low)) {
    return { ok: false, reason: "equity_low" };
  }

  const rawDeals = b.deals ?? [];
  if (!Array.isArray(rawDeals)) return { ok: false, reason: "deals" };
  if (rawDeals.length > MAX_DEALS) {
    return { ok: false, reason: `more than ${MAX_DEALS} deals` };
  }

  const deals: Deal[] = [];
  for (const [i, raw] of rawDeals.entries()) {
    const d = (raw ?? {}) as Record<string, unknown>;
    const time = unix(d.time);
    if (
      !isId(d.ticket) ||
      !isId(d.position_id) ||
      !time ||
      !isId(d.type) ||
      !isId(d.entry) ||
      typeof (d.symbol ?? "") !== "string" ||
      ![d.volume, d.price, d.profit, d.swap, d.commission, d.fee].every(
        (n) => n === undefined || isNum(n),
      )
    ) {
      return { ok: false, reason: `deal ${i}` };
    }
    deals.push({
      ticket: d.ticket,
      positionId: d.position_id,
      time,
      type: d.type,
      entry: d.entry,
      symbol: String(d.symbol ?? "").slice(0, 32),
      volume: (d.volume as number | undefined) ?? 0,
      price: (d.price as number | undefined) ?? 0,
      profit: (d.profit as number | undefined) ?? 0,
      swap: (d.swap as number | undefined) ?? 0,
      commission: (d.commission as number | undefined) ?? 0,
      fee: (d.fee as number | undefined) ?? 0,
    });
  }

  return {
    ok: true,
    report: {
      login: b.login,
      // To the minute, so a resend of the same report is the same row.
      takenAt: new Date(Math.floor(takenAt.getTime() / 60_000) * 60_000),
      balance: b.balance,
      equity: b.equity,
      equityLow: isNum(b.equity_low) ? b.equity_low : null,
      deals,
    },
  };
}

function check(result: { error: unknown }, what: string): void {
  if (!result.error) return;
  const e = result.error as { message?: unknown };
  throw new Error(`record-feed ${what}: ${String(e.message ?? result.error)}`);
}

/** Upserts, both of them: a resend lands on the rows it already wrote. */
export async function storeReport(report: Report): Promise<void> {
  const db = serviceClient();

  check(
    await db.from("account_snapshots").upsert(
      {
        login: report.login,
        taken_at: report.takenAt.toISOString(),
        balance: report.balance,
        equity: report.equity,
        equity_low: report.equityLow,
      },
      { onConflict: "login,taken_at" },
    ),
    "snapshot",
  );

  if (report.deals.length === 0) return;

  check(
    await db.from("account_deals").upsert(
      report.deals.map((d) => ({
        login: report.login,
        ticket: d.ticket,
        position_id: d.positionId,
        time: d.time.toISOString(),
        type: d.type,
        entry: d.entry,
        symbol: d.symbol,
        volume: d.volume,
        price: d.price,
        profit: d.profit,
        swap: d.swap,
        commission: d.commission,
        fee: d.fee,
      })),
      { onConflict: "login,ticket" },
    ),
    "deals",
  );
}
