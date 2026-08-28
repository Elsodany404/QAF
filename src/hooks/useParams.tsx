"use client"
import { usePathname, useRouter, useSearchParams } from "next/navigation";

function useParams() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  

  function updateParams(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());

    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    router.replace(`${pathname}?${params.toString()}`);
  }

  function handleCategoryChange(category: string) {
    updateParams("category", category === "all" ? "" : category);
  }

  function handleSearch(value: string) {
    updateParams("search", value);
  }

  function resetFilters() {
    router.replace(pathname);
  }
  return { handleCategoryChange, handleSearch, resetFilters, pathname, searchParams };
}

export default useParams;
