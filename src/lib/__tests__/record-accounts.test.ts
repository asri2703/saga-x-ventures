import { expect, test } from "vitest";
import { CENTS_PER_USD } from "@/lib/commercial";
import { divisorFor, recordAccounts } from "@/lib/record-accounts";

/**
 * Which accounts /copytrade publishes, and in what unit.
 *
 * The unit is the figure that can go most wrong: a cent account read as a
 * dollar one shows a balance a hundred times too large. So the tests are
 * mostly about what is left out rather than guessed.
 */

test("Jade alone, as cent by default", () => {
  const [master, ...rest] = recordAccounts({ RECORD_ACCOUNT_LOGIN: "11111111" });
  expect(rest).toEqual([]);
  expect(master).toMatchObject({
    key: "master",
    login: 11111111,
    unit: "cent",
    label: "Jade",
  });
});

test("three accounts, Jade first, each with its own unit", () => {
  const accounts = recordAccounts({
    RECORD_ACCOUNT_LOGIN: "11111111",
    RECORD_ACCOUNT_LOGIN_2: "222",
    RECORD_ACCOUNT_UNIT_2: "cent",
    RECORD_ACCOUNT_LOGIN_3: "333",
    RECORD_ACCOUNT_UNIT_3: "USD",
  });
  expect(accounts.map((a) => [a.login, a.unit])).toEqual([
    [11111111, "cent"],
    [222, "cent"],
    [333, "usd"],
  ]);
});

test("an extra account without a valid unit is left out, not guessed", () => {
  const base = { RECORD_ACCOUNT_LOGIN: "11111111", RECORD_ACCOUNT_LOGIN_2: "222" };
  expect(recordAccounts(base)).toHaveLength(1);
  expect(recordAccounts({ ...base, RECORD_ACCOUNT_UNIT_2: "cents" })).toHaveLength(1);
});

test("the accounts are named, not described in MT5 terms", () => {
  const accounts = recordAccounts({
    RECORD_ACCOUNT_LOGIN: "1",
    RECORD_ACCOUNT_LOGIN_2: "2",
    RECORD_ACCOUNT_UNIT_2: "cent",
    RECORD_ACCOUNT_LOGIN_3: "3",
    RECORD_ACCOUNT_UNIT_3: "usd",
  });
  expect(accounts.map((a) => a.label)).toEqual(["Jade", "Onyx", "Amber"]);
  // "master" is terminology for somebody who already runs copytrade, which
  // the reader most likely to be here does not.
  for (const a of accounts) {
    expect(a.label).not.toMatch(/master/i);
  }
});

test("an account carries a name and a unit, and nothing else to read", () => {
  // The badge and the note are gone, on the owner's call: a follower does
  // not choose which master to copy. Anything left behind would render an
  // empty element rather than fail, so the shape itself is the assertion.
  const accounts = recordAccounts({
    RECORD_ACCOUNT_LOGIN: "1",
    RECORD_ACCOUNT_LOGIN_2: "2",
    RECORD_ACCOUNT_UNIT_2: "cent",
  });
  expect(accounts).toHaveLength(2);
  for (const a of accounts) {
    expect(Object.keys(a).sort()).toEqual(["key", "label", "login", "unit"]);
  }
});

test("a login is listed once, and a bad login is skipped", () => {
  const accounts = recordAccounts({
    RECORD_ACCOUNT_LOGIN: "11111111",
    RECORD_ACCOUNT_LOGIN_2: "11111111",
    RECORD_ACCOUNT_UNIT_2: "cent",
    RECORD_ACCOUNT_LOGIN_3: "abc",
    RECORD_ACCOUNT_UNIT_3: "usd",
  });
  expect(accounts.map((a) => a.login)).toEqual([11111111]);
});

test("no master is fine: the extra accounts still show", () => {
  const accounts = recordAccounts({ RECORD_ACCOUNT_LOGIN_2: "2", RECORD_ACCOUNT_UNIT_2: "usd" });
  expect(accounts.map((a) => a.key)).toEqual(["second"]);
});

test("a cent account divides by the one cents-per-dollar constant", () => {
  expect(divisorFor("cent")).toBe(CENTS_PER_USD);
  expect(divisorFor("usd")).toBe(1);
});
