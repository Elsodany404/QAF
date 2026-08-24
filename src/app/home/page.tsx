"use client";
import { useState } from "react";
import {
  ArrowRight,
  Award,
  Leaf,
  Globe,
  ChevronRight,
  Zap,
} from "lucide-react";
import Hero from "@/components/Hero/Hero";
import ProductCard from "@/components/ProductCard/ProductCard";
import styles from "./page.module.css";
import { useRouter } from "next/navigation";
import Image from "next/image";

import signature_coffee_photo_small from "@/assets/images/signature_coffee_photo_small.jpg";
import signature_coffee_photo_big from "@/assets/images/signature_coffee_photo_big.jpg";
import turkish_coffee_image from "@/assets/images/category_photo_turkish_coffee.jpg";
import espresso_image from "@/assets/images/category_photo_espresso.jpg";
import flavored_coffee from "@/assets/images/category_photo_flavored_coffee.jpg";
import call_to_action_photo from "@/assets/images/cta_section_photo.jpg";
import { getAllProducts } from "@/services/Product";
import { useQuery } from "@tanstack/react-query";
import Product from "../products/[productID]/page";
import Spinner from "@/components/Spinner/Spinner";

const CATEGORY_INFO = [
  {
    id: "turkish_coffee",
    title: "Turkish Coffee",
    subtitle: "Time-Honored Tradition",
    description:
      "Finely ground, slow-brewed perfection in three exceptional blends.",
    image: turkish_coffee_image,
    blends: ["Qaf Blend", "Colombian Blend", "Golden Blend"],
  },
  {
    id: "espresso",
    title: "Espresso",
    subtitle: "Intense & Refined",
    description:
      "Bold shots crafted for baristas, perfectionists, and everyday ritualists.",
    image: espresso_image,
    blends: [],
  },
  {
    id: "flavored_coffee",
    title: "Flavored Coffee",
    subtitle: "Creative Indulgence",
    description:
      "Natural infusions that transform your cup into a sensory experience.",
    image: flavored_coffee,
    blends: [],
  },
];

