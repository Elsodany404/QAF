import { useEffect, useMemo, useState } from "react";
import { Search, SlidersHorizontal, X, Filter } from "lucide-react";
import ProductCard from "../../components/ProductCard/ProductCard";
import type { Product } from "../../types/db";
import styles from "./Menu.module.css";
import { useQuery } from "@tanstack/react-query";
import { getAllProducts } from "../../services/Product";
import { CATEGORIES } from "../../types/customTypes";

export default function Menu() {
  const { data, isPending } = useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: getAllProducts,
  });
  const [activeCategory, setActiveCategory] = useState<string | "all">("all");

  const [filtered, setFiltered] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const products = useMemo(
    function () {
      return data ?? [];
    },
    [data],
  );

  useEffect(() => {
    let result = [...products];
    if (activeCategory !== "all") {
      result = result.filter((p) => p.category === activeCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name!.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q)),
      );
    }
    setFiltered(result);
  }, [products, activeCategory, search]);

  function handleCategoryChange(id: string) {
    const activeCat = CATEGORIES.find((cat) => cat.id === id);
    if (activeCat) {
      setActiveCategory(activeCat.id);
    }
  }
  return (
    <div className={styles.page}>
      {/* Hero overlay */}
      {/* <div
        className={styles.hero}
        style={{
          backgroundImage:
            "url(https://images.pexels.com/photos/2396220/pexels-photo-2396220.jpeg?auto=compress&cs=tinysrgb&w=1920)",
        }}
      >
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <div className={styles.heroBadge}>
            <p className={styles.heroBadgeText}>Collection</p>
          </div>
          <h1 className={styles.heroTitle}>Our Coffee</h1>
          <p className={styles.heroText}>
            Curated blends from the world's finest origins — crafted with
            precision, served with pride.
          </p>
        </div>
      </div> */}
      <div className={styles.main}>
        <div className={styles.toolbar}>
          <div className={styles.searchBox}>
            <Search className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search by name or flavor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={styles.searchInput}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className={styles.clearButton}
              >
                <X />
              </button>
            )}
          </div>
          <div className={styles.countCard}>
            <Filter />
            <span className={styles.countValue}>{filtered.length} items</span>
          </div>
        </div>

        <div className={styles.categoryTabs}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryChange(cat.id)}
              className={`${styles.categoryButton} ${activeCategory === cat.id ? styles.categoryButtonActive : ""}`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {isPending ? (
          <div className={styles.productGrid}>
            {[...Array(8)].map((_, i) => (
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
        ) : products.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <SlidersHorizontal />
            </div>
            <p className={styles.emptyTitle}>No coffee found</p>
            <p className={styles.emptyText}>
              Try adjusting your filters or search
            </p>
            <button
              onClick={() => {
                setActiveCategory("all");
                setSearch("");
              }}
              className={styles.resetButton}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          filtered && (
            <div className={styles.productGrid}>
              {filtered.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
