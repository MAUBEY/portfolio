import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { EMPTY_SITE_DATA, IMG_W, fetchSiteData, imgUrl, type SiteData, type SiteSettings } from "./sanity";
import { ProjectCard } from "./ProjectCard";
import { EmailLink, cleanEmail } from "./EmailLink";
import { useScrollEffects } from "./useScrollEffects";

gsap.registerPlugin(useGSAP);

const COUNTER = Array.from({ length: 101 }, (_, i) => String(i).padStart(3, "0"));
const DEFAULT_INTRO =
  "My practice moves between strategy, identity, interaction and art direction. I like small teams, ambitious ideas, and work that earns a place in culture.";
const PRELOAD_TIMEOUT_MS = 6000; // never hold the splash screen longer than this on a slow connection

function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d={diagonal ? "M6 18 18 6M8 6h10v10" : "M5 12h14M14 7l5 5-5 5"} />
    </svg>
  );
}

const preload = (urls: string[]) =>
  Promise.all(
    urls.map(
      (url) =>
        new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = img.onerror = () => resolve();
          img.src = url;
        }),
    ),
  );

function applySiteSettings(s: SiteSettings) {
  const root = document.documentElement;
  if (s.seoTitle) document.title = s.seoTitle;
  if (s.bgColor) root.style.setProperty("--paper", s.bgColor);
  if (s.textColor) root.style.setProperty("--ink", s.textColor);
  if (s.accentColor) root.style.setProperty("--accent-global", s.accentColor);

  const fontStack = (font?: string) =>
    !font ? undefined : font === "Futura / Jost" ? "Futura, Jost, sans-serif" : `"${font}", sans-serif`;
  const title = fontStack(s.titleFont);
  const body = fontStack(s.bodyFont);
  if (title) root.style.setProperty("--font-title", title);
  if (body) root.style.setProperty("--font-body", body);
}

