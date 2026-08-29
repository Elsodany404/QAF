import styles from "./page.module.css";
import ToolBar from "@/components/ToolBar/ToolBar";
import ProductList from "@/components/ProductList/ProductList";
import { Suspense } from "react";
import ListSkeleton from "@/components/ListSkeleton/ListSkeleton";

type MenuProps = {
  searchParams: Promise<{
    search?: string;
    category?: string;
  }>;
};

export default async function Menu({ searchParams }: MenuProps) {
  const params = await searchParams;

  const search = params.search ?? "";
  const category = params.category ?? "all";

  return (
    <div className={styles.page}>
      <div className={styles.main}>
        <ToolBar />

        <Suspense key={`${category}-${search}`} fallback={<ListSkeleton />}>
          <ProductList search={search} category={category} />
        </Suspense>
      </div>
    </div>
  );
}
