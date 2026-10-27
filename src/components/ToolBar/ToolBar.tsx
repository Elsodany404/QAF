"use client";
import { useState } from "react";
import { Search, X } from "lucide-react";
import styles from "./ToolBar.module.css";
import { CATEGORIES } from "@/types/customTypes";
import useMenuFilters from "@/hooks/useMenuFilters";
import { categoryName } from "@/i18n/catalog";
import { useI18n } from "@/i18n/I18nProvider";
import { useDebouncedCallback } from "use-debounce";

function ToolBar() {
  const { t } = useI18n();
  const { handleCategoryChange, handleSearch, searchParams } =
    useMenuFilters();

  const searchParam = searchParams.get("search") ?? "";
  const categoryParam = searchParams.get("category") ?? "all";

  // Highlight the tapped chip immediately instead of waiting for navigation
  const [category, setCategory] = useState(categoryParam);
  const [prevCategoryParam, setPrevCategoryParam] = useState(categoryParam);

  if (categoryParam !== prevCategoryParam) {
    setCategory(categoryParam);
    setPrevCategoryParam(categoryParam);
  }

  const onCategoryClick = (id: string) => {
    if (id === category) return;
    setCategory(id);
    handleCategoryChange(id);
  };

  // Local state ensures the input updates smoothly without waiting for URL navigation
  const [searchValue, setSearchValue] = useState(searchParam);
  const [prevSearchParam, setPrevSearchParam] = useState(searchParam);

  if (searchParam !== prevSearchParam) {
    setSearchValue(searchParam);
    setPrevSearchParam(searchParam);
  }

  // Debounced callback
  const debouncedSearch = useDebouncedCallback((value) => {
    handleSearch(value);
  }, 300);

  const onSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchValue(val);
    debouncedSearch(val);
  };

  const handleClear = () => {
    setSearchValue("");
    handleSearch("");
  };

  return (
    <>
      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <Search className={styles.searchIcon} aria-hidden="true" />
          <input
            type="text"
            inputMode="search"
            enterKeyHint="search"
            aria-label={t.menu.searchLabel}
            placeholder={t.menu.searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e)}
            className={styles.searchInput}
          />
          {searchValue && (
            <button
              type="button"
              onClick={handleClear}
              className={styles.clearButton}
              aria-label={t.menu.clearSearch}
            >
              <X aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      <div
        className={styles.categoryTabs}
        role="group"
        aria-label={t.menu.filterLabel}
      >
        {CATEGORIES.map((cat) => (
          <button
            type="button"
            key={cat.id}
            onClick={() => onCategoryClick(cat.id)}
            aria-pressed={category === cat.id}
            className={`${styles.categoryButton} ${category === cat.id ? styles.categoryButtonActive : ""}`}
          >
            {categoryName(t.categories, cat.id)}
          </button>
        ))}
      </div>
    </>
  );
}

export default ToolBar;
