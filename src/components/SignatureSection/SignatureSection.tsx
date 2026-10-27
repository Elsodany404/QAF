import Image from "next/image";
import { ArrowRight } from "lucide-react";
import Link from "@/i18n/Link";
import { getI18n } from "@/i18n/server";
import styles from "./SignatureSection.module.css";

import signatureCoffeePhotoSmall from "@/assets/images/signature_coffee_photo_small.jpg";
import signatureCoffeePhotoBig from "@/assets/images/signature_coffee_photo_big.jpg";

async function SignatureSection() {
  const { t } = await getI18n();
  const signature = t.home.signature;

  return (
    <section className="section">
      <div className="glowLeft" />

      <div className="container">
        <div className={styles.signatureGrid}>
          <div className={styles.signatureCopy}>
            <div className={styles.signatureBadge}>
              <p className={styles.signatureBadgeText}>{signature.badge}</p>
            </div>

            <h2 className={styles.signatureTitle}>
              {signature.titleStart}{" "}
              <span className="titleAccent">{signature.titleAccent}</span>
            </h2>

            <p className={styles.signatureText}>{signature.text}</p>

            <div className={styles.blendList}>
              {signature.blends.map((blend) => (
                <div key={blend.name} className={styles.blendItem}>
                  <div className={styles.blendIcon}>◆</div>

                  <div>
                    <p className={styles.blendName}>{blend.name}</p>
                    <p className={styles.blendDesc}>{blend.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <Link href="/menu?category=turkish" className={styles.viewAllButton}>
              <span>{signature.shop}</span>
              <ArrowRight className={`${styles.viewAllIcon} flipRtl`} />
            </Link>
          </div>

          <div className={styles.imageStack}>
            <Image
              src={signatureCoffeePhotoBig}
              alt={signature.imageAlt}
              placeholder="blur"
              className={styles.imageMain}
            />

            <Image
              src={signatureCoffeePhotoSmall}
              alt={signature.secondImageAlt}
              placeholder="blur"
              className={styles.imageSecondary}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export default SignatureSection;
