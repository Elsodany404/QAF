
import Image from "next/image";
import { Zap } from "lucide-react";

import styles from "./CTASection.module.css";

import callToActionPhoto from "@/assets/images/cta_section_photo.jpg";
import Link from "next/link";

function CTASection() {
  return (
    <section className={styles.ctaSection}>
      <Image
        src={callToActionPhoto}
        alt="Coffee"
        placeholder="blur"
        className={styles.ctaBackground}
        fill
        sizes="100vw"
      />

      <div className={styles.ctaOverlay} />
      <div className={styles.ctaOverlaySoft} />

      <div className={styles.ctaContent}>
        <h2 className={styles.ctaTitle}>Ready for Extraordinary?</h2>

        <p className={styles.ctaText}>
          Experience the difference that small-batch roasting, ethical sourcing,
          and pure passion make.
        </p>

        <Link  href={"/menu"} className={styles.ctaButton}>
          <Zap className={styles.ctaIcon} />
          <span>Shop Now</span>
        </Link>
      </div>
    </section>
  );
}

export default CTASection;
