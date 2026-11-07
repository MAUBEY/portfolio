import { createClient } from "@sanity/client";
import imageUrlBuilder from "@sanity/image-url";

const client = createClient({
  projectId: "e10919tm",
  dataset: "production",
  useCdn: true,
  apiVersion: "2024-01-01",
});

const builder = imageUrlBuilder(client);

// Sanity image fields are loosely typed on purpose (they come straight from GROQ).
export type SanityImage = any;

/** Widths used across the site. Preloading and rendering share these so the browser reuses the cached file. */
export const IMG_W = { hero: 800, object: 1000, matte: 1600, carousel: 1600, service: 1000, portrait: 1200 };

/** Resized, never upscaled, and served as WebP/AVIF where supported. */
export const imgUrl = (source: SanityImage, width: number) =>
  builder.image(source).width(width).fit("max").auto("format").url();

export type CarouselItem =
  | { _type: "carouselImage"; _key?: string; image?: SanityImage; aspect?: string }
  | { _type: "carouselText"; _key?: string; heading?: string; body?: string }
  | { _type: "carouselVideo"; _key?: string };

export type Project = {
  _id: string;
  number: string;
  title: string;
  category: string;
  year: string;
  accent?: string;
  objectImage?: SanityImage;
  hoverMatteImage?: SanityImage;
  carouselItems?: CarouselItem[];
};

export type Experience = { _id: string; company: string; role: string; period: string; desc: string };
export type Service = { _id: string; title: string; description: string; skills?: string[]; image?: SanityImage };

export type HeroSection = {
  heroImage?: SanityImage;
  eyebrow?: string;
  firstName?: string;
  lastName?: string;
  paragraph?: string;
};

export type ContactSection = {
  email?: string;
  image?: SanityImage;
  sticker?: string;
  kicker?: string;
  heading1?: string;
  heading2?: string;
  socials?: { _key: string; platform: string; url: string }[];
};

export type SiteSettings = {
  seoTitle?: string;
  logoInitials?: string;
  navTab1?: string;
  navTab2?: string;
  navTab3?: string;
  navTab4?: string;
  footerLeft?: string;
  footerCenter?: string;
  bgColor?: string;
  textColor?: string;
  accentColor?: string;
  titleFont?: string;
  bodyFont?: string;
  resumeUrl?: string;
};

export type SiteData = {
  projects: Project[];
  experience: Experience[];
  services: Service[];
  hero: HeroSection | null;
  contact: ContactSection | null;
  site: SiteSettings | null;
};

export const EMPTY_SITE_DATA: SiteData = {
  projects: [],
  experience: [],
  services: [],
  hero: null,
  contact: null,
  site: null,
};

export async function fetchSiteData(): Promise<SiteData> {
  const [projects, experience, services, hero, contact, site] = await Promise.all([
    client.fetch<Project[]>('*[_type == "project"] | order(number asc)'),
    client.fetch<Experience[]>('*[_type == "experience"]'),
    client.fetch<Service[]>('*[_type == "service"] | order(order asc)'),
    client.fetch<HeroSection | null>('*[_type == "heroSection"][0]'),
    client.fetch<ContactSection | null>('*[_type == "contactSection"][0]'),
    client.fetch<SiteSettings | null>('*[_type == "siteSettings"][0]{..., "resumeUrl": resumePdf.asset->url}'),
  ]);
  return { projects, experience, services, hero, contact, site };
}
