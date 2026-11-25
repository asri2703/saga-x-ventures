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

test("the master alone, as cent by default", () => {
  const [master, ...rest] = recordAccounts({ RECORD_ACCOUNT_LOGIN: "11111111" });
  expect(rest).toEqual([]);
  expect(master).toMatchObject({ key: "master", login: 11111111, unit: "cent", copied: true });
});

test("three accounts, master first, each with its own unit", () => {
  const accounts = recordAccounts({
    RECORD_ACCOUNT_LOGIN: "11111111",
    RECORD_ACCOUNT_LOGIN_2: "222",
    RECORD_ACCOUNT_UNIT_2: "cent",
    RECORD_ACCOUNT_LOGIN_3: "333",
    RECORD_ACCOUNT_UNIT_3: "USD",
  });
  expect(accounts.map((a) => [a.login, a.unit, a.copied])).toEqual([
    [11111111, "cent", true],
    [222, "cent", false],
    [333, "usd", false],
  ]);
});

test("an extra account without a valid unit is left out, not guessed", () => {
  const base = { RECORD_ACCOUNT_LOGIN: "11111111", RECORD_ACCOUNT_LOGIN_2: "222" };
  expect(recordAccounts(base)).toHaveLength(1);
  expect(recordAccounts({ ...base, RECORD_ACCOUNT_UNIT_2: "cents" })).toHaveLength(1);
});

test("each earlier master says what it is, and only the current one is 'copied'", () => {
  const accounts = recordAccounts({
    RECORD_ACCOUNT_LOGIN: "1",
    RECORD_ACCOUNT_LOGIN_2: "2",
    RECORD_ACCOUNT_UNIT_2: "cent",
    RECORD_ACCOUNT_LOGIN_3: "3",
    RECORD_ACCOUNT_UNIT_3: "usd",
  });
  expect(accounts.map((a) => [a.label, a.badge ?? null])).toEqual([
    ["Master account", "The one you copy"],
    ["Earlier master", "Closed to new followers"],
    ["Previous master", null],
  ]);
  // The two earlier masters must not read as the account a follower copies.
  for (const a of accounts.slice(1)) {
    expect(a.note).toMatch(/not this one|takes no new ones/);
  }
});

test("only the master may be copied, whatever is configured", () => {
  const accounts = recordAccounts({
    RECORD_ACCOUNT_LOGIN: "1",
    RECORD_ACCOUNT_LOGIN_2: "2",
    RECORD_ACCOUNT_UNIT_2: "usd",
  });
  expect(accounts.filter((a) => a.copied).map((a) => a.login)).toEqual([1]);
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
