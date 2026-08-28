import { ArrowRight } from "lucide-react";
import Link from "next/link";
import styles from "./FeaturedSection.module.css";

// Keep your existing query/imports here.
import ProductList from "../ProductList/ProductList";
import { Suspense } from "react";
import ListSkeleton from "../ListSkeleton/ListSkeleton";

function Featured() {
  return (
    <section className="sectionAlt">
      <div className="glowLeft" />

      <div className="container">
        <div className={styles.featuredHeader}>
          <div>
            <div className="badge">
              <p className="badgeText">Bestsellers</p>
            </div>

            <h2 className={styles.featuredTitle}>Featured Blends</h2>
          </div>

          <Link href={"/menu"} className={styles.viewAllButton}>
            <span>View All</span>
            <ArrowRight className={styles.viewAllIcon} />
          </Link>
        </div>

        <Suspense fallback={<ListSkeleton />}>
          <ProductList isFeatured={true} />
        </Suspense>

        <div className={styles.mobileButton}>
          <Link href={"/menu"} className={styles.mobileButtonInner}>
            <span>View All Products</span>
            <ArrowRight className={styles.mobileButtonIcon} />
          </Link>
        </div>
      </div>
    </section>
  );
}

export default Featured;
