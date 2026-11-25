"use client";

import Image from "next/image";
import { useState } from "react";

/**
 * A YouTube video that does not load YouTube until it is asked to.
 *
 * The ordinary embed is an iframe that runs on page load: roughly a megabyte
 * of player, and a request to Google carrying the reader's address and this
 * page's URL, whether or not they ever press play. On a page whose whole
 * argument is "your money stays with you", that is a poor first act, and it
 * is paid for by every visitor who scrolls past.
 *
 * So the still is served from this site and the player is built on the first
 * press. `autoplay=1` is on the src that replaces it, which is why the press
 * starts the video rather than loading a second play button to press.
 *
 * `youtube-nocookie.com` is Google's own domain for this: it holds back the
 * advertising cookies until the viewer actually watches.
 */

export function VideoEmbed({
  id,
  title,
  still,
}: {
  /** The YouTube id, not the URL. */
  id: string;
  title: string;
  /** A file in `public/video/`. */
  still: string;
}) {
  const [playing, setPlaying] = useState(false);

  return (
    <div className="video-frame">
      {playing ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
        />
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          className="video-cover"
        >
          <Image
            src={`/video/${still}`}
            alt=""
            fill
            sizes="(max-width: 48rem) 100vw, 48rem"
            className="object-cover"
          />
          {/* The name of the control is what pressing it does, and the title
              is how a reader choosing between links tells them apart. */}
          <span className="sr-only">Play: {title}</span>
          <span aria-hidden className="video-play">
            <svg viewBox="0 0 24 24" className="h-7 w-7">
              {/* Nudged right by half a point: a triangle centred on its
                  bounding box reads as sitting left inside a circle. */}
              <path d="M9 6.5 18.5 12 9 17.5Z" fill="currentColor" />
            </svg>
          </span>
        </button>
      )}
    </div>
  );
}
