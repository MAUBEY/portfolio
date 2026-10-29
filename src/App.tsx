import { useRef, useState, useEffect, type CSSProperties, type MouseEvent } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Observer } from "gsap/Observer";
import { useGSAP } from "@gsap/react";
import { createClient } from "@sanity/client";
import imageUrlBuilder from "@sanity/image-url";

gsap.registerPlugin(ScrollTrigger, Observer);

const sanityClient = createClient({
  projectId: "e10919tm", 
  dataset: "production",
  useCdn: true,
  apiVersion: "2024-01-01", 
});

const builder = imageUrlBuilder(sanityClient);
function urlFor(source: any) {
  return builder.image(source);
}

// Pruned unused fields from Project interface
type Project = { _id: string; number: string; title: string; category: string; year: string; objectImage?: any; hoverMatteImage?: any; accent: string; carouselItems?: any[]; };
type Experience = { _id: string; company: string; role: string; period: string; desc: string; };
type Service = { _id: string; title: string; description: string; skills: string[]; image?: any; };
type SiteSettings = { seoTitle?: string; logoInitials?: string; navTab1?: string; navTab4?: string; navTab2?: string; navTab3?: string; footerLeft?: string; footerCenter?: string; bgColor?: string; textColor?: string; accentColor?: string; titleFont?: string; bodyFont?: string; gridOpacity?: number; resumeUrl?: string; };

function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d={diagonal ? "M6 18 18 6M8 6h10v10" : "M5 12h14M14 7l5 5-5 5"} />
    </svg>
  );
}

