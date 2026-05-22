import HeroSection from "../components/landing/hero-section";
import OrganizationCards from "../components/landing/organization-cards";
import ComparisonSection from "../components/landing/comparison-section";
import StatsSection from "../components/landing/stats-section";
import FeaturesOverview from "../components/landing/features-overview";
import TestimonialsSection from "../components/landing/testimonials-section";
import CTASection from "../components/landing/cta-section";
import Footer from "../components/landing/footer";
import Header from "../components/layout/header";

export default function Home() {
  return (
    <>
      <Header />
      <HeroSection />
      <StatsSection />
      <OrganizationCards />
      <ComparisonSection />
      <FeaturesOverview />
      <TestimonialsSection />
      <CTASection />
      <Footer />
    </>
  );
}
