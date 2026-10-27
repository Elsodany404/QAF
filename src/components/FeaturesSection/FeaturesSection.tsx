import { Award, Globe, Leaf } from "lucide-react";

import { getI18n } from "@/i18n/server";
import styles from "./FeaturesSection.module.css";

// In the order of the features in the dictionary.
const ICONS = [Globe, Award, Leaf];

async function Features() {
  const { t } = await getI18n();

  return (
    <section className="sectionDark">
      <div className="glowDark" />

      <div className="container">
        <div className={styles.valuesGrid}>
          {t.home.features.map(({ title, description }, index) => {
            const Icon = ICONS[index];
            return (
              <div
                key={title}
                className={styles.valueCard}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={styles.valueIcon}>
                  <Icon />
                </div>

                <h3 className={styles.valueTitle}>{title}</h3>

                <p className={styles.valueDesc}>{description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default Features;
