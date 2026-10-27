import { ArrowRight } from "lucide-react";
import Link from "@/i18n/Link";
import { getI18n } from "@/i18n/server";
import styles from "./FeaturedSection.module.css";
import ProductList from "../ProductList/ProductList";
import { Suspense } from "react";
import ListSkeleton from "../ListSkeleton/ListSkeleton";

async function Featured() {
  const { t } = await getI18n();
  const featured = t.home.featured;

  return (
    <section className="sectionAlt">
      <div className="glowLeft" />

      <div className="container">
        <div className={styles.featuredHeader}>
          <div>
            <div className="badge">
              <p className="badgeText">{featured.badge}</p>
            </div>

            <h2 className={styles.featuredTitle}>{featured.title}</h2>
          </div>

          <Link href={"/menu"} className={styles.viewAllButton}>
            <span>{featured.viewAll}</span>
            <ArrowRight className={`${styles.viewAllIcon} flipRtl`} />
          </Link>
        </div>

        <Suspense fallback={<ListSkeleton />}>
          <ProductList isFeatured={true} />
        </Suspense>

        <div className={styles.mobileButton}>
          <Link href={"/menu"} className={styles.mobileButtonInner}>
            <span>{featured.viewAllProducts}</span>
            <ArrowRight className={`${styles.mobileButtonIcon} flipRtl`} />
          </Link>
        </div>
      </div>
    </section>
  );
}

export default Featured;
