import { Mail, Phone, MapPin, Clock, MessageCircle } from "lucide-react";
import styles from "./page.module.css";
import ContactForm from "@/components/ContactForm/ContactForm";
import { alternates } from "@/i18n/metadata";
import { getI18n } from "@/i18n/server";
import { shopWhatsAppUrl } from "@/lib/whatsapp";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const { locale, t } = await getI18n();
  return {
    title: t.contact.metaTitle,
    description: t.contact.metaDescription,
    alternates: alternates(locale, "/contact"),
  };
}

export default async function Contact() {
  const { t } = await getI18n();
  const text = t.contact;

  return (
    <div className={styles.page}>
      {/* Hero */}
      <div className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.heroBadge}>
            <p className={styles.heroBadgeText}>{text.badge}</p>
          </div>
          <h1 className={styles.heroTitle}>
            {text.titleStart}{" "}
            <span className={styles.heroTitleAccent}>{text.titleAccent}</span>
          </h1>
          <p className={styles.heroText}>{text.text}</p>
        </div>
      </div>

      {/* Main content */}
      <section className={styles.section}>
        <div className={styles.glow} />
        <div className={styles.glowLeft} />
        <div className={styles.container}>
          <div className={styles.layout}>
            {/* Start (left in English) — contact info */}
            <aside className={styles.info}>
              <div className={styles.infoCard}>
                <h2 className={styles.infoTitle}>{text.detailsTitle}</h2>
                <p className={styles.infoSubtitle}>{text.detailsText}</p>

                <ul className={styles.contactList}>
                  <li className={styles.contactItem}>
                    <span className={styles.contactIcon}>
                      <MapPin aria-hidden="true" />
                    </span>
                    <div>
                      <p className={styles.contactLabel}>{text.address}</p>
                      <p className={styles.contactValue}>{t.common.address}</p>
                    </div>
                  </li>

                  <li className={styles.contactItem}>
                    <span className={styles.contactIcon}>
                      <Phone aria-hidden="true" />
                    </span>
                    <div>
                      <p className={styles.contactLabel}>{text.phone}</p>
                      <a href="tel:+201031200143" className={styles.contactValue}>
                        01031200143
                      </a>
                    </div>
                  </li>

                  <li className={styles.contactItem}>
                    <span className={styles.contactIcon}>
                      <Mail aria-hidden="true" />
                    </span>
                    <div>
                      <p className={styles.contactLabel}>{text.email}</p>
                      <a
                        href="mailto:sales@qafcoffee.store"
                        className={styles.contactValue}
                      >
                        sales@qafcoffee.store
                      </a>
                    </div>
                  </li>

                  <li className={styles.contactItem}>
                    <span className={styles.contactIcon}>
                      <Clock aria-hidden="true" />
                    </span>
                    <div>
                      <p className={styles.contactLabel}>{text.hours}</p>
                      <p className={styles.contactValue}>{text.hoursValue}</p>
                    </div>
                  </li>
                </ul>

                <a
                  href={shopWhatsAppUrl(text.whatsappMessage)}
                  target="_blank"
                  rel="noreferrer"
                  className={styles.whatsappButton}
                >
                  <MessageCircle aria-hidden="true" />
                  {text.whatsapp}
                </a>
              </div>
            </aside>

            {/* End — form */}
            <div className={styles.formWrap}>
              <ContactForm />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
