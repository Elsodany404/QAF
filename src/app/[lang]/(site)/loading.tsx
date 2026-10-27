"use client";

import Spinner from "@/components/Spinner/Spinner";
import { useI18n } from "@/i18n/I18nProvider";

export default function Loading() {
  const { t } = useI18n();
  return <Spinner variant="page" size="lg" label={t.common.loading} />;
}
