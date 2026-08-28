import Image from "next/image";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import styles from "./SignatureSection.module.css";

import signatureCoffeePhotoSmall from "@/assets/images/signature_coffee_photo_small.jpg";
import signatureCoffeePhotoBig from "@/assets/images/signature_coffee_photo_big.jpg";

const BLENDS = [
  {
    name: "Qaf Blend",
    desc: "Deep chocolate, rich body, our signature taste",
    icon: "◆",
  },
  {
    name: "Colombian Blend",
    desc: "Bright acidity, caramel sweetness, vibrant origin",
    icon: "◆",
  },
  {
    name: "Golden Blend",
    desc: "Honey, dried fruits, warming spice, our finest",
    icon: "◆",
  },
];

function SignatureSection() {
  return (
    <section className="section">
      <div className="glowLeft" />

      <div className="container">
        <div className={styles.signatureGrid}>
          <div className={styles.signatureCopy}>
            <div className={styles.signatureBadge}>
              <p className={styles.signatureBadgeText}>Our Signature</p>
            </div>

            <h2 className={styles.signatureTitle}>
              Turkish Coffee <span className="titleAccent">Reimagined</span>
            </h2>

            <p className={styles.signatureText}>
              Three distinct blends that honor centuries of tradition while
              pushing flavor boundaries. Each tells a story of origin, craft,
              and devotion.
            </p>

            <div className={styles.blendList}>
              {BLENDS.map((blend) => (
                <div key={blend.name} className={styles.blendItem}>
                  <div className={styles.blendIcon}>{blend.icon}</div>

                  <div>
                    <p className={styles.blendName}>{blend.name}</p>
                    <p className={styles.blendDesc}>{blend.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <Link type="button" href={"/menu"} className={styles.viewAllButton}>
              <span>Shop Turkish Coffee</span>
              <ArrowRight className={styles.viewAllIcon} />
            </Link>
          </div>

          <div className={styles.imageStack}>
            <Image
              src={signatureCoffeePhotoBig}
              alt="Turkish Coffee"
              placeholder="blur"
              className={styles.imageMain}
            />

            <Image
              src={signatureCoffeePhotoSmall}
              alt="Coffee beans"
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
