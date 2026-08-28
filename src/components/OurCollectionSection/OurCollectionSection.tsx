
import Image from "next/image";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import styles from "./OurCollectionSection.module.css";

import turkishCoffeeImage from "@/assets/images/category_photo_turkish_coffee.jpg";
import espressoImage from "@/assets/images/category_photo_espresso.jpg";
import flavoredCoffeeImage from "@/assets/images/category_photo_flavored_coffee.jpg";

const CATEGORY_INFO = [
  {
    id: "turkish_coffee",
    title: "Turkish Coffee",
    subtitle: "Time-Honored Tradition",
    description:
      "Finely ground, slow-brewed perfection in three exceptional blends.",
    image: turkishCoffeeImage,
    blends: ["Qaf Blend", "Colombian Blend", "Golden Blend"],
  },
  {
    id: "espresso",
    title: "Espresso",
    subtitle: "Intense & Refined",
    description:
      "Bold shots crafted for baristas, perfectionists, and everyday ritualists.",
    image: espressoImage,
    blends: [],
  },
  {
    id: "flavored_coffee",
    title: "Flavored Coffee",
    subtitle: "Creative Indulgence",
    description:
      "Natural infusions that transform your cup into a sensory experience.",
    image: flavoredCoffeeImage,
    blends: [],
  },
];

function OurCollection() {
  return (
    <section className="section">
      <div className="glow" />

      <div className="container">
        <div className={styles.intro}>
          <div className="badge">
            <p className="badgeText">Our Collections</p>
          </div>

          <h2 className="title">
            Three Worlds of{" "}
            <span className="titleAccent">Exceptional Coffee</span>
          </h2>
        </div>

        <div className={styles.categoryGrid}>
          {CATEGORY_INFO.map((category, index) => (
            <Link
              key={category.id}
            
              href={"/menu"}
              className={styles.categoryCard}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <Image
                src={category.image}
                alt={category.title}
                placeholder="blur"
                className={styles.categoryImage}
                fill
                sizes="(max-width: 767px) 100vw, 33vw"
              />

              <div className={styles.categoryOverlay} />

              <div className={styles.categoryContent}>
                <p className={styles.categorySubtitle}>{category.subtitle}</p>

                <h3 className={styles.categoryTitle}>{category.title}</h3>

                <p className={styles.categoryDescription}>
                  {category.description}
                </p>

                {category.blends.length > 0 && (
                  <div className={styles.blendWrap}>
                    {category.blends.map((blend) => (
                      <span key={blend} className={styles.blendTag}>
                        {blend}
                      </span>
                    ))}
                  </div>
                )}

                <div className={styles.exploreRow}>
                  <span>Explore</span>
                  <ChevronRight className={styles.exploreIcon} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export default OurCollection;
