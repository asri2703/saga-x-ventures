import { CENTS_PER_USD } from "@/lib/commercial";

/**
 * The accounts whose record /copytrade publishes.
 *
 * All of them run the same EA, Fuky AA, and all three have been the master
 * at some point. The first is the master now — the one a new follower's
 * account copies. The other two are earlier masters: one still trades for
 * the followers it already has but takes no new ones, the other is the
 * oldest. Their records are the same strategy over a longer stretch, and
 * each is labelled so nobody takes it for the account they would be copying.
 *
 * The logins live in the environment, the labels here. A slot without a
 * login is simply not shown, so the page works with one account or three.
 *
 * The unit is not optional for the extra accounts. A cent account read as a
 * dollar one shows a balance a hundred times too large — the worst figure
 * this page could get wrong — so a slot whose unit is missing or misspelt is
 * left out rather than guessed. The master keeps its default of cent, which
 * is what it has always been.
 *
 * Every account that is configured is shown, whatever its record says. A
 * record that drops the account having a bad month is no longer a record.
 */

export type RecordUnit = "cent" | "usd";

export type RecordAccount = {
  /** Stable, for React keys and element ids. */
  key: string;
  login: number;
  /** On the tab. */
  label: string;
  /** Under the tab's figures: what this account is, and whether it is the
   *  one a follower copies. */
  note: string;
  unit: RecordUnit;
  /** Whether this is the account a follower's account copies. */
  copied: boolean;
  /** A short status on the tab, if any. */
  badge?: string;
};

const SLOTS: {
  key: string;
  loginEnv: string;
  unitEnv: string;
  /** Used when `unitEnv` is unset. Only the master has one. */
  defaultUnit?: RecordUnit;
  label: string;
  note: string;
  copied: boolean;
  badge?: string;
}[] = [
  {
    key: "master",
    loginEnv: "RECORD_ACCOUNT_LOGIN",
    unitEnv: "RECORD_ACCOUNT_UNIT",
    defaultUnit: "cent",
    label: "Master account",
    note: "The account copytrade follows. Yours copies this one.",
    copied: true,
    badge: "The one you copy",
  },
  {
    key: "second",
    loginEnv: "RECORD_ACCOUNT_LOGIN_2",
    unitEnv: "RECORD_ACCOUNT_UNIT_2",
    label: "Earlier master",
    note: "Copytrade followed this account before the current master. It still runs the same EA for the followers it already has, but takes no new ones.",
    copied: false,
    badge: "Closed to new followers",
  },
  {
    key: "third",
    loginEnv: "RECORD_ACCOUNT_LOGIN_3",
    unitEnv: "RECORD_ACCOUNT_UNIT_3",
    label: "Previous master",
    note: "An earlier master account on the same EA. Copytrade now follows the current master, not this one.",
    copied: false,
  },
];

type Env = Record<string, string | undefined>;

function parseUnit(value: string | undefined): RecordUnit | null {
  const v = value?.trim().toLowerCase();
  return v === "cent" || v === "usd" ? v : null;
}

/** The configured accounts, master first. A login is listed once at most. */
export function recordAccounts(env: Env = process.env): RecordAccount[] {
  const seen = new Set<number>();
  const out: RecordAccount[] = [];

  for (const slot of SLOTS) {
    const login = Number(env[slot.loginEnv]);
    if (!Number.isSafeInteger(login) || login <= 0 || seen.has(login)) continue;

    const unit = parseUnit(env[slot.unitEnv]) ?? slot.defaultUnit ?? null;
    if (!unit) continue;

    seen.add(login);
    out.push({
      key: slot.key,
      login,
      label: slot.label,
      note: slot.note,
      unit,
      copied: slot.copied,
      badge: slot.badge,
    });
  }
  return out;
}

/** How many of the account's own units make one dollar. */
export function divisorFor(unit: RecordUnit): number {
  return unit === "cent" ? CENTS_PER_USD : 1;
}
