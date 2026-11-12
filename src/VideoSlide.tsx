import { useEffect, useRef, useState } from "react";

const YT_ORIGIN = "https://www.youtube-nocookie.com";
const YT_ID = /(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?(?:[^#]*&)?v=|embed\/|shorts\/|live\/|v\/))([\w-]{11})/;

/** Accepts watch, youtu.be, shorts, live and embed links. */
export const getYouTubeId = (url?: string) => url?.match(YT_ID)?.[1] ?? null;

/**
 * YouTube slide for the project carousel.
 *
 * - Shows a thumbnail first. The real player only loads on tap, so closed carousels cost nothing.
 * - The iframe ignores pointer events and a transparent button sits on top. Cross-origin iframes swallow wheel/touch
 *   events, which would break the carousel scroll and let the page scroll out of the pinned section. The button
 *   forwards play/pause to the player instead.
 * - The player is unmounted when the carousel closes (the scroll hook fires "carouselclose") or the slide scrolls out of
 *   view, which stops playback.
 */
export function VideoSlide({ url }: { url?: string }) {
  const id = getYouTubeId(url);
  const [active, setActive] = useState(false);
  const [playing, setPlaying] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const card = wrapRef.current?.closest(".project-card");
    if (!card) return;
    const reset = () => {
      setActive(false);
      setPlaying(false);
    };
    card.addEventListener("carouselclose", reset);
    return () => card.removeEventListener("carouselclose", reset);
  }, []);

  // Scrolled out of view while playing: unmount so it doesn't keep playing audio off-screen.
  useEffect(() => {
    const el = wrapRef.current;
    if (!active || !el) return;
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) {
        setActive(false);
        setPlaying(false);
      }
    });
    io.observe(el);
    return () => io.disconnect();
  }, [active]);

  // Track play/pause state reported by the player.
  useEffect(() => {
    if (!active) return;
    const onMessage = (e: MessageEvent) => {
      if (e.source !== frameRef.current?.contentWindow) return;
      let data = e.data;
      if (typeof data === "string") {
        try {
          data = JSON.parse(data);
        } catch {
          return;
        }
      }
      const state = data?.event === "onStateChange" ? data.info : data?.info?.playerState;
      if (typeof state === "number") setPlaying(state === 1 || state === 3); // 1 playing, 3 buffering
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [active]);

  if (!id) {
    // No (valid) URL in Sanity yet.
    return (
      <div className="carousel-item">
        <div className="c-img-landscape c-video">▶</div>
      </div>
    );
  }

  const post = (message: object) => frameRef.current?.contentWindow?.postMessage(JSON.stringify(message), YT_ORIGIN);
  const toggle = () => post({ event: "command", func: playing ? "pauseVideo" : "playVideo", args: [] });
  const subscribe = () => post({ event: "listening", id: 1, channel: "widget" });

  const src =
    `${YT_ORIGIN}/embed/${id}?autoplay=1&controls=0&rel=0&modestbranding=1&playsinline=1&iv_load_policy=3` +
    `&enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}`;

  return (
    <div className="carousel-item">
      <div className="c-img-landscape c-video-frame" ref={wrapRef}>
        {active ? (
          <>
            <iframe
              ref={frameRef}
              src={src}
              title="Project video"
              allow="autoplay; encrypted-media; picture-in-picture"
              onLoad={subscribe}
            />
            <button
              type="button"
              className="c-video-shield"
              data-playing={playing}
              onClick={toggle}
              aria-label={playing ? "Pause video" : "Play video"}
            />
          </>
        ) : (
          <button
            type="button"
            className="c-video-shield"
            style={{ backgroundImage: `url(https://i.ytimg.com/vi/${id}/hqdefault.jpg)` }}
            onClick={() => {
              setActive(true);
              setPlaying(true);
            }}
            aria-label="Play video"
          />
        )}
      </div>
    </div>
  );
}
