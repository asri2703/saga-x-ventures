"use client";

import Image from "next/image";
import { OverlappingSlider } from "@/components/overlapping-slider";
import type { Feature } from "@/lib/mastery-signal";

/**
 * The features row.
 *
 * A thin wrapper so the page itself can stay a server component: only the
 * slider needs client JS, and only because it is dragged.
 */
export function FeatureSlider({ features }: { features: Feature[] }) {
  return (
    <OverlappingSlider<Feature>
      items={features}
      cardWidth={320}
      cardHeight={440}
      cardGap={16}
      showDots
      renderItem={(feature, _index, isActive) => (
        <article
          className={`panel flex h-full w-full flex-col overflow-hidden transition-colors ${
            isActive ? "panel-active" : ""
          }`}
        >
          <div className="relative h-56 w-full shrink-0 border-b border-rule bg-paper-sunk">
            {feature.image ? (
              <Image
                src={feature.image}
                alt={feature.title}
                fill
                className="object-cover"
                sizes="320px"
              />
            ) : (
              /* Placeholder, not a broken image. The layout can be judged
                 before the screenshots exist, and it is obvious which card
                 is still waiting for one. */
              <div className="flex h-full items-center justify-center px-6 text-center">
                <span className="text-sm text-pine-faint">
                  Screenshot: {feature.title.toLowerCase()}
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-1 flex-col p-6">
            <h3 className="display text-lg leading-snug text-pine">
              {feature.title}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-pine-soft">
              {feature.body}
            </p>
          </div>
        </article>
      )}
    />
  );
}
