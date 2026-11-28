import { describe, expect, it } from "vitest";
import { headlineSymbol, symbolTitle } from "../terminal/headline";
import { marksFor } from "../../components/hq/instrument-icon";

const tags = (...symbols: string[]) => symbols.map((symbol) => ({ symbol }));

describe("headlineSymbol", () => {
  it("leads with a tagged instrument the headline names", () => {
    const item = { assets: tags("XAUUSD", "DXY"), category: "fed" };
    expect(headlineSymbol(item, "Gold pares gains as Fed-hike risks linger")).toBe("XAUUSD");
  });
  it("takes the named one even when it is not the first tag", () => {
    const item = { assets: tags("XAUUSD", "USDJPY"), category: "central-banks" };
    expect(headlineSymbol(item, "Yen slides as BoJ holds")).toBe("USDJPY");
  });
  it("ties euro-area politics to EURUSD", () => {
    const item = { assets: tags("EURUSD"), category: "politics" };
    expect(headlineSymbol(item, "Divisions deepen in the EU after a tense budget summit")).toBe("EURUSD");
  });
  it("ties a big euro-area economy's politics to EURUSD", () => {
    const item = { assets: tags("EURUSD"), category: "politics" };
    expect(headlineSymbol(item, "Far-right gains in Spain point to a possible political shift")).toBe("EURUSD");
    expect(headlineSymbol(item, "German coalition talks collapse")).toBe("EURUSD");
  });
  it("names a euro-area country without moving a story the euro is not tagged on", () => {
    const item = { assets: tags("XAUUSD", "DXY"), category: "geopolitics" };
    expect(headlineSymbol(item, "Italians killed in Kuwait: why is Iran denying it?")).toBeNull();
  });
  it("keeps US data and Fed stories on their first tag", () => {
    const item = { assets: tags("DXY", "XAUUSD"), category: "us-data" };
    expect(headlineSymbol(item, "October US advance goods trade balance -149.5B")).toBe("DXY");
  });
  it("leaves a safe-haven tag off a war story that never names gold", () => {
    const item = { assets: tags("XAUUSD", "USDJPY", "USDCHF"), category: "geopolitics" };
    expect(headlineSymbol(item, "Israeli strike on Gaza clinic kills two staff")).toBeNull();
  });
  it("ignores an instrument named but not tagged", () => {
    expect(headlineSymbol({ assets: tags("XAUUSD"), category: "geopolitics" }, "Italy says drone came from Japan")).toBeNull();
    expect(headlineSymbol({ assets: [], category: "fed" }, "Fed holds")).toBeNull();
    expect(headlineSymbol({}, "Gold rises")).toBeNull();
  });
  it("does not match a word inside another word", () => {
    const item = { assets: tags("GBPUSD"), category: "politics" };
    expect(headlineSymbol(item, "Ukraine rejects compromises")).toBeNull();
  });
});

describe("symbolTitle", () => {
  it("leads the headline with its symbol", () => {
    expect(symbolTitle("XAUUSD", " Gold reclaims $3,600 ")).toBe("XAUUSD: Gold reclaims $3,600");
  });
  it("leaves the headline alone without a symbol", () => {
    expect(symbolTitle(null, " Kyiv offers a ceasefire ")).toBe("Kyiv offers a ceasefire");
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
