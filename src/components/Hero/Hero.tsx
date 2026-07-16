import styles from "./Hero.module.css";

interface HeroProps {
  onShopNow: () => void;
}

export default function Hero({ onShopNow }: HeroProps) {
  return (
    <section className={styles.hero}>
      <div className={styles.background}>
        <div
          className={styles.image}
          style={{
            backgroundImage:
              "url(https://images.pexels.com/photos/894695/pexels-photo-894695.jpeg?auto=compress&cs=tinysrgb&w=1920)",
          }}
        />
        <div className={styles.overlay} />
        <div className={styles.overlayBottom} />
        <div className={styles.glow} />
      </div>

      <div className={styles.content}>
        <div className={styles.copy}>
          <div className={styles.badge}>
            <div className={styles.badgeLine} />
            <span className={styles.badgeText}>Premium Artisan Coffee</span>
          </div>

          <h1 className={styles.heading}>
            <span className="block">Elevate Your</span>
            <span className={styles.headingAccent}>Coffee Ritual</span>
          </h1>

          <p className={styles.subheading}>
            Discover exceptional, hand-roasted blends sourced from Ethiopia,
            Colombia, and Yemen. Each cup tells a story of craft, tradition, and
            uncompromising quality.
          </p>

          <div className={styles.actions}>
            <button onClick={onShopNow} className={styles.primaryButton}>
              <span className={styles.buttonContent}>
                Explore Collection
                <svg
                  className={styles.icon}
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
            </button>

            <button onClick={onShopNow} className={styles.secondaryButton}>
              Learn Our Story
            </button>
          </div>

          <div className={styles.stats}>
            {[
              { label: "Coffee Origins", value: "3 Continents" },
              { label: "Roast Masters", value: "Q-Certified" },
              { label: "Flavor Profiles", value: "10+ Blends" },
            ].map((stat) => (
              <div key={stat.label} className={styles.stat}>
                <p className={styles.statLabel}>{stat.label}</p>
                <p className={styles.statValue}>{stat.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.scrollIndicator}>
        <p className={styles.scrollText}>Scroll to explore</p>
        <div className={styles.scrollWheel}>
          <div className={styles.scrollDot} />
        </div>
      </div>
    </section>
  );
}
