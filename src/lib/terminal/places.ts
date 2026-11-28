/**
 * Where a story happens, for its map cover. A short gazetteer of the places
 * gold and oil news keeps returning to, matched on the story's own words.
 * Pure: the same headline always finds the same place.
 *
 * More specific places come first, so "Houthi strike in the Red Sea" maps
 * to the Red Sea before Yemen, and "Kyiv" to Ukraine before Russia.
 * `span` is how many degrees of longitude the map shows around the point.
 */

export type Place = { slug: string; name: string; lon: number; lat: number; span: number; match: RegExp };

export const PLACES: Place[] = [
  { slug: "hormuz", name: "Strait of Hormuz", lon: 56.4, lat: 26.6, span: 14, match: /hormuz/i },
  { slug: "red-sea", name: "Red Sea", lon: 40, lat: 17, span: 22, match: /red sea|bab[- ]el[- ]mandeb|houthi/i },
  { slug: "suez", name: "Suez Canal", lon: 32.5, lat: 30.5, span: 12, match: /suez/i },
  { slug: "taiwan", name: "Taiwan Strait", lon: 120.5, lat: 24, span: 14, match: /taiwan/i },
  { slug: "south-china-sea", name: "South China Sea", lon: 114, lat: 13, span: 24, match: /south china sea/i },
  { slug: "black-sea", name: "Black Sea", lon: 34.5, lat: 43, span: 16, match: /black sea/i },
  { slug: "panama", name: "Panama Canal", lon: -79.7, lat: 9.1, span: 10, match: /panama canal/i },
  { slug: "gaza", name: "Gaza and Israel", lon: 34.8, lat: 31.5, span: 10, match: /gaza|israel|west bank|hamas/i },
  { slug: "lebanon", name: "Lebanon", lon: 35.8, lat: 33.9, span: 8, match: /lebanon|hezbollah|beirut/i },
  { slug: "ukraine", name: "Ukraine", lon: 31, lat: 49, span: 20, match: /ukrain|kyiv|kiev|zelensk/i },
  { slug: "kuwait", name: "Kuwait", lon: 47.6, lat: 29.3, span: 10, match: /kuwait/i },
  { slug: "qatar", name: "Qatar", lon: 51.2, lat: 25.3, span: 10, match: /qatar|doha/i },
  { slug: "uae", name: "United Arab Emirates", lon: 54.3, lat: 24.2, span: 12, match: /emirates|\buae\b|dubai|abu dhabi/i },
  { slug: "yemen", name: "Yemen", lon: 47.5, lat: 15.5, span: 18, match: /yemen|sanaa|aden|taiz/i },
  { slug: "saudi", name: "Saudi Arabia", lon: 45, lat: 24, span: 24, match: /saudi|riyadh|mecca/i },
  { slug: "iraq", name: "Iraq", lon: 43.7, lat: 33.2, span: 18, match: /iraq|baghdad/i },
  { slug: "syria", name: "Syria", lon: 38.5, lat: 35, span: 14, match: /syria|damascus/i },
  { slug: "iran", name: "Iran", lon: 53.7, lat: 32.4, span: 26, match: /iran|tehran/i },
  { slug: "north-korea", name: "Korean Peninsula", lon: 127.5, lat: 38.5, span: 12, match: /north korea|pyongyang/i },
  { slug: "venezuela", name: "Venezuela", lon: -66.6, lat: 7.1, span: 20, match: /venezuela|caracas/i },
  { slug: "russia", name: "Russia", lon: 45, lat: 56, span: 60, match: /russia|moscow|kremlin|putin/i },
  { slug: "china", name: "China", lon: 104, lat: 35, span: 50, match: /china|beijing|chinese|xi jinping/i },
  { slug: "japan", name: "Japan", lon: 138, lat: 37, span: 22, match: /japan|tokyo/i },
  { slug: "india", name: "India", lon: 79, lat: 22, span: 34, match: /india|delhi|modi/i },
];

export function placeBySlug(slug: string): Place | undefined {
  return PLACES.find((p) => p.slug === slug);
}

/** The first place, in the list's order, that the text names. */
export function findPlace(text: string): Place | null {
  for (const p of PLACES) if (p.match.test(text)) return p;
  return null;
}
