import { geoContains, geoMercator, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import type { Topology, GeometryCollection } from "topojson-specification";
import world from "world-atlas/countries-110m.json";
import type { Place } from "./places";

/**
 * A small locator map for a story's cover: the region around a place, the
 * country it sits in picked out, and a marker on the spot.
 *
 * Drawn from Natural Earth's 1:110m country outlines (public domain, via the
 * world-atlas package). Rendered once per place at build time and served as
 * a static SVG, so a card costs one cached image, not a world of paths.
 */

const W = 640;
const H = 360;

const COLOURS = {
  sea: "#e2e8e0",
  land: "#f6efe0",
  border: "#cdbf9f",
  focus: "#f0dcae",
  focusBorder: "#b9a172",
  marker: "#c81f30",
  ink: "#163a30",
  halo: "#faf4e8",
};

let countries: Feature<Geometry>[] | null = null;
function land(): Feature<Geometry>[] {
  if (!countries) {
    const topo = world as unknown as Topology<{ countries: GeometryCollection }>;
    countries = (feature(topo, topo.objects.countries) as FeatureCollection<Geometry>).features;
  }
  return countries;
}

function escape(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function mapSvg(place: Place): string {
  const scale = W / ((place.span * Math.PI) / 180);
  const projection = geoMercator()
    .center([place.lon, place.lat])
    .scale(scale)
    .translate([W / 2, H / 2]);
  const path = geoPath(projection);
  const point: [number, number] = [place.lon, place.lat];

  const shapes = land()
    .map((c) => {
      const d = path(c);
      if (!d) return "";
      const focus = geoContains(c, point);
      return `<path d="${d}" fill="${focus ? COLOURS.focus : COLOURS.land}" stroke="${focus ? COLOURS.focusBorder : COLOURS.border}" stroke-width="${focus ? 1.2 : 0.8}"/>`;
    })
    .join("");

  const [x, y] = projection(point) ?? [W / 2, H / 2];
  const label = escape(place.name);
  const right = x < W - 220;
  const tx = right ? x + 16 : x - 16;
  const anchor = right ? "start" : "end";

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Map of ${label}">`,
    `<rect width="${W}" height="${H}" fill="${COLOURS.sea}"/>`,
    shapes,
    `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="18" fill="${COLOURS.marker}" fill-opacity="0.14"/>`,
    `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="6" fill="${COLOURS.marker}" stroke="${COLOURS.halo}" stroke-width="2"/>`,
    `<text x="${tx.toFixed(1)}" y="${(y + 5).toFixed(1)}" text-anchor="${anchor}" font-family="system-ui, sans-serif" font-size="17" font-weight="600" fill="${COLOURS.ink}" stroke="${COLOURS.halo}" stroke-width="4" paint-order="stroke">${label}</text>`,
    `<text x="${W - 10}" y="${H - 10}" text-anchor="end" font-family="system-ui, sans-serif" font-size="10" fill="${COLOURS.ink}" fill-opacity="0.55">Natural Earth</text>`,
    `</svg>`,
  ].join("");
}
