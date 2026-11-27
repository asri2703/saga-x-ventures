import fs from "node:fs";
import path from "node:path";
import { expect, test } from "vitest";
import { orgSchema, personSchema } from "@/lib/schema";
import { site } from "@/lib/site";

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

test("the award is declared on the person, with its year", () => {
  expect(personSchema.award).toMatch(/Best In-House Trader/);
  expect(JSON.stringify(personSchema)).toContain("2026");
});

test("the former alias is still recorded, and nothing renders it unexplained", () => {
  // The homepage used to carry a line naming it, because the old award photo
  // was a screen showing "Zack King" and a different name on an award reads
  // as borrowed. The new photo is him holding the award and shows no name, so
  // the line went with the picture it explained.
  //
  // The fact is kept because it is true and he may want it back. What this
  // guards is the pairing: if the alias is printed anywhere again, something
  // has to explain whose name it was.
  expect(site.founder.award.alias).toBe("Zack King");

  const page = fs.readFileSync(
    path.join(process.cwd(), "src", "app", "(site)", "page.tsx"),
    "utf8",
  );
  if (page.includes("award.alias")) {
    expect(page).toMatch(/traded under|what I traded|his name|my name/i);
  }
});
