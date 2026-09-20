"use client";
import { useState} from "react";
import { Search, X } from "lucide-react";
import styles from "./ToolBar.module.css";
import { CATEGORIES } from "@/types/customTypes";
import useParams from "@/hooks/useSearchParams";
import { useDebouncedCallback } from "use-debounce";

function ToolBar() {
  const { handleCategoryChange, handleSearch, searchParams } = useParams();

  const searchParam = searchParams.get("search") ?? "";
  const category = searchParams.get("category") ?? "all";

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
          <Search className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search by name or flavor..."
            value={searchValue}
            onChange={(e) => onSearchChange(e)}
            className={styles.searchInput}
          />
          {searchValue && (
            <button
              type="button"
              onClick={handleClear}
              className={styles.clearButton}
            >
              <X />
            </button>
          )}
        </div>
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
