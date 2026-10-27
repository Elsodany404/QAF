import Image from "next/image";
import { Zap } from "lucide-react";

import { getI18n } from "@/i18n/server";
import styles from "./CTASection.module.css";

import callToActionPhoto from "@/assets/images/cta_section_photo.jpg";
import Link from "@/i18n/Link";

async function CTASection() {
  const { t } = await getI18n();
  const cta = t.home.cta;

  return (
    <section className={styles.ctaSection}>
      <Image
        src={callToActionPhoto}
        alt={cta.imageAlt}
        placeholder="blur"
        className={styles.ctaBackground}
        fill
        sizes="100vw"
      />

      <div className={styles.ctaOverlay} />
      <div className={styles.ctaOverlaySoft} />

      <div className={styles.ctaContent}>
        <h2 className={styles.ctaTitle}>{cta.title}</h2>

        <p className={styles.ctaText}>{cta.text}</p>

        <Link href={"/menu"} className={styles.ctaButton}>
          <Zap className={styles.ctaIcon} />
          <span>{cta.button}</span>
        </Link>
      </div>
    </section>
  );
}

export default CTASection;
