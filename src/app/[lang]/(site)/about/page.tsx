import { Leaf, Globe, Award, Heart, ArrowRight } from "lucide-react";
import styles from "./page.module.css";
import Image from "next/image";
import Link from "@/i18n/Link";
import signature_coffee_photo from "@/assets/images/signature_coffee_photo_big.jpg";
import story_section_photo from "@/assets/images/story_section_photo.jpg";
import story_section_photo_2 from "@/assets/images/story_section_photo_2.jpg";
import type { Metadata } from "next";
import { alternates } from "@/i18n/metadata";
import { getI18n } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { locale, t } = await getI18n();
  return {
    title: t.about.metaTitle,
    description: t.about.metaDescription,
    alternates: alternates(locale, "/about"),
  };
}

// In the order of the values in the dictionary.
const VALUE_ICONS = [Globe, Award, Leaf, Heart];

export default async function About() {
  const { t } = await getI18n();
  const text = t.about;

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <Image
          quality={50}
          loading="eager"
          fetchPriority="high"
          placeholder="blur"
          className={styles.heroImage}
          src={signature_coffee_photo}
          alt={text.heroImageAlt}
        />
        <div className={styles.heroOverlay} />
        <div className={styles.heroOverlaySoft} />
        <div className={styles.heroContent}>
          <div className={styles.heroBadge}>
            <p className={styles.heroBadgeText}>{text.badge}</p>
          </div>
          <h1 className={styles.heroTitle}>
            {text.titleStart}{" "}
            <span className={styles.heroTitleAccent}>{text.titleAccent}</span>
          </h1>
          <p className={styles.heroText}>{text.text}</p>
        </div>
      </div>

      <section className={styles.section}>
        <div className={styles.glow} />
        <div className={styles.container}>
          <div className={styles.storyGrid}>
            <div>
              <h2 className={styles.storyTitle}>
                {text.storyTitleStart}{" "}
                <span className={styles.storyTitleAccent}>
                  {text.storyTitleAccent}
                </span>
              </h2>
              {text.story.map((paragraph) => (
                <p key={paragraph} className={styles.storyText}>
                  {paragraph}
                </p>
              ))}
            </div>
            <div className={styles.imageGrid}>
              <Image
                src={story_section_photo}
                placeholder="blur"
                alt={text.storyImageAlt}
                className={styles.image}
              />
              <Image
                src={story_section_photo_2}
                placeholder="blur"
                alt={text.storySecondImageAlt}
                className={`${styles.image} ${styles.imageOffset}`}
              />
            </div>
          </div>
        </div>
      </section>

      <section className={styles.sectionAlt}>
        <div className={styles.glowLeft} />
        <div className={styles.container}>
          <div className={styles.sectionHeading}>
            <div className={styles.sectionBadge}>
              <p className={styles.sectionBadgeText}>{text.valuesBadge}</p>
            </div>
            <h2 className={styles.sectionTitle}>{text.valuesTitle}</h2>
          </div>

          <div className={styles.valuesGrid}>
            {text.values.map(({ title, description }, i) => {
              const Icon = VALUE_ICONS[i];
              return (
                <div
                  key={title}
                  className={styles.valueCard}
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className={styles.valueIcon}>
                    <Icon aria-hidden="true" />
                  </div>
                  <h3 className={styles.valueTitle}>{title}</h3>
                  <p className={styles.valueDesc}>{description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.glow} />
        <div className={styles.container}>
          <div className={styles.sectionHeading}>
            <div className={styles.sectionBadge}>
              <p className={styles.sectionBadgeText}>{text.processBadge}</p>
            </div>
            <h2 className={styles.sectionTitle}>{text.processTitle}</h2>
          </div>

          <div className={styles.processGrid}>
            {text.process.map((item, i) => (
              <div
                key={item.title}
                className={styles.processCard}
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className={styles.processStep}>
                  {String(i + 1).padStart(2, "0")}
                </div>
                <h3 className={styles.processTitle}>{item.title}</h3>
                <p className={styles.processDesc}>{item.description}</p>
                {i < text.process.length - 1 && (
                  <ArrowRight className={`${styles.arrow} flipRtl`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.ctaSection}>
        <div className={styles.container}>
          <div className={styles.ctaContent}>
            <h2 className={styles.ctaTitle}>{text.ctaTitle}</h2>
            <p className={styles.ctaText}>{text.ctaText}</p>
            <div className={styles.ctaActions}>
              <Link href="/menu" className={styles.ctaButton}>
                {text.ctaShop}
                <ArrowRight size={20} className="flipRtl" aria-hidden="true" />
              </Link>
              <Link href="/contact" className={styles.ctaSecondary}>
                {text.ctaContact}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
