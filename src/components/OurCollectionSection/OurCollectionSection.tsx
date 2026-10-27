import Image from "next/image";
import { ChevronRight } from "lucide-react";
import Link from "@/i18n/Link";
import { getI18n } from "@/i18n/server";
import styles from "./OurCollectionSection.module.css";

import turkishCoffeeImage from "@/assets/images/category_photo_turkish_coffee.jpg";
import espressoImage from "@/assets/images/category_photo_espresso.jpg";
import flavoredCoffeeImage from "@/assets/images/category_photo_flavored_coffee.jpg";

// The text of each card is in the dictionary, under the same id.
const CATEGORY_INFO = [
  {
    id: "turkish_coffee",
    image: turkishCoffeeImage,
    link: "/menu?category=turkish",
  },
  {
    id: "espresso",
    image: espressoImage,
    link: "/menu?category=espresso",
  },
  {
    id: "flavored_coffee",
    image: flavoredCoffeeImage,
    link: "/menu?category=flavored",
  },
] as const;

async function OurCollection() {
  const { t } = await getI18n();
  const collections = t.home.collections;

  return (
    <section className="section">
      <div className="glow" />

      <div className="container">
        <div className={styles.intro}>
          <div className="badge">
            <p className="badgeText">{collections.badge}</p>
          </div>

          <h2 className={styles.title}>
            {collections.titleStart}{" "}
            <span className="titleAccent">{collections.titleAccent}</span>
          </h2>
        </div>

        <div className={styles.categoryGrid}>
          {CATEGORY_INFO.map((category, index) => {
            const text = collections[category.id];
            return (
              <Link
                key={category.id}
                href={category.link}
                className={styles.categoryCard}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <Image
                  src={category.image}
                  alt={text.title}
                  placeholder="blur"
                  className={styles.categoryImage}
                  fill
                  sizes="(max-width: 767px) 100vw, 33vw"
                />

                <div className={styles.categoryOverlay} />

                <div className={styles.categoryContent}>
                  <p className={styles.categorySubtitle}>{text.subtitle}</p>

                  <h3 className={styles.categoryTitle}>{text.title}</h3>

                  <p className={styles.categoryDescription}>
                    {text.description}
                  </p>

                  {text.blends.length > 0 && (
                    <div className={styles.blendWrap}>
                      {text.blends.map((blend) => (
                        <span key={blend} className={styles.blendTag}>
                          {blend}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className={styles.exploreRow}>
                    <span>{collections.explore}</span>
                    <ChevronRight className={`${styles.exploreIcon} flipRtl`} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default OurCollection;
