import { useLayoutEffect, useRef, type MouseEvent } from "react";
import { IMG_W, imgUrl, type CarouselItem, type Project } from "./sanity";
import { VideoSlide } from "./VideoSlide";

// Shown when a project has no carousel content in Sanity yet.
const FALLBACK_CAROUSEL: CarouselItem[] = [
  { _type: "carouselImage", aspect: "Landscape (16:9)" },
  { _type: "carouselText", heading: "Project Strategy", body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur vel egestas sapien. Suspendisse potenti." },
  { _type: "carouselImage", aspect: "Portrait (9:16)" },
  { _type: "carouselText", heading: "Technical Execution", body: "Aenean ac lectus eu nulla tincidunt sodales. Nullam ac turpis ac massa interdum ullamcorper." },
  { _type: "carouselVideo" },
];

const MIN_TEXT_PX = 11;

/**
 * Text slide. The panel is exactly as tall as the media beside it, so if the copy is longer than the space allows
 * (small screen, long text) the type shrinks in half-pixel steps until it fits, instead of being cut off.
 */
function TextSlide({ heading, body }: { heading?: string; body?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    const para = el?.querySelector("p");
    if (!el || !para) return;

    const overflows = () => {
      const cs = getComputedStyle(el);
      const limit = el.getBoundingClientRect().bottom - parseFloat(cs.borderBottomWidth) - parseFloat(cs.paddingBottom);
      return para.getBoundingClientRect().bottom > limit + 0.5;
    };

    const fit = () => {
      el.style.fontSize = "";
      let size = parseFloat(getComputedStyle(el).fontSize);
      while (overflows() && size > MIN_TEXT_PX) {
        size -= 0.5;
        el.style.fontSize = `${size}px`;
      }
    };

    fit();
    const ro = new ResizeObserver(fit); // window resized / device rotated
    ro.observe(el);
    document.fonts?.ready.then(fit); // web fonts change text metrics once loaded
    return () => ro.disconnect();
  }, [heading, body]);

  return (
    <div className="carousel-item c-text" ref={ref}>
      <h4>{heading || "Details"}</h4>
      <p>{body || "Lorem ipsum dolor sit amet."}</p>
    </div>
  );
}

function CarouselSlide({ item }: { item: CarouselItem }) {
  if (item._type === "carouselImage") {
    const cls = item.aspect === "Portrait (9:16)" ? "c-img-portrait" : "c-img-landscape";
    return (
      <div className="carousel-item">
        {item.image ? (
          <img className={cls} src={imgUrl(item.image, IMG_W.carousel)} alt="" loading="lazy" decoding="async" />
        ) : (
          <div className={cls} />
        )}
      </div>
    );
  }

  if (item._type === "carouselText") {
    return <TextSlide heading={item.heading} body={item.body} />;
  }

  if (item._type === "carouselVideo") {
    return <VideoSlide url={item.videoUrl ?? item.url} />;
  }

  return null;
}

export function ProjectCard({ project }: { project: Project }) {
  const objectRef = useRef<HTMLDivElement>(null);

  const tilt = (e: MouseEvent<HTMLElement>) => {
    const b = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - b.left) / b.width - 0.5;
    const y = (e.clientY - b.top) / b.height - 0.5;
    objectRef.current?.style.setProperty("--rx", `${-y * 28}deg`);
    objectRef.current?.style.setProperty("--ry", `${x * 34}deg`);
  };

  const resetTilt = () => {
    objectRef.current?.style.setProperty("--rx", "-8deg");
    objectRef.current?.style.setProperty("--ry", "12deg");
  };

  const slides = project.carouselItems?.length ? project.carouselItems : FALLBACK_CAROUSEL;

  return (
    <article
      className="project-card"
      onMouseMove={tilt}
      onMouseLeave={resetTilt}
      tabIndex={0}
      aria-label={`${project.title}, ${project.category}, ${project.year}`}
    >
      <div className="project-meta">
        <span>{project.number}</span>
        <span>{project.category}</span>
        <span>{project.year}</span>
      </div>

      <div className="project-stage">
        <div className="project-carousel">
          <div className="carousel-track">
            {slides.map((item, i) => (
              <CarouselSlide key={item._key ?? i} item={item} />
            ))}
          </div>
        </div>

        <div className="project-title-mover">
          <div className="project-title rgb-title" aria-hidden="true">
            {project.title}
          </div>
        </div>

        <div className="project-object-mover">
          <div className="project-object-wrap" ref={objectRef}>
            <div className="object">
              {project.objectImage ? (
                <img src={imgUrl(project.objectImage, IMG_W.object)} alt={`${project.title} Thumbnail`} decoding="async" />
              ) : (
                <div className="object-fallback" />
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="project-hint">
        <span className="hint-pointer">Move to explore</span>
        <span className="hint-touch">Tap to explore</span>
      </div>
    </article>
  );
}
