import { useEffect, useState } from "react";
import {
  ArrowRight,
  Award,
  Leaf,
  Globe,
  ChevronRight,
  Zap,
} from "lucide-react";
import Hero from "../../components/Hero/Hero";
import ProductCard from "../../components/ProductCard/ProductCard";
import { supabase } from "../../lib/supabase";
import type { Product } from "../../lib/database.types";
import styles from "./Home.module.css";

interface HomeProps {
  onNavigate: (page: string) => void;
}

const CATEGORY_INFO = [
  {
    id: "turkish_coffee",
    title: "Turkish Coffee",
    subtitle: "Time-Honored Tradition",
    description:
      "Finely ground, slow-brewed perfection in three exceptional blends.",
    image:
      "https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=600",
    blends: ["Qaf Blend", "Colombian Blend", "Golden Blend"],
  },
  {
    id: "espresso",
    title: "Espresso",
    subtitle: "Intense & Refined",
    description:
      "Bold shots crafted for baristas, perfectionists, and everyday ritualists.",
    image:
      "https://images.pexels.com/photos/312418/pexels-photo-312418.jpeg?auto=compress&cs=tinysrgb&w=600",
    blends: [],
  },
  {
    id: "flavored_coffee",
    title: "Flavored Coffee",
    subtitle: "Creative Indulgence",
    description:
      "Natural infusions that transform your cup into a sensory experience.",
    image:
      "https://images.pexels.com/photos/6802983/pexels-photo-6802983.jpeg?auto=compress&cs=tinysrgb&w=600",
    blends: [],
  },
];

export default function Home({ onNavigate }: HomeProps) {
  const [featured, setFeatured] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("products")
      .select("*")
      .eq("featured", true)
      .order("sort_order")
      .limit(4)
      .then(({ data }) => {
        if (data) setFeatured(data as Product[]);
        setLoading(false);
      });
  }, []);

  return (
    <div className={styles.page}>
      <Hero onShopNow={() => onNavigate("menu")} />

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
                onClick={() => onNavigate("menu")}
                className={styles.categoryCard}
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <img
                  src={cat.image}
                  alt={cat.title}
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
              onClick={() => onNavigate("menu")}
              className={styles.viewAllButton}
            >
              View All
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {loading ? (
            <div className={styles.productGrid}>
              {[...Array(4)].map((_, i) => (
                <div key={i} className={styles.skeletonCard}>
                  <div className={styles.skeletonImage} />
                  <div className={styles.skeletonBody}>
                    <div
                      className={`${styles.skeletonLine} ${styles.skeletonLineShort}`}
                    />
                    <div className={styles.skeletonLine} />
                    <div className={styles.skeletonLine} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.productGrid}>
              {featured.map((p, i) => (
                <div key={p.id} style={{ animationDelay: `${i * 100}ms` }}>
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          )}

          <div className={styles.mobileButton}>
            <button
              onClick={() => onNavigate("menu")}
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
                onClick={() => onNavigate("menu")}
                className={styles.viewAllButton}
              >
                Shop Turkish Coffee
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>

            <div className={styles.imageStack}>
              <img
                src="https://images.pexels.com/photos/2396220/pexels-photo-2396220.jpeg?auto=compress&cs=tinysrgb&w=800"
                alt="Turkish Coffee"
                className={styles.imageMain}
              />
              <img
                src="https://images.pexels.com/photos/1695052/pexels-photo-1695052.jpeg?auto=compress&cs=tinysrgb&w=400"
                alt="Coffee beans"
                className={styles.imageSecondary}
              />
            </div>
          </div>
        </div>
      </section>

      <section className={styles.ctaSection}>
        <div
          className={styles.ctaBackground}
          style={{
            backgroundImage:
              "url(https://images.pexels.com/photos/1187317/pexels-photo-1187317.jpeg?auto=compress&cs=tinysrgb&w=1920)",
          }}
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
            onClick={() => onNavigate("menu")}
            className={styles.ctaButton}
          >
            <Zap className="w-5 h-5" />
            Shop Now
          </button>
        </div>
      </section>
    </div>
  );
}
