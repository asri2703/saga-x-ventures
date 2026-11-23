import { expect, test } from "vitest";
import { centreRecommended } from "@/components/plan-cards";
import { fukyaaPlanCards, masteryPlanCards } from "@/lib/plans";

/**
 * The recommended plan sits in the middle of the row.
 *
 * The owner asked for it there, and the card that sits there is lifted out of
 * the row. A lifted card at either end rises above one neighbour and over the
 * edge of the grid on the other side, which reads as a mistake rather than as
 * emphasis — so where it sits and the fact that it lifts are one decision,
 * and this is the half of it a test can hold.
 *
 * Declaration order in `commercial.ts` stays shortest term to longest,
 * because that is what the arithmetic reads. Nothing here should push that
 * order back into the data.
 */

test("the helper moves a recommended plan to the middle and leaves the rest in order", () => {
  const plan = (key: string, recommended: boolean) =>
    ({ key, recommended }) as Parameters<typeof centreRecommended>[0][number];

  expect(
    centreRecommended([plan("a", false), plan("b", false), plan("c", true)]).map(
      (p) => p.key,
    ),
  ).toEqual(["a", "c", "b"]);

  // Already in the middle, or no recommendation at all: left alone.
  expect(
    centreRecommended([plan("a", false), plan("b", true), plan("c", false)]).map(
      (p) => p.key,
    ),
  ).toEqual(["a", "b", "c"]);
  expect(
    centreRecommended([plan("a", false), plan("b", false), plan("c", false)]).map(
      (p) => p.key,
    ),
  ).toEqual(["a", "b", "c"]);
});

test("a row that is not three is returned untouched", () => {
  // There is no middle of two, and this is not a general sort.
  const plan = (key: string, recommended: boolean) =>
    ({ key, recommended }) as Parameters<typeof centreRecommended>[0][number];
  const two = [plan("a", false), plan("b", true)];
  expect(centreRecommended(two)).toBe(two);
});

test("both products put their recommendation in the middle", () => {
  for (const cards of [masteryPlanCards(), fukyaaPlanCards()]) {
    const row = centreRecommended(cards);
    expect(row).toHaveLength(3);
    expect(row[1].recommended, row.map((c) => c.key).join(",")).toBe(true);
  }
});

test("centring does not drop or duplicate a plan", () => {
  const before = masteryPlanCards().map((c) => c.key).sort();
  const after = centreRecommended(masteryPlanCards())
    .map((c) => c.key)
    .sort();
  expect(after).toEqual(before);
});
