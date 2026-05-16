import { Helmet } from "react-helmet-async";

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: "website" | "article" | "profile";
  schemaType?: "WebPage" | "Article" | "CollectionPage" | "Course" | "FAQPage" | "Product";
  schemaData?: object;
  noindex?: boolean;
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
}

const siteName = "Bora na Tech?";
const siteUrl = "https://boranatech.com.br";
const defaultTitle = "Bora na Tech? — Sua bússola para começar na tecnologia";
const defaultDescription =
  "Plataforma de carreira em TI para iniciantes. Quiz de área, roadmaps, cursos curados, ferramentas de IA e comunidade. Comece sua trajetória em tech com direção e clareza.";
const defaultImage = `${siteUrl}/opengraph.png`;
const locale = "pt_BR";
const twitter = "@boranatech";

function absoluteUrl(value?: string) {
  if (!value) return siteUrl;
  if (value.startsWith("http")) return value;
  return `${siteUrl}${value.startsWith("/") ? value : `/${value}`}`;
}

function pageUrl(url?: string) {
  if (url) return absoluteUrl(url);
  if (typeof window === "undefined") return siteUrl;
  return absoluteUrl(`${window.location.pathname}${window.location.search}`);
}

function formatTitle(title?: string) {
  if (!title) return defaultTitle;
  return title.includes(siteName) ? title : `${title} | ${siteName}`;
}

export default function SEO({
  title,
  description = defaultDescription,
  keywords = [],
  image = defaultImage,
  url,
  type = "website",
  schemaType = "WebPage",
  schemaData,
  noindex = false,
  publishedTime,
  modifiedTime,
  author = siteName,
}: SEOProps) {
  const fullTitle = formatTitle(title);
  const canonicalUrl = pageUrl(url);
  const imageUrl = absoluteUrl(image);
  const robots = noindex ? "noindex, nofollow" : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";
  const schema = {
    "@context": "https://schema.org",
    "@type": schemaType,
    name: fullTitle,
    headline: fullTitle,
    description,
    url: canonicalUrl,
    image: imageUrl,
    inLanguage: "pt-BR",
    isPartOf: {
      "@type": "WebSite",
      name: siteName,
      url: siteUrl,
    },
    author: {
      "@type": "Organization",
      name: author,
      url: siteUrl,
    },
    publisher: {
      "@type": "Organization",
      name: siteName,
      logo: {
        "@type": "ImageObject",
        url: defaultImage,
      },
    },
    ...(publishedTime ? { datePublished: publishedTime } : {}),
    ...(modifiedTime ? { dateModified: modifiedTime } : {}),
    ...schemaData,
  };

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords.length > 0 ? <meta name="keywords" content={keywords.join(", ")} /> : null}
      <meta name="author" content={author} />
      <meta name="robots" content={robots} />
      <link rel="canonical" href={canonicalUrl} />

      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={fullTitle} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content={locale} />
      {publishedTime ? <meta property="article:published_time" content={publishedTime} /> : null}
      {modifiedTime ? <meta property="article:modified_time" content={modifiedTime} /> : null}

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content={twitter} />
      <meta name="twitter:creator" content={twitter} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />
      <meta name="twitter:image:alt" content={fullTitle} />

      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
}
