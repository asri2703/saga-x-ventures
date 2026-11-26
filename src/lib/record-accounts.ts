import { CENTS_PER_USD } from "@/lib/commercial";

/**
 * The accounts whose record /copytrade publishes.
 *
 * All of them run the same EA, Fuky AA, on the same settings, and each has
 * been the master at some point. Jade is the master now; Onyx and Amber are
 * earlier ones, oldest last.
 *
 * They are named rather than described. "Master account", "Earlier master"
 * and "Previous master" were accurate and were MT5 terminology, which the
 * people most likely to read this page do not have. A gemstone is a
 * designation: it implies no person, no rank, and — unlike three human names
 * — no claim that three different traders are behind three accounts running
 * one EA.
 *
 * They carry no badge and no note. The owner's reason: a follower does not
 * choose which master to copy, so which one is current is not a distinction
 * the reader has to act on. The `Since <month>` line on each tab is the only
 * context a tab gives, and it is enough to order them.
 *
 * The logins live in the environment, the labels here. A slot without a
 * login is simply not shown, so the page works with one account or three.
 *
 * The unit is not optional for the extra accounts. A cent account read as a
 * dollar one shows a balance a hundred times too large — the worst figure
 * this page could get wrong — so a slot whose unit is missing or misspelt is
 * left out rather than guessed. Jade keeps its default of cent, which is
 * what it has always been.
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
  unit: RecordUnit;
};

const SLOTS: {
  key: string;
  loginEnv: string;
  unitEnv: string;
  /** Used when `unitEnv` is unset. Only Jade has one. */
  defaultUnit?: RecordUnit;
  label: string;
}[] = [
  {
    key: "master",
    loginEnv: "RECORD_ACCOUNT_LOGIN",
    unitEnv: "RECORD_ACCOUNT_UNIT",
    defaultUnit: "cent",
    label: "Jade",
  },
  {
    key: "second",
    loginEnv: "RECORD_ACCOUNT_LOGIN_2",
    unitEnv: "RECORD_ACCOUNT_UNIT_2",
    label: "Onyx",
  },
  {
    key: "third",
    loginEnv: "RECORD_ACCOUNT_LOGIN_3",
    unitEnv: "RECORD_ACCOUNT_UNIT_3",
    label: "Amber",
  },
];

type Env = Record<string, string | undefined>;

function parseUnit(value: string | undefined): RecordUnit | null {
  const v = value?.trim().toLowerCase();
  return v === "cent" || v === "usd" ? v : null;
}

/** The configured accounts, Jade first. A login is listed once at most. */
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
      unit,
    });
  }
  return out;
}

/** How many of the account's own units make one dollar. */
export function divisorFor(unit: RecordUnit): number {
  return unit === "cent" ? CENTS_PER_USD : 1;
}
