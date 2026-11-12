import { useRef, type CSSProperties, type MouseEvent } from "react";
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
    return (
      <div className="carousel-item c-text">
        <h4>{item.heading || "Details"}</h4>
        <p>{item.body || "Lorem ipsum dolor sit amet."}</p>
      </div>
    );
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
      style={
        {
          "--accent": project.accent || "var(--accent-global)",
          "--thumb-url": project.hoverMatteImage ? `url(${imgUrl(project.hoverMatteImage, IMG_W.matte)})` : "none",
        } as CSSProperties
      }
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