function ProjectObject({ project }: { project: Project }) {
  const objectRef = useRef<HTMLDivElement>(null);
  
  const moveObject = (event: MouseEvent<HTMLElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    objectRef.current?.style.setProperty("--rx", `${-y * 28}deg`);
    objectRef.current?.style.setProperty("--ry", `${x * 34}deg`);
  };
  
  const resetObject = () => {
    objectRef.current?.style.setProperty("--rx", "-8deg");
    objectRef.current?.style.setProperty("--ry", "12deg");
  };

  const carouselContent = project.carouselItems && project.carouselItems.length > 0 ? project.carouselItems : [
    { _type: 'carouselImage', aspect: 'Landscape (16:9)' },
    { _type: 'carouselText', heading: 'Project Strategy', body: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur vel egestas sapien. Suspendisse potenti.' },
    { _type: 'carouselImage', aspect: 'Portrait (9:16)' },
    { _type: 'carouselText', heading: 'Technical Execution', body: 'Aenean ac lectus eu nulla tincidunt sodales. Nullam ac turpis ac massa interdum ullamcorper.' },
    { _type: 'carouselVideo' }
  ];

  return (
    <article 
      className="project-card" 
      style={{ 
        "--accent": project.accent || "var(--accent-global)",
        "--thumb-url": project.hoverMatteImage ? `url(${urlFor(project.hoverMatteImage).url()})` : "none"
      } as CSSProperties} 
      onMouseMove={moveObject} 
      onMouseLeave={resetObject} 
      tabIndex={0} 
      aria-label={`${project.title}, ${project.category}, ${project.year}`}
    >
      <div className="project-meta"><span>{project.number}</span><span>{project.category}</span><span>{project.year}</span></div>
      
      <div className="project-stage">
        <div className="project-carousel">
          <div className="carousel-track">
            {carouselContent.map((item, i) => {
              if (item._type === 'carouselImage') {
                 const isPortrait = item.aspect === 'Portrait (9:16)';
                 return (
                   <div className="carousel-item" key={i}>
                     {item.image ? (
                       <img className={isPortrait ? 'c-img-portrait' : 'c-img-landscape'} src={urlFor(item.image).url()} alt=""/>
                     ) : (
                       <div className={isPortrait ? 'c-img-portrait' : 'c-img-landscape'} />
                     )}
                   </div>
                 );
              }
              if (item._type === 'carouselText') {
                 return (
                   <div className="carousel-item c-text" key={i}>
                     <h4>{item.heading || 'Details'}</h4>
                     <p>{item.body || 'Lorem ipsum dolor sit amet.'}</p>
                   </div>
                 );
              }
              if (item._type === 'carouselVideo') {
                 return (
                   <div className="carousel-item" key={i}>
                     <div className="c-img-landscape" style={{ display: 'grid', placeItems: 'center', background: '#111' }}>
                        <span style={{ fontSize: '30px', color: '#fff' }}>▶</span>
                     </div>
                   </div>
                 );
              }
              return null;
            })}
          </div>
        </div>

        <div className="project-title-mover">
          <div className="project-title rgb-title" aria-hidden="true">{project.title}</div>
        </div>
        
        <div className="project-object-mover">
          <div className="project-object-wrap" ref={objectRef}>
            <div className="object" style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              {project.objectImage ? <img src={urlFor(project.objectImage).width(1000).height(1000).url()} alt={`${project.title} Thumbnail`} style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(20px 25px 25px rgba(0,0,0,0.5))' }} /> : <div style={{ width: '70%', height: '70%', borderRadius: '50%', background: '#333330', boxShadow: 'inset 10px 10px 20px rgba(255,255,255,0.05)' }} />}
            </div>
          </div>
        </div>
      </div>
      <div className="project-hint">Move to explore</div>
    </article>
  );
}

export default function App() {
  const mainRef = useRef<HTMLElement>(null);
  const workSectionRef = useRef<HTMLElement>(null);
  const counterColRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [experience, setExperience] = useState<Experience[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [heroSet, setHeroSet] = useState<any>(null);
  const [contactSet, setContactSet] = useState<any>(null);
  const [siteSet, setSiteSet] = useState<SiteSettings | null>(null);
  const [isAppReady, setIsAppReady] = useState(false);
  const isAppReadyRef = useRef(false);
  const splashTlRef = useRef<gsap.core.Timeline | null>(null);

  const counterArray = Array.from({ length: 101 }, (_, i) => String(i).padStart(3, "0"));

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.history.scrollRestoration = "manual";
      window.scrollTo(0, 0);
    }
  }, []);

  useEffect(() => {
    const fetchAndPreloadData = async () => {
      try {
        const projData = await sanityClient.fetch('*[_type == "project"] | order(number asc)');
        const expData = await sanityClient.fetch('*[_type == "experience"]');
        const srvData = await sanityClient.fetch('*[_type == "service"] | order(order asc)');
        const heroData = await sanityClient.fetch('*[_type == "heroSection"][0]');
        const contactData = await sanityClient.fetch('*[_type == "contactSection"][0]');
        const siteData = await sanityClient.fetch('*[_type == "siteSettings"][0]{..., "resumeUrl": resumePdf.asset->url}');
        
        setProjects(projData); setExperience(expData); setServices(srvData); setHeroSet(heroData); setContactSet(contactData); setSiteSet(siteData);

        const allData = [projData, expData, srvData, heroData, contactData, siteData];
        const urlsToLoad = new Set<string>();

        // Deep Recursive Scanner: Extracts EVERY single image URL returned by Sanity, keeping your project 100% reactive
        const extractImages = (obj: any) => {
          if (!obj) return;
          if (typeof obj === 'object') {
            if (obj.asset && obj.asset._ref) {
              try { urlsToLoad.add(urlFor(obj).url()); } catch (e) {}
            } else if (obj._type === 'image' && obj.asset) {
              try { urlsToLoad.add(urlFor(obj).url()); } catch (e) {}
            }
            Object.values(obj).forEach(extractImages);
          } else if (Array.isArray(obj)) {
            obj.forEach(extractImages);
          }
        };
        extractImages(allData);

        const imagePromises = Array.from(urlsToLoad).map(url => new Promise((resolve) => { const img = new Image(); img.src = url; img.onload = resolve; img.onerror = resolve; }));
        const fontPromise = document.fonts ? document.fonts.ready : Promise.resolve();
        
        await Promise.all([...imagePromises, fontPromise]);
        
        setIsAppReady(true);
      } catch (error) { setIsAppReady(true); }
    };
    fetchAndPreloadData();
  }, []);

  useEffect(() => {
    isAppReadyRef.current = isAppReady;
    if (isAppReady && splashTlRef.current && splashTlRef.current.paused()) splashTlRef.current.play();
  }, [isAppReady]);

  useEffect(() => {
    if (siteSet) {
      const root = document.documentElement;
      if (siteSet.seoTitle) document.title = siteSet.seoTitle;
      if (siteSet.bgColor) root.style.setProperty("--paper", siteSet.bgColor);
      if (siteSet.textColor) root.style.setProperty("--ink", siteSet.textColor);
      if (siteSet.accentColor) root.style.setProperty("--accent-global", siteSet.accentColor);
      if (siteSet.gridOpacity !== undefined) root.style.setProperty("--grid-opacity", siteSet.gridOpacity.toString());
      
      const getFontStack = (fontVal: string | undefined) => {
        if (fontVal === "Futura / Jost") return 'Futura, Jost, sans-serif';
        if (fontVal === "Syncopate") return '"Syncopate", sans-serif';
        if (fontVal === "Rajdhani") return '"Rajdhani", sans-serif';
        if (fontVal === "Aldrich") return '"Aldrich", sans-serif';
        if (fontVal) return `"${fontVal}", sans-serif`;
        return undefined;
      };

      const tFont = getFontStack(siteSet.titleFont);
      const bFont = getFontStack(siteSet.bodyFont);
      
      if (tFont) root.style.setProperty("--font-title", tFont);
      if (bFont) root.style.setProperty("--font-body", bFont);
    }
  }, [siteSet]);

  useGSAP(() => {
    gsap.set(counterColRef.current, { yPercent: 0 });
    const tl = gsap.timeline({ paused: true });
    splashTlRef.current = tl;
    tl.to(counterColRef.current, { yPercent: -(100 * (100 / 101)), duration: 3.5, ease: "power3.inOut" }, "loading");
    tl.to(progressBarRef.current, { scaleX: 1, duration: 3.5, ease: "power3.inOut" }, "loading");
    tl.call(() => { if (!isAppReadyRef.current) tl.pause(); });
    tl.to(".splash-center", { y: -30, opacity: 0, duration: 0.5, ease: "power3.in" }, "+=0.3");
    tl.to(".splash", { y: () => -(window.innerHeight - 84), duration: 1.4, ease: "power3.inOut" }, "wipe");
    tl.to(progressBarRef.current, { boxShadow: "0px 20px 10px 2px rgba(0, 200, 255, 1), 0px 50px 20px 5px rgba(255, 220, 0, 0.9), 0px 80px 30px 8px rgba(255, 50, 0, 0.8)", duration: 0.7, ease: "power2.out" }, "wipe");
    tl.to(progressBarRef.current, { boxShadow: "0px 0px 0px 0px rgba(0, 200, 255, 0), 0px 0px 0px 0px rgba(255, 220, 0, 0), 0px 0px 0px 0px rgba(255, 50, 0, 0)", duration: 0.7, ease: "power2.in" }, "wipe+=0.7");
    tl.to(".splash", { autoAlpha: 0, duration: 0.2 }, "wipe+=1.3");
    tl.play();
  }, { scope: mainRef });

  useGSAP(() => {
    if (!isAppReady || projects.length === 0) return;
    
    let isWheelLocked = false; 
    const lockNativeWheel = (e: Event) => {
      if (isWheelLocked) e.preventDefault();
    };
    window.addEventListener("wheel", lockNativeWheel, { passive: false });
    window.addEventListener("touchmove", lockNativeWheel, { passive: false });

    const cards = gsap.utils.toArray(".project-card") as HTMLElement[];
    let currentIndex = 0; 
    let isAnimating = false; 
    let scrollObserver: any = null; 
    let rgbTimeout: ReturnType<typeof setTimeout>;
    let isCarouselActive = false;
    let carouselScrollX = 0;

    ScrollTrigger.create({
      trigger: document.documentElement,
      start: "top top",
      end: "bottom bottom",
      animation: gsap.to(document.documentElement, { "--grid-parallax-y": "-40vh", ease: "none" }),
      scrub: 1.5 
    });

    const applyRGB = (vel: number) => {
      const absVel = Math.abs(vel);
      const alpha = gsap.utils.clamp(0, 0.65, absVel / 15);
      const trailDist = gsap.utils.clamp(0, 25, absVel / 15);
      const leadDist = trailDist * 0.25;
      const smoothBlur = gsap.utils.clamp(0, 6, absVel / 40);
      let rY = 0, yY = 0, tY = 0, bY = 0, rB = 0, yB = 0, tB = 0, bB = 0, rDur = 0.1, yDur = 0.1, tDur = 0.1, bDur = 0.1;
      
      if (vel > 0) { rY = leadDist * 1.0; rB = 0; rDur = 0.1; yY = leadDist * 0.5; yB = 0; yDur = 0.1; tY = -trailDist * 0.5; tB = smoothBlur * 0.5; tDur = 0.3; bY = -trailDist * 1.0; bB = smoothBlur * 1.0; bDur = 0.45; } 
      else { rY = trailDist * 1.0; rB = smoothBlur * 1.0; rDur = 0.45; yY = trailDist * 0.5; yB = smoothBlur * 0.5; yDur = 0.3; tY = -leadDist * 0.5; tB = 0; tDur = 0.1; bY = -leadDist * 1.0; bB = 0; bDur = 0.1; }
      
      const root = document.documentElement;
      gsap.set(root, { "--rgb-alpha": alpha });
      gsap.to(root, { "--rgb-r-y": `${rY}px`, "--rgb-r-b": `${rB}px`, duration: rDur, ease: "power2.out", overwrite: "auto" });
      gsap.to(root, { "--rgb-y-y": `${yY}px`, "--rgb-y-b": `${yB}px`, duration: yDur, ease: "power2.out", overwrite: "auto" });
      gsap.to(root, { "--rgb-t-y": `${tY}px`, "--rgb-t-b": `${tB}px`, duration: tDur, ease: "power2.out", overwrite: "auto" });
      gsap.to(root, { "--rgb-b-y": `${bY}px`, "--rgb-b-b": `${bB}px`, duration: bDur, ease: "power2.out", overwrite: "auto" });
      
      clearTimeout(rgbTimeout);
      rgbTimeout = setTimeout(() => {
        gsap.to(root, { "--rgb-r-y": "0px", "--rgb-y-y": "0px", "--rgb-t-y": "0px", "--rgb-b-y": "0px", "--rgb-r-b": "0px", "--rgb-y-b": "0px", "--rgb-t-b": "0px", "--rgb-b-b": "0px", "--rgb-alpha": 0, duration: 0.4, ease: "power2.out", overwrite: "auto" });
      }, 50);
    };

    ScrollTrigger.create({ 
        trigger: document.documentElement, 
        start: 0, 
        end: "max", 
        onUpdate: (self) => { if (!isWheelLocked) applyRGB(self.getVelocity() * 6); }
    });

    const syncCardStates = (targetIndex: number) => {
      cards.forEach((card, index) => {
        const titleMover = card.querySelector(".project-title-mover"); 
        const objectMover = card.querySelector(".project-object-mover"); 
        const meta = card.querySelector(".project-meta");
        const hint = card.querySelector(".project-hint");
        const carousel = card.querySelector(".project-carousel");
        
        gsap.set(carousel, { opacity: 0, x: 0, pointerEvents: "none" });
        gsap.set(objectMover, { filter: "contrast(100%) blur(0px)", rotation: 0 });

        if (index === targetIndex) { 
          gsap.set(titleMover, { y: 0, scale: 1, opacity: 1 }); 
          gsap.set(objectMover, { y: 0, scale: 1, opacity: 1 }); 
          gsap.set([meta, hint], { opacity: 1, y: 0 }); 
          gsap.set(card, { pointerEvents: "auto", opacity: 1, zIndex: 10 }); 
        } else { 
          const isBefore = index < targetIndex; 
          gsap.set(titleMover, { y: isBefore ? -300 : 300, scale: 1, opacity: 0 }); 
          gsap.set(objectMover, { y: isBefore ? -800 : 800, scale: 0.4, opacity: 0 }); 
          gsap.set([meta, hint], { opacity: 0, y: isBefore ? -10 : 10 }); 
          gsap.set(card, { pointerEvents: "none", opacity: 0, zIndex: 1 }); 
        }
      });
    };
    syncCardStates(0);

    const gotoSlide = (index: number, direction: number) => {
      if (index < 0 || index > cards.length || isAnimating) return;
      isAnimating = true;
      const currentCard = cards[currentIndex]; const nextCard = cards[index]; const dur = 0.85; const easeCurve = "power3.inOut";
      
      const tl = gsap.timeline({ 
        onComplete: () => { 
          isAnimating = false; 
          if (index === cards.length && direction > 0) { 
            isWheelLocked = false; 
            if (scrollObserver) scrollObserver.disable(); 
            window.scrollTo({ top: st.end + 20, behavior: "auto" }); 
          } 
        } 
      });

      if (direction > 0) {
        if (currentCard) {
          const currentTitle = currentCard.querySelector(".project-title-mover"); 
          const currentObj = currentCard.querySelector(".project-object-mover"); 
          const currentMeta = currentCard.querySelector(".project-meta");
          
          tl.to(currentCard, { pointerEvents: "none", zIndex: 1, duration: 0 }, 0)
            .to(currentMeta, { opacity: 0, y: -10, duration: dur * 0.33 }, 0)
            .to(currentTitle, { y: -300, opacity: 0, duration: dur, ease: easeCurve }, 0)
            .to(currentObj, { y: -800, scale: 0.4, opacity: 0, duration: dur, ease: easeCurve }, 0)
            .to(currentCard, { opacity: 0, duration: 0.2 }, dur * 0.66);
        }
        if (nextCard) {
          const nextTitle = nextCard.querySelector(".project-title-mover"); 
          const nextObj = nextCard.querySelector(".project-object-mover"); 
          const nextMeta = nextCard.querySelector(".project-meta");
          
          tl.to(nextCard, { opacity: 1, zIndex: 10, pointerEvents: "auto", duration: 0.2 }, 0)
            .fromTo(nextTitle, { y: 300, opacity: 0, scale: 1 }, { y: 0, opacity: 1, scale: 1, duration: dur, ease: easeCurve }, 0)
            .fromTo(nextObj, { y: 800, scale: 0.4, opacity: 0 }, { y: 0, scale: 1, opacity: 1, filter: "contrast(100%) blur(0px)", duration: dur, ease: easeCurve }, 0)
            .fromTo(nextMeta, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: dur * 0.5 }, dur * 0.5);
        }
      } else {
        if (currentCard) {
          const currentTitle = currentCard.querySelector(".project-title-mover"); 
          const currentObj = currentCard.querySelector(".project-object-mover"); 
          const currentMeta = currentCard.querySelector(".project-meta");
          
          tl.to(currentCard, { pointerEvents: "none", zIndex: 1, duration: 0 }, 0)
            .to(currentMeta, { opacity: 0, y: 10, duration: dur * 0.33 }, 0)
            .to(currentTitle, { y: 300, opacity: 0, duration: dur, ease: easeCurve }, 0)
            .to(currentObj, { y: 800, scale: 0.4, opacity: 0, duration: dur, ease: easeCurve }, 0)
            .to(currentCard, { opacity: 0, duration: 0.2 }, dur * 0.66);
        }
        if (nextCard) {
          const nextTitle = nextCard.querySelector(".project-title-mover"); 
          const nextObj = nextCard.querySelector(".project-object-mover"); 
          const nextMeta = nextCard.querySelector(".project-meta");
          
          tl.to(nextCard, { opacity: 1, zIndex: 10, pointerEvents: "auto", duration: 0.2 }, 0)
            .fromTo(nextTitle, { y: -300, opacity: 0, scale: 1 }, { y: 0, opacity: 1, scale: 1, duration: dur, ease: easeCurve }, 0)
            .fromTo(nextObj, { y: -800, scale: 0.4, opacity: 0 }, { y: 0, scale: 1, opacity: 1, filter: "contrast(100%) blur(0px)", duration: dur, ease: easeCurve }, 0)
            .fromTo(nextMeta, { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: dur * 0.5 }, dur * 0.5);
        }
      }
      currentIndex = index;
    };

    const closeCarousel = (goNext = false) => {
      isAnimating = true;
      const card = cards[currentIndex];
      const title = card.querySelector('.project-title-mover');
      const obj = card.querySelector('.project-object-mover');
      const carousel = card.querySelector('.project-carousel');
      const meta = card.querySelector('.project-meta');
      const hint = card.querySelector('.project-hint');
      
      const tl = gsap.timeline({ 
          onComplete: () => {
              isAnimating = false;
              isCarouselActive = false;
              if (goNext && currentIndex < cards.length) {
                  gotoSlide(currentIndex + 1, 1);
              }
          } 
      });
      
      tl.to(carousel, { opacity: 0, x: -50, pointerEvents: "none", duration: 0.4, ease: "power2.in" }, 0);
      
      if (!goNext) {
          tl.to(title, { y: 0, scale: 1, duration: 0.8, ease: "power3.inOut" }, 0.2);
          tl.to(obj, { opacity: 1, scale: 1, rotation: 0, filter: "contrast(100%) blur(0px)", duration: 0.8, ease: "power3.out" }, 0.2);
          tl.to([meta, hint], { opacity: 1, duration: 0.5 }, 0.4);
      }
    };

    cards.forEach((card, index) => {
      card.addEventListener('click', () => {
          if (isAnimating || index !== currentIndex || isCarouselActive) return;
          isCarouselActive = true;
          carouselScrollX = 0;
          
          const title = card.querySelector('.project-title-mover');
          const obj = card.querySelector('.project-object-mover');
          const carousel = card.querySelector('.project-carousel');
          const track = card.querySelector('.carousel-track');
          const meta = card.querySelector('.project-meta');
          const hint = card.querySelector('.project-hint');
          
          gsap.set(track, { x: 0 });
          
          isAnimating = true;
          const tl = gsap.timeline({ onComplete: () => isAnimating = false });
          
          tl.to(title, { y: "-35vh", scale: 0.35, duration: 0.8, ease: "power3.inOut" }, 0);
          tl.to(obj, { opacity: 0, scale: 1.2, rotation: 15, filter: "contrast(200%) blur(10px)", duration: 0.4, ease: "power2.in" }, 0);
          tl.to([meta, hint], { opacity: 0, duration: 0.3 }, 0);
          tl.fromTo(carousel, { x: 100, opacity: 0 }, { x: 0, opacity: 1, pointerEvents: "auto", duration: 0.8, ease: "power3.out" }, 0.2);
      });
    });

    scrollObserver = Observer.create({
      target: window, type: "wheel,touch", preventDefault: true, tolerance: 40, 
      onChange: (self) => {
        applyRGB(self.velocityY * 3); 
        
        if (isCarouselActive && !isAnimating) {
            const track = cards[currentIndex].querySelector('.carousel-track');
            if (!track) return;
            
            const maxScroll = Math.max(0, track.scrollWidth - window.innerWidth); 
            carouselScrollX -= self.deltaY * 1.5; 
            
            if (carouselScrollX > 150) {
                closeCarousel();
            } else if (carouselScrollX < -maxScroll - 150) {
                closeCarousel(true);
            } else {
                gsap.to(track, { x: carouselScrollX, duration: 0.5, ease: "power2.out", overwrite: "auto" });
            }
        }
      },
      onUp: () => { 
        if (isAnimating || isCarouselActive) return; 
        if (currentIndex > 0) gotoSlide(currentIndex - 1, -1); else { if (scrollObserver) scrollObserver.disable(); window.scrollTo({ top: st.start - 20, behavior: "auto" }); } 
      },
      onDown: () => { 
        if (isAnimating || isCarouselActive) return; 
        if (currentIndex < cards.length) gotoSlide(currentIndex + 1, 1); else { if (scrollObserver) scrollObserver.disable(); window.scrollTo({ top: st.end + 20, behavior: "auto" }); } 
      }
    });
    scrollObserver.disable();

    const st = ScrollTrigger.create({
      trigger: workSectionRef.current,
      start: "top top",
      end: "+=1250",
      pin: true,
      onEnter: () => { currentIndex = 0; syncCardStates(0); isWheelLocked = true; if (scrollObserver) scrollObserver.enable(); },
      onEnterBack: () => { currentIndex = cards.length; syncCardStates(cards.length); isWheelLocked = true; if (scrollObserver) scrollObserver.enable(); gotoSlide(cards.length - 1, -1); },
      onLeave: () => { isWheelLocked = false; if (scrollObserver) scrollObserver.disable(); },
      onLeaveBack: () => { isWheelLocked = false; if (scrollObserver) scrollObserver.disable(); }
    });

    return () => { 
      window.removeEventListener("wheel", lockNativeWheel); 
      window.removeEventListener("touchmove", lockNativeWheel); 
    };
  }, { scope: mainRef, dependencies: [isAppReady, projects] });

  const logoInitials = siteSet?.logoInitials || "AR";
  const nav1 = siteSet?.navTab1 || "Work"; const nav4 = siteSet?.navTab4 || "Services"; const nav2 = siteSet?.navTab2 || "About"; const nav3 = siteSet?.navTab3 || "Contact";
  const footL = siteSet?.footerLeft || `© ${new Date().getFullYear()} Avery Rowan`; const footC = siteSet?.footerCenter || "Built with curiosity";
  const emailStr = contactSet?.email || "hello@example.com"; const mailtoLink = `mailto:${emailStr}`;

  return (
    <main ref={mainRef}>
      <div className="page-grid" aria-hidden="true" />
      <div className="splash" aria-hidden="true">
        <div className="splash-center"><div className="counter-wrap rgb-loader"><div className="counter-column" ref={counterColRef}>{counterArray.map((num, i) => (<div className="counter-num" key={i}>{num}</div>))}</div></div></div>
        <div className="splash-progress" ref={progressBarRef}></div>
      </div>

      <nav className="nav" aria-label="Primary navigation">
        <a className="logo" href="#top" aria-label="Home">{logoInitials[0]}<span>{logoInitials[1] || "R"}</span></a>
        <div className="nav-links"><a href="#work">{nav1}</a><a href="#services">{nav4}</a><a href="#about">{nav2}</a><a href="#contact">{nav3}</a></div>
        <a className="availability" href={mailtoLink}><span /> Available for projects</a>
      </nav>

      <header className="hero" id="top">
        {heroSet?.heroImage && (
          <img className="hero-decoration" src={urlFor(heroSet.heroImage).url()} alt="" aria-hidden="true" />
        )}
        <div className="eyebrow">{heroSet?.eyebrow || "Independent designer"}</div>
        <h1 className="rgb-title">
          <span className="hero-first rgb-title">{heroSet?.firstName || "Avery"}</span>
          <span className="hero-last rgb-title">{heroSet?.lastName || "Rowan"}</span>
        </h1>
        <div className="hero-bottom">
          <p>{heroSet?.paragraph || "I shape bold identities."}</p>
          <span className="scroll-hint" aria-hidden="true">Scroll to wander <span>↓</span></span>
        </div>
      </header>

      <section className="work" id="work" ref={workSectionRef}>
        <div className="section-intro">
          <span>({projects.length.toString().padStart(2, "0")})</span>
          <h2 className="rgb-title">Selected work</h2>
          <p>Hover over an object<br />to open the story.</p>
        </div>
        <div className="project-list">
          {projects.map((project) => (<ProjectObject key={project._id} project={project}/>))}
        </div>
      </section>

      {services.length > 0 && (
        <section className="services" id="services">
          <div className="section-intro">
            <h2 className="rgb-title">What I do.</h2>
            <p>Designing digital experiences<br/>with clarity and intention.</p>
          </div>
          <div className="services-grid">
            {services.map((srv, index) => (
              <div className="service-column" key={srv._id || index}>
                <div className="service-col-top">
                  <span className="service-num">0{index + 1}</span>
                  <h3 className="service-title">{srv.title}</h3>
                  <p className="service-desc">{srv.description}</p>
                  <div className="service-skills">
                    {srv.skills?.map((skill, i) => (<span key={i} className="skill-pill">{skill}</span>))}
                  </div>
                </div>
                {srv.image && <div className="service-image-wrap"><img src={urlFor(srv.image).url()} alt="" /></div>}
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="resume" id="about">
        <div className="resume-heading">
          <span>What I’ve been up to</span>
          <h2 className="rgb-title">Experience<span>.</span></h2>
        </div>
        <div className="experience-list">
          {experience.map((exp, index) => (
            <div className="experience-row" key={exp._id || index}>
              <div className="experience-main">
                <span>0{index + 1}</span><h3>{exp.company}</h3><p>{exp.role}</p><time>{exp.period}</time>
              </div>
              <div className="experience-desc"><div className="experience-desc-inner"><p>{exp.desc}</p></div></div>
            </div>
          ))}
        </div>
        <div className="resume-foot">
          <p>My practice moves between strategy, identity, interaction and art direction. I like small teams, ambitious ideas, and work that earns a place in culture.</p>
          <a href={siteSet?.resumeUrl || "#"} target="_blank" rel="noreferrer" download>Download full résumé <Arrow diagonal/></a>
        </div>
      </section>

      <section className="contact" id="contact">
        <div className="portrait-wrap">
          {contactSet?.image && <img src={urlFor(contactSet.image).url()} alt="Portrait" />}
          <div className="portrait-sticker">{contactSet?.sticker || "Hello!"}</div>
        </div>
        <div className="contact-copy">
          <span className="contact-kicker">{contactSet?.kicker || "Have a project in mind?"}</span>
          <h2 className="rgb-title">{contactSet?.heading1 || "Let’s make"}<br /><em>{contactSet?.heading2 || "something good."}</em></h2>
          <a className="email-link" href={mailtoLink}>{emailStr} <Arrow diagonal/></a>
          <div className="socials">
            {contactSet?.socials?.map((social: any) => (<a key={social._key} href={social.url} target="_blank" rel="noreferrer">{social.platform} ↗</a>))}
          </div>
        </div>
      </section>

      <footer>
        <span>{footL}</span><span>{footC}</span><a href="#top">Back to top ↑</a>
      </footer>
    </main>
  );
}