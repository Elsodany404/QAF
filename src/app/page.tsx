import Hero from "@/components/Hero/Hero";
import styles from "./page.module.css";

import OurCollectionSection from "@/components/OurCollectionSection/OurCollectionSection";
import FeaturedSection from "@/components/FeaturedSection/FeaturedSection";
import FeaturesSection from "@/components/FeaturesSection/FeaturesSection";
import CTASection from "@/components/CTASection/CTASection";
import SignatureSection from "@/components/SignatureSection/SignatureSection";
import { Suspense } from "react";
import Spinner from "@/components/Spinner/Spinner";

// The featured products list is pre-rendered; refresh it every 5 minutes.
export const revalidate = 300;

export default async function Home() {
  return (
    <div className={styles.page}>
      <Hero />

      <OurCollectionSection />

      <Suspense fallback={<Spinner variant="component" size="lg" />}>
        <FeaturedSection />
      </Suspense>

      <FeaturesSection />

      <SignatureSection />

      <CTASection />
    </div>
  );
}
