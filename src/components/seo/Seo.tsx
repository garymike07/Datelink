import { useEffect } from "react";

const DEFAULT_TWITTER_CARD = "summary_large_image";

type SeoProps = {
  title: string;
  description: string;
  canonical?: string;
  keywords?: string[];
  author?: string;
  ogImage?: string;
  ogType?: string;
  twitterCard?: string;
  twitterSite?: string;
  noIndex?: boolean;
  jsonLd?: Record<string, unknown> | Array<Record<string, unknown>>;
};

const setMetaTag = ({
  selector,
  attr,
  content,
}: {
  selector: string;
  attr: "name" | "property";
  content: string;
}) => {
  if (!content) return;
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${selector}"]`);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attr, selector);
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
};

const setLinkTag = ({ rel, href }: { rel: string; href: string }) => {
  if (!href) return;
  let element = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!element) {
    element = document.createElement("link");
    element.setAttribute("rel", rel);
    document.head.appendChild(element);
  }
  element.setAttribute("href", href);
};

const setJsonLd = (jsonLd?: SeoProps["jsonLd"]) => {
  const id = "seo-jsonld";
  const existing = document.head.querySelector<HTMLScriptElement>(`script#${id}`);
  if (!jsonLd) {
    if (existing) existing.remove();
    return;
  }
  const script = existing ?? document.createElement("script");
  script.id = id;
  script.type = "application/ld+json";
  script.textContent = JSON.stringify(jsonLd, null, 2);
  if (!existing) document.head.appendChild(script);
};

const Seo = ({
  title,
  description,
  canonical,
  keywords = [],
  author,
  ogImage,
  ogType = "website",
  twitterCard = DEFAULT_TWITTER_CARD,
  twitterSite,
  noIndex = false,
  jsonLd,
}: SeoProps) => {
  useEffect(() => {
    document.title = title;

    setMetaTag({ selector: "description", attr: "name", content: description });
    setMetaTag({ selector: "keywords", attr: "name", content: keywords.filter(Boolean).join(", ") });
    if (author) {
      setMetaTag({ selector: "author", attr: "name", content: author });
    }

    setMetaTag({ selector: "og:title", attr: "property", content: title });
    setMetaTag({ selector: "og:description", attr: "property", content: description });
    setMetaTag({ selector: "og:type", attr: "property", content: ogType });
    if (ogImage) {
      setMetaTag({ selector: "og:image", attr: "property", content: ogImage });
    }
    if (canonical) {
      setMetaTag({ selector: "og:url", attr: "property", content: canonical });
    }

    setMetaTag({ selector: "twitter:card", attr: "name", content: twitterCard });
    if (twitterSite) {
      setMetaTag({ selector: "twitter:site", attr: "name", content: twitterSite });
    }
    setMetaTag({ selector: "twitter:title", attr: "name", content: title });
    setMetaTag({ selector: "twitter:description", attr: "name", content: description });
    if (ogImage) {
      setMetaTag({ selector: "twitter:image", attr: "name", content: ogImage });
    }

    if (canonical) {
      setLinkTag({ rel: "canonical", href: canonical });
    }

    if (noIndex) {
      setMetaTag({ selector: "robots", attr: "name", content: "noindex, nofollow" });
    } else {
      setMetaTag({ selector: "robots", attr: "name", content: "index, follow" });
    }

    setJsonLd(jsonLd);
  }, [
    title,
    description,
    canonical,
    keywords,
    author,
    ogImage,
    ogType,
    twitterCard,
    twitterSite,
    noIndex,
    jsonLd,
  ]);

  return null;
};

export default Seo;
