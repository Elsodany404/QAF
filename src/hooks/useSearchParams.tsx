"use client";
import { useCallback, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

function useParams() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const updateParams = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());

      if (value.trim()) {
        params.set(key, value.trim());
      } else {
        params.delete(key);
      }

      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      });
    },
    [pathname, router, searchParams],
  );

  const handleCategoryChange = useCallback(
    (category: string) => {
      updateParams("category", category === "all" ? "" : category);
    },
    [updateParams],
  );

  const handleSearch = useCallback(
    (value: string) => {
      updateParams("search", value);
    },
    [updateParams],
  );

  const resetFilters = useCallback(() => {
    startTransition(() => {
      router.replace(pathname, { scroll: false });
    });
  }, [pathname, router]);

  return {
    handleCategoryChange,
    handleSearch,
    resetFilters,
    pathname,
    searchParams,
    isPending,
  };
}

export default useParams;