export default function App() {
  const mainRef = useRef<HTMLElement>(null);
  const workRef = useRef<HTMLElement>(null);
  const counterColRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const splashTlRef = useRef<gsap.core.Timeline | null>(null);
  const isReadyRef = useRef(false);

  const [data, setData] = useState<SiteData>(EMPTY_SITE_DATA);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    window.history.scrollRestoration = "manual";
    window.scrollTo(0, 0);
  }, []);

  // Load content, then wait for the first-screen images and fonts (capped by a timeout) before the splash lifts.
  useEffect(() => {
    let cancelled = false;
    const finish = () => {
      if (!cancelled) setIsReady(true);
    };

    fetchSiteData()
      .then(async (d) => {
        if (cancelled) return;
        setData(d);
        const urls = [
          d.hero?.heroImage && imgUrl(d.hero.heroImage, IMG_W.hero),
          ...d.projects.map((p) => p.objectImage && imgUrl(p.objectImage, IMG_W.object)),
        ].filter((u): u is string => Boolean(u));

        await Promise.race([
          Promise.all([preload(urls), document.fonts?.ready]),
          new Promise((resolve) => setTimeout(resolve, PRELOAD_TIMEOUT_MS)),
        ]);
        finish();
      })
      .catch(finish);

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    isReadyRef.current = isReady;
    if (isReady && splashTlRef.current?.paused()) splashTlRef.current.play();
  }, [isReady]);

  useEffect(() => {
    if (data.site) applySiteSettings(data.site);
  }, [data.site]);

  // Splash: counts up, pauses at 100 until content is ready, then wipes away.
  useGSAP(
    () => {
      const bar = progressBarRef.current;
      const tl = gsap.timeline({ paused: true });
      splashTlRef.current = tl;
      tl.to(counterColRef.current, { yPercent: -(100 * (100 / 101)), duration: 3.5, ease: "power3.inOut" }, "loading")
        .to(bar, { scaleX: 1, duration: 3.5, ease: "power3.inOut" }, "loading")
        .call(() => {
          if (!isReadyRef.current) tl.pause();
        })
        .to(".splash-center", { y: -30, opacity: 0, duration: 0.5, ease: "power3.in" }, "+=0.3")
        .to(".splash", { y: () => -(window.innerHeight - 84), duration: 1.4, ease: "power3.inOut" }, "wipe")
        .to(bar, { boxShadow: "0px 20px 10px 2px rgba(0, 200, 255, 1), 0px 50px 20px 5px rgba(255, 220, 0, 0.9), 0px 80px 30px 8px rgba(255, 50, 0, 0.8)", duration: 0.7, ease: "power2.out" }, "wipe")
        .to(bar, { boxShadow: "0px 0px 0px 0px rgba(0, 200, 255, 0), 0px 0px 0px 0px rgba(255, 220, 0, 0), 0px 0px 0px 0px rgba(255, 50, 0, 0)", duration: 0.7, ease: "power2.in" }, "wipe+=0.7")
        .to(".splash", { autoAlpha: 0, duration: 0.2 }, "wipe+=1.3");
      tl.play();
    },
    { scope: mainRef },
  );

  useScrollEffects(mainRef, workRef, isReady, data.projects.length);

  const { projects, experience, services, hero, contact, site } = data;
  const initials = site?.logoInitials || "AR";
  const email = cleanEmail(contact?.email) || "hello@example.com";
  const resumeEn = site?.resumeUrl;
  const resumeFr = site?.resumeUrlFr;

  return (
    <main ref={mainRef}>
      <div className="page-grid" aria-hidden="true" />

      <div className="splash" aria-hidden="true">
        <div className="splash-center">
          <div className="counter-wrap rgb-loader">
            <div className="counter-column" ref={counterColRef}>
              {COUNTER.map((n) => (
                <div className="counter-num" key={n}>
                  {n}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="splash-progress" ref={progressBarRef} />
      </div>

      <nav className="nav" aria-label="Primary navigation">
        <a className="logo" href="#top" aria-label="Home">
          {initials[0]}
          <span>{initials[1] || "R"}</span>
        </a>
        <div className="nav-links">
          <a href="#work">{site?.navTab1 || "Work"}</a>
          <a href="#services">{site?.navTab4 || "Services"}</a>
          <a href="#about">{site?.navTab2 || "About"}</a>
          <a href="#contact">{site?.navTab3 || "Contact"}</a>
        </div>
        <EmailLink className="availability" email={email}>
          <span className="availability-dot" /> Available for projects
        </EmailLink>
      </nav>

      <header className="hero" id="top">
        {hero?.heroImage && <img className="hero-decoration" src={imgUrl(hero.heroImage, IMG_W.hero)} alt="" aria-hidden="true" decoding="async" />}
        <div className="eyebrow">{hero?.eyebrow || "Independent designer"}</div>
        <h1 className="rgb-title">
          <span className="hero-first rgb-title">{hero?.firstName || "Avery"}</span>
          <span className="hero-last rgb-title">{hero?.lastName || "Rowan"}</span>
        </h1>
        <div className="hero-bottom">
          <p>{hero?.paragraph || "I shape bold identities."}</p>
          <span className="scroll-hint" aria-hidden="true">
            Scroll to wander <span>↓</span>
          </span>
        </div>
      </header>

      <section className="work" id="work" ref={workRef}>
        <div className="section-intro">
          <span>({String(projects.length).padStart(2, "0")})</span>
          <h2 className="rgb-title">Selected work</h2>
          <p>
            Hover over an object
            <br />
            to open the story.
          </p>
        </div>
        <div className="project-list">
          {projects.map((project) => (
            <ProjectCard key={project._id} project={project} />
          ))}
        </div>
      </section>

      {services.length > 0 && (
        <section className="services" id="services">
          <div className="section-intro">
            <h2 className="rgb-title">What I do.</h2>
            <p>
              Designing digital experiences
              <br />
              with clarity and intention.
            </p>
          </div>
          <div className="services-grid">
            {services.map((srv, i) => (
              <div className="service-column" key={srv._id}>
                <div className="service-col-top">
                  <span className="service-num">0{i + 1}</span>
                  <h3 className="service-title">{srv.title}</h3>
                  <p className="service-desc">{srv.description}</p>
                  <div className="service-skills">
                    {srv.skills?.map((skill) => (
                      <span key={skill} className="skill-pill">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
                {srv.image && (
                  <div className="service-image-wrap">
                    <img src={imgUrl(srv.image, IMG_W.service)} alt="" loading="lazy" decoding="async" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="resume" id="about">
        <div className="resume-heading">
          <span>What I’ve been up to</span>
          <h2 className="rgb-title">
            Experience<span>.</span>
          </h2>
        </div>
        <div className="experience-list">
          {experience.map((exp, i) => (
            <div className="experience-row" key={exp._id}>
              <div className="experience-main">
                <span>0{i + 1}</span>
                <h3>{exp.company}</h3>
                <p>{exp.role}</p>
                <time>{exp.period}</time>
              </div>
              <div className="experience-desc">
                <div className="experience-desc-inner">
                  <p>{exp.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="resume-foot">
          <p>{contact?.introSentence || DEFAULT_INTRO}</p>
          {(resumeEn || resumeFr) && (
            <div className="resume-downloads">
              <span className="resume-downloads-label">Download résumé</span>
              <div className="resume-downloads-links">
                {resumeEn && (
                  <a href={resumeEn} target="_blank" rel="noreferrer" lang="en">
                    English <Arrow diagonal />
                  </a>
                )}
                {resumeFr && (
                  <a href={resumeFr} target="_blank" rel="noreferrer" lang="fr">
                    Français <Arrow diagonal />
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="contact" id="contact">
        <div className="portrait-wrap">
          {contact?.image && <img src={imgUrl(contact.image, IMG_W.portrait)} alt="Portrait" loading="lazy" decoding="async" />}
        </div>
        <div className="contact-copy">
          <span className="contact-kicker">{contact?.kicker || "Have a project in mind?"}</span>
          <h2 className="rgb-title">
            {contact?.heading1 || "Let’s make"}
            <br />
            <em>{contact?.heading2 || "something good."}</em>
          </h2>
          <EmailLink className="email-link" email={email}>
            {email} <Arrow diagonal />
          </EmailLink>
          <div className="socials">
            {contact?.socials?.map((s) => (
              <a key={s._key} href={s.url} target="_blank" rel="noreferrer">
                {s.platform} ↗
              </a>
            ))}
          </div>
        </div>
      </section>

      <footer>
        <span>{site?.footerLeft || `© ${new Date().getFullYear()} Avery Rowan`}</span>
        <span>{site?.footerCenter || "Built with curiosity"}</span>
        <a href="#top">Back to top ↑</a>
      </footer>
    </main>
  );
}
