"use client";

import NextLink from "next/link";
import type { ComponentProps } from "react";

import { useI18n } from "./I18nProvider";

/**
 * next/link that keeps visitors in their language: href="/menu" leads to
 * /ar/menu on an Arabic page. Use it for every link to a page of the site;
 * external links and #anchors pass through unchanged.
 */
export default function Link({
  href,
  ...props
}: ComponentProps<typeof NextLink>) {
  const i18n = useI18n();
  return (
    <NextLink
      href={typeof href === "string" ? i18n.href(href) : href}
      {...props}
    />
  );
}
