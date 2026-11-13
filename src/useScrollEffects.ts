import type { RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Observer } from "gsap/Observer";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, Observer, useGSAP);

// The mobile URL bar showing/hiding fires a resize. Ignoring height-only resizes stops the pinned section re-measuring mid-swipe.
ScrollTrigger.config({ ignoreMobileResize: true });

const PIN_DISTANCE = 1250; // px of page scroll reserved for the pinned "Selected work" section
const SLIDE_DUR = 0.85;
const SLIDE_EASE = "power3.inOut";
const CAROUSEL_SPEED = 1.5; // carousel px per input px
const CAROUSEL_EDGE = 150; // overscroll (px) at either end that closes the carousel

// Chromatic-aberration layers. "leadsOnDown": which channels lead when scrolling down (the rest trail).
const RGB_CHANNELS = [
  { id: "r", sign: 1, k: 1, leadsOnDown: true },
  { id: "y", sign: 1, k: 0.5, leadsOnDown: true },
  { id: "t", sign: -1, k: 0.5, leadsOnDown: false },
  { id: "b", sign: -1, k: 1, leadsOnDown: false },
] as const;

/**
 * Page-level scroll behaviour:
 *  - background grid parallax
 *  - scroll-velocity RGB split on titles
 *  - the pinned project slider (wheel AND touch) with its horizontal case-study carousel
 */
