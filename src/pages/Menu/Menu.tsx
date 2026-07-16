import { useEffect, useState } from "react";
import { Search, SlidersHorizontal, X, Filter } from "lucide-react";
import ProductCard from "../../components/ProductCard/ProductCard";
import { supabase } from "../../lib/supabase";
import type {
  Product,
  ProductCategory,
  ProductSubcategory,
} from "../../lib/database.types";
import styles from "./Menu.module.css";

const CATEGORIES: { id: ProductCategory | "all"; label: string }[] = [
  { id: "all", label: "All Coffee" },
  { id: "turkish_coffee", label: "Turkish Coffee" },
  { id: "espresso", label: "Espresso" },
  { id: "flavored_coffee", label: "Flavored Coffee" },
];

const TURKISH_SUBCATEGORIES: { id: ProductSubcategory; label: string }[] = [
  { id: "qaf_blend", label: "Qaf Blend" },
  { id: "colombian_blend", label: "Colombian Blend" },
  { id: "golden_blend", label: "Golden Blend" },
];

export default function Menu() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filtered, setFiltered] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<ProductCategory | "all">(
    "all",
  );
  const [activeSubcategory, setActiveSubcategory] =
    useState<ProductSubcategory | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    supabase
      .from("products")
      .select("*")
      .order("sort_order")
      .then(({ data }) => {
        if (data) {
          setProducts(data as Product[]);
          setFiltered(data as Product[]);
        }
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    let result = [...products];
    if (activeCategory !== "all") {
      result = result.filter((p) => p.category === activeCategory);
    }
    if (activeSubcategory) {
      result = result.filter((p) => p.subcategory === activeSubcategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q),
      );
    }
    setFiltered(result);
  }, [products, activeCategory, activeSubcategory, search]);

  const handleCategoryChange = (cat: ProductCategory | "all") => {
    setActiveCategory(cat);
    setActiveSubcategory(null);
  };

  return (
    <div className={styles.page}>
      <div
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
      </div>

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
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          <div className={styles.countCard}>
            <Filter className="w-5 h-5 text-espresso-600" />
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

        {activeCategory === "turkish_coffee" && (
          <div className={styles.subcategoryRow}>
            <button
              onClick={() => setActiveSubcategory(null)}
              className={`${styles.subcategoryButton} ${activeSubcategory === null ? styles.subcategoryButtonActive : ""}`}
            >
              All Blends
            </button>
            {TURKISH_SUBCATEGORIES.map((sub) => (
              <button
                key={sub.id}
                onClick={() => setActiveSubcategory(sub.id)}
                className={`${styles.subcategoryButton} ${activeSubcategory === sub.id ? styles.subcategoryButtonActive : ""}`}
              >
                {sub.label}
              </button>
            ))}
          </div>
        )}

        {loading ? (
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
        ) : filtered.length === 0 ? (
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
                setActiveSubcategory(null);
                setSearch("");
              }}
              className={styles.resetButton}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className={styles.productGrid}>
            {filtered.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
