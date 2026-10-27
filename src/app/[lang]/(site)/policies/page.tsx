import { Shield, Truck, RotateCcw } from "lucide-react";
import styles from "./page.module.css";
import type { Metadata } from "next";
import Link from "@/i18n/Link";
import { alternates } from "@/i18n/metadata";
import { rich } from "@/i18n/rich";
import { getI18n } from "@/i18n/server";
import { SHOP_WHATSAPP_DISPLAY, shopWhatsAppUrl } from "@/lib/whatsapp";

export async function generateMetadata(): Promise<Metadata> {
  const { locale, t } = await getI18n();
  return {
    title: t.policies.metaTitle,
    description: t.policies.metaDescription,
    alternates: alternates(locale, "/policies"),
  };
}

// The text of each policy is in the dictionary, under its key. The ids are
// the anchors the footer links to.
const POLICIES = [
  { key: "privacy", id: "privacy-policy", Icon: Shield },
  { key: "delivery", id: "delivery-shipping-policy", Icon: Truck },
  { key: "returns", id: "return-refund-policy", Icon: RotateCcw },
] as const;

export default async function Policies() {
  const { t } = await getI18n();
  const text = t.policies;

  // Elements the paragraphs place with their {placeholders}.
  const elements = {
    email: <a href="mailto:sales@qafcoffee.store">sales@qafcoffee.store</a>,
    whatsapp: (
      // dir: keeps "+20 103 …" in order inside Arabic text.
      <a href={shopWhatsAppUrl()} target="_blank" rel="noreferrer" dir="ltr">
        {SHOP_WHATSAPP_DISPLAY}
      </a>
    ),
    account: <Link href="/user">{text.accountLink}</Link>,
  };

  return (
    <div className={styles.page}>
      {/* Hero */}
      <div className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.heroBadge}>
            <p className={styles.heroBadgeText}>{text.badge}</p>
          </div>
          <h1 className={styles.heroTitle}>{text.title}</h1>
          <p className={styles.heroText}>{text.text}</p>
        </div>
      </div>

      {/* Policy cards */}
      <section className={styles.section}>
        <div className={styles.glow} />
        <div className={styles.container}>
          <div className={styles.grid}>
            {POLICIES.map(({ key, id, Icon }) => (
              <article id={id} key={id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardIcon}>
                    <Icon aria-hidden="true" />
                  </div>
                  <h2 className={styles.cardTitle}>{text[key].title}</h2>
                </div>
                <div className={styles.cardBody}>
                  {text[key].paragraphs.map((paragraph, i) => (
                    <p key={i}>{rich(paragraph, elements)}</p>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
