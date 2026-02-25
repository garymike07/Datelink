import Navbar from "@/components/landing/Navbar";
import HeroSimple from "@/components/landing/HeroSimple";
import HowItWorks from "@/components/landing/HowItWorks";
import Features from "@/components/landing/Features";
import CTA from "@/components/landing/CTA";
import Footer from "@/components/landing/Footer";
import Seo from "@/components/seo/Seo";

const Index = () => {
  const title = "DateLink | Kenya's Affordable Dating Platform";
  const description =
    "Connect with singles in Nairobi and across Kenya. Serious relationships, verified profiles, and M-Pesa payments from KES 100/week.";
  const canonical = "https://datelink.com/";
  const ogImage = "https://lovable.dev/opengraph-image-p98pqg.png";
  const keywords = [
    "Kenya dating",
    "Nairobi singles",
    "affordable dating Kenya",
    "verified profiles",
    "M-Pesa dating",
    "serious relationships",
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "DateLink",
    url: canonical,
    description,
    sameAs: [],
  };

  return (
    <main className="min-h-screen overflow-hidden bg-background">
      <Seo
        title={title}
        description={description}
        canonical={canonical}
        keywords={keywords}
        author="DateLink"
        ogImage={ogImage}
        twitterSite="@DateLink"
        jsonLd={jsonLd}
      />
      <Navbar />
      <HeroSimple />
      <Features />
      <HowItWorks />
      <CTA />
      <Footer />
    </main>
  );
};

export default Index;
