import { describe, expect, it } from "vitest";
import { leadSymbol, symbolTitle } from "../terminal/headline";
import { marksFor } from "../../components/hq/instrument-icon";

describe("leadSymbol", () => {
  it("takes the first tagged instrument", () => {
    expect(leadSymbol({ assets: [{ symbol: "USDJPY" }, { symbol: "XAUUSD" }] })).toBe("USDJPY");
  });
  it("falls back to gold when nothing is tagged", () => {
    expect(leadSymbol({ assets: [] })).toBe("XAUUSD");
    expect(leadSymbol({ assets: null })).toBe("XAUUSD");
    expect(leadSymbol({})).toBe("XAUUSD");
  });
});

describe("symbolTitle", () => {
  it("leads the headline with its symbol", () => {
    expect(symbolTitle("XAUUSD", " Gold reclaims $3,600 ")).toBe("XAUUSD: Gold reclaims $3,600");
  });
  it("does not repeat a symbol the title already starts with", () => {
    expect(symbolTitle("EURUSD", "EURUSD: Euro slips")).toBe("EURUSD: Euro slips");
    expect(symbolTitle("DXY", "dxy rises on payrolls")).toBe("dxy rises on payrolls");
  });
});

describe("marksFor", () => {
  it("splits a currency pair into two marks", () => {
    expect(marksFor("USDJPY")).toEqual(["USD", "JPY"]);
  });
  it("shows gold and the dollar index as one mark", () => {
    expect(marksFor("XAUUSD")).toEqual(["XAU"]);
    expect(marksFor("DXY")).toEqual(["DXY"]);
  });
  it("shows nothing for an unknown shape", () => {
    expect(marksFor("SPX")).toEqual([]);
  });
});
