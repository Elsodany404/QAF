import styles from "./Hero.module.css";
import Image from "next/image";
import heroImage from "@/assets/images/hero.jpg";
import Link from "@/i18n/Link";
import { getI18n } from "@/i18n/server";

export default async function Hero() {
  const { t } = await getI18n();
  const hero = t.home.hero;

  return (
    <section className={styles.hero}>
      <div className={styles.background}>
        <Image
          className={styles.image}
          src={heroImage}
          placeholder="blur"
          alt={hero.imageAlt}
          quality={50}
          loading="eager"
          fetchPriority="high"
        />
        <div className={styles.overlay} />
        <div className={styles.overlayBottom} />
        <div className={styles.glow} />
      </div>

      <div className={styles.content}>
        <div className={styles.copy}>
          <div className={styles.badge}>
            <div className={styles.badgeLine} />
            <span className={styles.badgeText}>{hero.badge}</span>
          </div>

          <h1 className={styles.heading}>
            <span>{hero.headingTop}</span>
            <span className={styles.headingAccent}>{hero.headingAccent}</span>
          </h1>

          <p className={styles.subheading}>{hero.text}</p>

          <div className={styles.actions}>
            <Link href={"/menu"} className={styles.primaryButton}>
              <span className={styles.buttonContent}>
                {hero.explore}
                <svg
                  className={`${styles.icon} flipRtl`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </span>
            </Link>

            <Link href={"/about"} className={styles.secondaryButton}>
              {hero.story}
            </Link>
          </div>

          <div className={styles.stats}>
            {hero.stats.map((stat) => (
              <div key={stat.label} className={styles.stat}>
                <p className={styles.statLabel}>{stat.label}</p>
                <p className={styles.statValue}>{stat.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.scrollIndicator}>
        <p className={styles.scrollText}>{hero.scroll}</p>
        <div className={styles.scrollWheel}>
          <div className={styles.scrollDot} />
        </div>
      </div>
    </section>
  );
}
