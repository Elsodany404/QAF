import type { Metadata } from "next";
import { Suspense } from "react";

import ListSkeleton from "@/components/ListSkeleton/ListSkeleton";
import ProductList from "@/components/ProductList/ProductList";
import ToolBar from "@/components/ToolBar/ToolBar";
import { alternates } from "@/i18n/metadata";
import { getI18n } from "@/i18n/server";
import { firstParam } from "@/lib/searchParams";
import styles from "./page.module.css";

export async function generateMetadata(): Promise<Metadata> {
  const { locale, t } = await getI18n();
  return {
    title: t.menu.metaTitle,
    description: t.menu.metaDescription,
    alternates: alternates(locale, "/menu"),
  };
}

type MenuProps = {
  searchParams: Promise<{
    search?: string | string[];
    category?: string | string[];
  }>;
};

export default async function Menu({ searchParams }: MenuProps) {
  const [params, { t }] = await Promise.all([searchParams, getI18n()]);

  const search = firstParam(params.search) ?? "";
  const category = firstParam(params.category) ?? "all";

  return (
    <div className={styles.page}>
      <div className={styles.main}>
        <h1 className="srOnly">{t.menu.heading}</h1>
        <ToolBar />

        <Suspense key={`${category}-${search}`} fallback={<ListSkeleton />}>
          <ProductList search={search} category={category} />
        </Suspense>
      </div>
    </div>
  );
}
