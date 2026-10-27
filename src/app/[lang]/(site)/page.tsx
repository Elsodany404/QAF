import type { Metadata } from "next";
import Hero from "@/components/Hero/Hero";
import styles from "./page.module.css";

import OurCollectionSection from "@/components/OurCollectionSection/OurCollectionSection";
import FeaturedSection from "@/components/FeaturedSection/FeaturedSection";
import FeaturesSection from "@/components/FeaturesSection/FeaturesSection";
import CTASection from "@/components/CTASection/CTASection";
import SignatureSection from "@/components/SignatureSection/SignatureSection";
import { alternates } from "@/i18n/metadata";
import { getLocale } from "@/i18n/server";

// The featured products list is pre-rendered; refresh it every 5 minutes.
export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  return { alternates: alternates(await getLocale(), "/") };
}

export default async function Home() {
  return (
    <div className={styles.page}>
      <Hero />

      <OurCollectionSection />

      {/* Streams in on its own: FeaturedSection has its own Suspense boundary. */}
      <FeaturedSection />

      <FeaturesSection />

      <SignatureSection />

      <CTASection />
    </div>
  );
}