export function useScrollEffects(
  scope: RefObject<HTMLElement | null>,
  workRef: RefObject<HTMLElement | null>,
  enabled: boolean,
  projectCount: number,
) {
  useGSAP(
    () => {
      const work = workRef.current;
      if (!enabled || !work || projectCount === 0) return;

      const root = document.documentElement;
      const parts = Array.from(work.querySelectorAll<HTMLElement>(".project-card")).map((card) => {
        const q = (sel: string) => card.querySelector<HTMLElement>(sel)!;
        return {
          card,
          stage: q(".project-stage"),
          title: q(".project-title-mover"),
          obj: q(".project-object-mover"),
          meta: q(".project-meta"),
          hint: q(".project-hint"),
          carousel: q(".project-carousel"),
          track: q(".carousel-track"),
        };
      });
      const exitIndex = parts.length; // virtual slide after the last project

      let currentIndex = 0;
      let isAnimating = false;
      let isLocked = false;
      let isCarouselActive = false;
      let carouselX = 0;
      let rgbTimeout: ReturnType<typeof setTimeout>;

      // ---------- RGB scroll effect ----------
      const applyRGB = (vel: number) => {
        const abs = Math.abs(vel);
        const alpha = gsap.utils.clamp(0, 0.65, abs / 15);
        const trail = gsap.utils.clamp(0, 25, abs / 15);
        const lead = trail * 0.25;
        const blur = gsap.utils.clamp(0, 6, abs / 40);
        const down = vel > 0;

        gsap.set(root, { "--rgb-alpha": alpha });
        for (const c of RGB_CHANNELS) {
          const leads = c.leadsOnDown === down;
          gsap.to(root, {
            [`--rgb-${c.id}-y`]: `${(leads ? lead : trail) * c.k * c.sign}px`,
            [`--rgb-${c.id}-b`]: `${leads ? 0 : blur * c.k}px`,
            duration: leads ? 0.1 : c.k === 1 ? 0.45 : 0.3,
            ease: "power2.out",
            overwrite: "auto",
          });
        }

        clearTimeout(rgbTimeout);
        rgbTimeout = setTimeout(() => {
          const reset: gsap.TweenVars = { "--rgb-alpha": 0, duration: 0.4, ease: "power2.out", overwrite: "auto" };
          for (const c of RGB_CHANNELS) {
            reset[`--rgb-${c.id}-y`] = "0px";
            reset[`--rgb-${c.id}-b`] = "0px";
          }
          gsap.to(root, reset);
        }, 50);
      };

      // ---------- slide state ----------
      const sync = (target: number) => {
        parts.forEach((p, i) => {
          gsap.set(p.carousel, { opacity: 0, x: 0, pointerEvents: "none" });
          gsap.set(p.obj, { filter: "contrast(100%) blur(0px)", rotation: 0 });

          if (i === target) {
            gsap.set(p.title, { y: 0, scale: 1, opacity: 1 });
            gsap.set(p.obj, { y: 0, scale: 1, opacity: 1 });
            gsap.set([p.meta, p.hint], { opacity: 1, y: 0 });
            gsap.set(p.card, { pointerEvents: "auto", opacity: 1, zIndex: 10 });
          } else {
            const s = i < target ? -1 : 1;
            gsap.set(p.title, { y: 300 * s, scale: 1, opacity: 0 });
            gsap.set(p.obj, { y: 800 * s, scale: 0.4, opacity: 0 });
            gsap.set([p.meta, p.hint], { opacity: 0, y: 10 * s });
            gsap.set(p.card, { pointerEvents: "none", opacity: 0, zIndex: 1 });
          }
        });
      };

      /** dir = 1: moving forward (next project enters from below). dir = -1: backward. */
      const goto = (index: number, dir: 1 | -1) => {
        if (index < 0 || index > exitIndex || isAnimating) return;
        isAnimating = true;
        const cur = parts[currentIndex];
        const next = parts[index];

        const tl = gsap.timeline({
          onComplete: () => {
            isAnimating = false;
            if (index === exitIndex && dir > 0) leaveSection(1);
          },
        });

        if (cur) {
          tl.to(cur.card, { pointerEvents: "none", zIndex: 1, duration: 0 }, 0)
            .to(cur.meta, { opacity: 0, y: -10 * dir, duration: SLIDE_DUR * 0.33 }, 0)
            .to(cur.title, { y: -300 * dir, opacity: 0, duration: SLIDE_DUR, ease: SLIDE_EASE }, 0)
            .to(cur.obj, { y: -800 * dir, scale: 0.4, opacity: 0, duration: SLIDE_DUR, ease: SLIDE_EASE }, 0)
            .to(cur.card, { opacity: 0, duration: 0.2 }, SLIDE_DUR * 0.66);
        }
        if (next) {
          tl.to(next.card, { opacity: 1, zIndex: 10, pointerEvents: "auto", duration: 0.2 }, 0)
            .fromTo(next.title, { y: 300 * dir, opacity: 0, scale: 1 }, { y: 0, opacity: 1, scale: 1, duration: SLIDE_DUR, ease: SLIDE_EASE }, 0)
            .fromTo(
              next.obj,
              { y: 800 * dir, scale: 0.4, opacity: 0 },
              { y: 0, scale: 1, opacity: 1, rotation: 0, filter: "contrast(100%) blur(0px)", duration: SLIDE_DUR, ease: SLIDE_EASE },
              0,
            )
            .fromTo(next.meta, { opacity: 0, y: 10 * dir }, { opacity: 1, y: 0, duration: SLIDE_DUR * 0.5 }, SLIDE_DUR * 0.5);
        }
        currentIndex = index;
      };

      // ---------- carousel ----------
      const openCarousel = (index: number) => {
        if (isAnimating || index !== currentIndex || isCarouselActive) return;
        const p = parts[index];
        isCarouselActive = true;
        isAnimating = true;
        carouselX = 0;
        gsap.set(p.track, { x: 0 });

        gsap
          .timeline({ onComplete: () => (isAnimating = false) })
          .to(p.title, { y: () => -p.stage.clientHeight / 2 - 10, scale: 0.35, duration: 0.8, ease: SLIDE_EASE }, 0) // parks just above the stage, whatever the screen height
          .to(p.obj, { opacity: 0, scale: 1.2, rotation: 15, filter: "contrast(200%) blur(10px)", duration: 0.4, ease: "power2.in" }, 0)
          .to([p.meta, p.hint], { opacity: 0, duration: 0.3 }, 0)
          .fromTo(p.carousel, { x: 100, opacity: 0 }, { x: 0, opacity: 1, pointerEvents: "auto", duration: 0.8, ease: "power3.out" }, 0.2);
      };

      const closeCarousel = (goNext = false) => {
        const p = parts[currentIndex];
        isAnimating = true;
        p.card.dispatchEvent(new Event("carouselclose")); // lets video slides unmount and stop playing

        const tl = gsap.timeline({
          onComplete: () => {
            isAnimating = false;
            isCarouselActive = false;
            if (goNext) goto(currentIndex + 1, 1);
          },
        });
        tl.to(p.carousel, { opacity: 0, x: -50, pointerEvents: "none", duration: 0.4, ease: "power2.in" }, 0);
        if (!goNext) {
          tl.to(p.title, { y: 0, scale: 1, duration: 0.8, ease: SLIDE_EASE }, 0.2)
            .to(p.obj, { opacity: 1, scale: 1, rotation: 0, filter: "contrast(100%) blur(0px)", duration: 0.8, ease: "power3.out" }, 0.2)
            .to([p.meta, p.hint], { opacity: 1, duration: 0.5 }, 0.4);
        }
      };

      // ---------- input ----------
      // Touch and wheel report opposite signs by default (finger up = scroll down, but wheel down = scroll down).
      // wheelSpeed: -1 aligns them so one rule works for both: negative delta = forward.
      const observer = Observer.create({
        target: window,
        type: "wheel,touch",
        wheelSpeed: -1,
        preventDefault: true,
        tolerance: 40,
        onChange: (self) => {
          applyRGB(-self.velocityY * 3);

          if (!isCarouselActive || isAnimating) return;
          const track = parts[currentIndex].track;
          const maxScroll = Math.max(0, track.scrollWidth - window.innerWidth);
          // Horizontal swipes drive the carousel too, whichever axis the gesture mostly follows.
          const delta = Math.abs(self.deltaX) > Math.abs(self.deltaY) ? self.deltaX : self.deltaY;
          carouselX += delta * CAROUSEL_SPEED;

          if (carouselX > CAROUSEL_EDGE) closeCarousel();
          else if (carouselX < -maxScroll - CAROUSEL_EDGE) closeCarousel(true);
          else gsap.to(track, { x: carouselX, duration: 0.5, ease: "power2.out", overwrite: "auto" });
        },
        onUp: () => {
          if (isAnimating || isCarouselActive) return;
          if (currentIndex < exitIndex) goto(currentIndex + 1, 1);
          else leaveSection(1);
        },
        onDown: () => {
          if (isAnimating || isCarouselActive) return;
          if (currentIndex > 0) goto(currentIndex - 1, -1);
          else leaveSection(-1);
        },
      });
      observer.disable();

      // Blocks native scrolling while the slider owns the gesture.
      const blockNativeScroll = (e: Event) => {
        if (isLocked) e.preventDefault();
      };
      window.addEventListener("wheel", blockNativeScroll, { passive: false });
      window.addEventListener("touchmove", blockNativeScroll, { passive: false });

      // ---------- pin / lock ----------
      // On phones, preventDefault on touchmove can't stop momentum that is already running, so a hard flick would
      // carry the page straight through the pinned section. The class below (see index.css) sets overflow:hidden on
      // touch devices, which kills that momentum immediately.
      const lock = (scrollTo: number) => {
        isLocked = true;
        isCarouselActive = false;
        root.classList.add("scroll-locked");
        window.scrollTo(0, scrollTo);
        observer.enable();
      };

      const unlock = () => {
        isLocked = false;
        root.classList.remove("scroll-locked");
        observer.disable();
      };

      const leaveSection = (dir: 1 | -1) => {
        unlock();
        window.scrollTo({ top: dir > 0 ? st.end + 20 : st.start - 20, behavior: "auto" });
      };

      const openers = parts.map((_, i) => () => openCarousel(i));
      parts.forEach((p, i) => p.card.addEventListener("click", openers[i]));

      const st = ScrollTrigger.create({
        trigger: work,
        start: "top top",
        end: `+=${PIN_DISTANCE}`,
        pin: true,
        anticipatePin: 1,
        onEnter: () => {
          currentIndex = 0;
          sync(0);
          lock(st.start + 1);
        },
        onEnterBack: () => {
          currentIndex = exitIndex;
          sync(exitIndex);
          lock(st.end - 1);
          goto(exitIndex - 1, -1);
        },
        onLeave: unlock,
        onLeaveBack: unlock,
      });
      sync(0);

      // Created after the pin so their "bottom bottom" end already includes the pin spacing.
      ScrollTrigger.create({
        trigger: root,
        start: "top top",
        end: "bottom bottom",
        animation: gsap.to(root, { "--grid-parallax-y": "-40vh", ease: "none" }),
        scrub: 1.5,
      });
      ScrollTrigger.create({
        trigger: root,
        start: 0,
        end: "max",
        onUpdate: (self) => {
          if (!isLocked) applyRGB(self.getVelocity() * 6);
        },
      });

      return () => {
        clearTimeout(rgbTimeout);
        window.removeEventListener("wheel", blockNativeScroll);
        window.removeEventListener("touchmove", blockNativeScroll);
        parts.forEach((p, i) => p.card.removeEventListener("click", openers[i]));
        observer.kill();
        root.classList.remove("scroll-locked");
      };
    },
    { scope, dependencies: [enabled, projectCount], revertOnUpdate: true },
  );
}
