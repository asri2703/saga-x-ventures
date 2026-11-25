import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RecordChart } from "@/components/record-chart";
import { recordPoints, type RecordPoint } from "@/lib/record";
import { Container, Section } from "@/components/ui";
import { Eyebrow } from "@/components/shell";

/**
 * The record chart, with numbers in it.
 *
 * /copytrade draws nothing until the account feed exists, which is correct
 * and also means nobody can see what the chart looks like. This page exists
 * so the owner can.
 *
 * It does not ship. `notFound()` on a production build means the route is a
 * 404 on the live site, so the invented series below cannot be reached,
 * linked, indexed or screenshotted by anyone but whoever is running the dev
 * server. That is the whole reason the sample lives here and not in
 * `record.ts`, where a guard would fail on it and, more to the point, where
 * it would be one `return` away from the public page.
 *
 *     npm run dev  →  http://localhost:3000/preview/record-chart
 */

export const metadata: Metadata = {
  title: "Record chart preview",
  robots: { index: false, follow: false },
};

/* Invented. Deliberately unremarkable: it rises, falls, rises again and
   ends below its own high, because a sample that only goes up teaches the
   eye to expect a shape the real feed may not have. */
const SAMPLE: RecordPoint[] = [
  { label: "1 Nov", value: 50000 },
  { label: "4 Nov", value: 51200 },
  { label: "7 Nov", value: 50400 },
  { label: "10 Nov", value: 52800 },
  { label: "13 Nov", value: 52100 },
  { label: "16 Nov", value: 54300 },
  { label: "19 Nov", value: 53100 },
  { label: "22 Nov", value: 55600 },
  { label: "25 Nov", value: 54900 },
];

export default function RecordChartPreview() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <Section pad="py-16">
      <Container>
        <div className="max-w-2xl">
          {/* The site's one tracked-label component, rather than its
              styles copied out: `voice.test.ts` bans the second, and it was
              right to. */}
          <Eyebrow>Preview only, not on the live site</Eyebrow>
          <h1 className="display mt-3 text-3xl text-pine">
            The record chart, with sample numbers.
          </h1>
          <p className="mt-4 leading-relaxed text-pine-soft">
            These nine readings are made up. They exist so the chart can be
            looked at before the account feed is connected. The live page
            draws the empty frame below instead, and will go on doing that
            until <code>recordPoints()</code> returns something.
          </p>
        </div>

        <div className="mt-12">
          <h2 className="display text-xl text-pine">With a series</h2>
          <div className="mt-6">
            <RecordChart points={SAMPLE} name="Balance" empty="" />
          </div>
        </div>

        <div className="mt-16">
          <h2 className="display text-xl text-pine">
            With what the live page has today
          </h2>
          <div className="mt-6">
            <RecordChart
              points={recordPoints()}
              name="Balance"
              empty="The line starts the day the account feed is connected. Nothing is drawn here until it is."
            />
          </div>
        </div>
      </Container>
    </Section>
  );
}
