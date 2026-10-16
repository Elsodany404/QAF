import type { Metadata } from "next";
import { Suspense } from "react";

import ListSkeleton from "@/components/ListSkeleton/ListSkeleton";
import ProductList from "@/components/ProductList/ProductList";
import ToolBar from "@/components/ToolBar/ToolBar";
import { firstParam } from "@/lib/searchParams";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Shop",
  description:
    "Shop Qaf Coffee's Turkish coffee, espresso, flavored coffee and Arabian blends, freshly roasted and delivered across Egypt.",
};

type MenuProps = {
  searchParams: Promise<{
    search?: string | string[];
    category?: string | string[];
  }>;
};

export default async function Menu({ searchParams }: MenuProps) {
  const params = await searchParams;

  const search = firstParam(params.search) ?? "";
  const category = firstParam(params.category) ?? "all";

  return (
    <div className={styles.page}>
      <div className={styles.main}>
        <h1 className="srOnly">Shop our coffee</h1>
        <ToolBar />

        <Suspense key={`${category}-${search}`} fallback={<ListSkeleton />}>
          <ProductList search={search} category={category} />
        </Suspense>
      </div>
    </div>
  );
}
