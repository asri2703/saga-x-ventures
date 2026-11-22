import { expect, test } from "vitest";
import { orgSchema, personSchema } from "@/lib/schema";

test("the organisation declares no social profiles at all", () => {
  // Declaring the agency-era handles would tell Google this domain is the
  // marketing agency it used to be. Declaring nothing is correct — so the
  // key must be absent, not present and empty.
  expect(Object.keys(orgSchema)).not.toContain("sameAs");
  expect(JSON.stringify(orgSchema)).not.toMatch(
    /sameAs|facebook|instagram|linkedin/i,
  );
});

test("the organisation is an Organization and the founder is a Person", () => {
  expect(orgSchema["@type"]).toBe("Organization");
  expect(personSchema["@type"]).toBe("Person");
  expect(personSchema.name).toBe("Asri Zulzali");
});

test("the person is linked to the organisation in both directions", () => {
  expect(orgSchema.founder).toMatchObject({ "@id": personSchema["@id"] });
  expect(personSchema.worksFor).toMatchObject({ "@id": orgSchema["@id"] });
});

test("the schema makes no performance claim", () => {
  const serialised = JSON.stringify([orgSchema, personSchema]);
  expect(serialised).not.toMatch(/win[-\s]?rate|guarantee|profit/i);
});

test("the address survived the pivot", () => {
  expect(orgSchema.address).toMatchObject({
    addressLocality: "Seremban",
    addressCountry: "MY",
  });
});
