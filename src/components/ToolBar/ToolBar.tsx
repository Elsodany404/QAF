"use client";
import { Search, X } from "lucide-react";
import styles from "./ToolBar.module.css";
import { CATEGORIES } from "@/types/customTypes";
import useParams from "@/hooks/useParams";

function ToolBar() {
  const { handleCategoryChange, handleSearch, searchParams } = useParams();

  const search = searchParams.get("search") ?? "";
  const category = searchParams.get("category") ?? "all";

  return (
    <>
      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <Search className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search by name or flavor..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className={styles.searchInput}
          />
          {search && (
            <button
              type="button"
              onClick={() => handleSearch("")}
              className={styles.clearButton}
            >
              <X />
            </button>
          )}
        </div>
        {/* <div className={styles.countCard}>
          <Filter />
          <span className={styles.countValue}>{numberOfItems} items</span>
        </div> */}
      </div>

      <div className={styles.categoryTabs}>
        {CATEGORIES.map((cat) => (
          <button
            type="button"
            key={cat.id}
            onClick={() => handleCategoryChange(cat.id)}
            className={`${styles.categoryButton} ${category === cat.id ? styles.categoryButtonActive : ""}`}
          >
            {cat.label}
          </button>
        ))}
      </div>
    </>
  );
}

export default ToolBar;