export default function Home() {
  const { data, isPending } = useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: getAllProducts,
  });

  const featured = data?.filter((pr) => pr.featured);
  const router = useRouter();

  return (
    <div className={styles.page}>
      <Hero />

      <section className={styles.section}>
        <div className={styles.glow} />
        <div className={styles.container}>
          <div className={styles.intro}>
            <div className={styles.badge}>
              <p className={styles.badgeText}>Our Collections</p>
            </div>
            <h2 className={styles.title}>
              Three Worlds of{" "}
              <span className={styles.titleAccent}>Exceptional Coffee</span>
            </h2>
          </div>

          <div className={styles.categoryGrid}>
            {CATEGORY_INFO.map((cat, i) => (
              <button
                key={cat.id}
                onClick={() => router.push("/menu")}
                className={styles.categoryCard}
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <Image
                  src={cat.image}
                  alt={cat.title}
                  placeholder="blur"
                  className={styles.categoryImage}
                />
                <div className={styles.categoryOverlay} />

                <div className={styles.categoryContent}>
                  <p className={styles.categorySubtitle}>{cat.subtitle}</p>
                  <h3 className={styles.categoryTitle}>{cat.title}</h3>
                  <p className={styles.categoryDescription}>
                    {cat.description}
                  </p>
                  {cat.blends.length > 0 && (
                    <div className={styles.blendWrap}>
                      {cat.blends.map((b) => (
                        <span key={b} className={styles.blendTag}>
                          {b}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className={styles.exploreRow}>
                    Explore <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.sectionAlt}>
        <div className={styles.glowLeft} />
        <div className={styles.container}>
          <div className={styles.featuredHeader}>
            <div>
              <div className={styles.badge}>
                <p className={styles.badgeText}>Bestsellers</p>
              </div>
              <h2 className={styles.featuredTitle}>Featured Blends</h2>
            </div>

            <button
              onClick={() => router.push("/menu")}
              className={styles.viewAllButton}
            >
              View All
              <ArrowRight />
            </button>
          </div>

          <div className={styles.productGrid}>
            {isPending || !featured ? (
              <Spinner variant="component" size="md" />
            ) : (
              featured.map((p) => (
                <div key={p.id}>
                  <ProductCard product={p} />
                </div>
              ))
            )}
          </div>

          <div className={styles.mobileButton}>
            <button
              onClick={() => router.push("/menu")}
              className={styles.mobileButtonInner}
            >
              View All Products <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      <section className={styles.sectionDark}>
        <div className={styles.glowDark} />
        <div className={styles.container}>
          <div className={styles.valuesGrid}>
            {[
              {
                Icon: Globe,
                title: "Ethically Sourced",
                desc: "Direct relationships with farmers in Ethiopia, Colombia, and Yemen ensure fair trade and exceptional quality.",
              },
              {
                Icon: Award,
                title: "Master Roasted",
                desc: "Q-certified roasters bring precision and passion to every batch, unlocking peak flavor potential.",
              },
              {
                Icon: Leaf,
                title: "Sustainable",
                desc: "Carbon-neutral shipping, compostable packaging, and forest restoration in every order.",
              },
            ].map(({ Icon, title, desc }, i) => (
              <div
                key={title}
                style={{ animationDelay: `${i * 100}ms` }}
                className={styles.valueCard}
              >
                <div className={styles.valueIcon}>
                  <Icon className="w-7 h-7" />
                </div>
                <h3 className={styles.valueTitle}>{title}</h3>
                <p className={styles.valueDesc}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.glowLeft} />
        <div className={styles.container}>
          <div className={styles.signatureGrid}>
            <div className={styles.signatureCopy}>
              <div className={styles.signatureBadge}>
                <p className={styles.signatureBadgeText}>Our Signature</p>
              </div>
              <h2 className={styles.signatureTitle}>
                Turkish Coffee{" "}
                <span className={styles.titleAccent}>Reimagined</span>
              </h2>
              <p className={styles.signatureText}>
                Three distinct blends that honor centuries of tradition while
                pushing flavor boundaries. Each tells a story of origin, craft,
                and devotion.
              </p>

              <div className={styles.blendList}>
                {[
                  {
                    name: "Qaf Blend",
                    desc: "Deep chocolate, rich body, our signature taste",
                    icon: "◆",
                  },
                  {
                    name: "Colombian Blend",
                    desc: "Bright acidity, caramel sweetness, vibrant origin",
                    icon: "◆",
                  },
                  {
                    name: "Golden Blend",
                    desc: "Honey, dried fruits, warming spice, our finest",
                    icon: "◆",
                  },
                ].map((blend) => (
                  <div key={blend.name} className={styles.blendItem}>
                    <div className={styles.blendIcon}>{blend.icon}</div>
                    <div>
                      <p className={styles.blendName}>{blend.name}</p>
                      <p className={styles.blendDesc}>{blend.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => router.push("/menu")}
                className={styles.viewAllButton}
              >
                Shop Turkish Coffee
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>

            <div className={`${styles.imageStack} `}>
              <Image
                src={signature_coffee_photo_big}
                placeholder="blur"
                alt="Turkish Coffee"
                className={styles.imageMain}
              />
              <Image
                placeholder="blur"
                src={signature_coffee_photo_small}
                alt="Coffee beans"
                className={styles.imageSecondary}
              />
            </div>
          </div>
        </div>
      </section>

      <section className={styles.ctaSection}>
        <Image
          placeholder="blur"
          src={call_to_action_photo}
          className={styles.ctaBackground}
          alt="call to action coffee photo"
        />
        <div className={styles.ctaOverlay} />
        <div className={styles.ctaOverlaySoft} />

        <div className={styles.ctaContent}>
          <h2 className={styles.ctaTitle}>Ready for Extraordinary?</h2>
          <p className={styles.ctaText}>
            Experience the difference that small-batch roasting, ethical
            sourcing, and pure passion make.
          </p>
          <button
            onClick={() => router.push("/menu")}
            className={styles.ctaButton}
          >
            <Zap />
            Shop Now
          </button>
        </div>
      </section>
    </div>
  );
}
