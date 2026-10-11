import { Award, Globe, Leaf } from "lucide-react";

import styles from "./FeaturesSection.module.css";

const FEATURES = [
  {
    Icon: Globe,
    title: "Ethically Sourced",
    desc: "Direct relationships with farmers in Ethiopia, Colombia, and Yemen ensure fair trade and exceptional quality.",
  },
  {
    Icon: Award,
    title: "Master Roasted",
    desc: "Q-certified roasters bring precision and passion to every batch, unlocking peak flavor potential.",
  },
  {
    Icon: Leaf,
    title: "Sustainable",
    desc: "Carbon-neutral shipping, compostable packaging, and forest restoration in every order.",
  },
];

function Features() {
  return (
    <section className="sectionDark">
      <div className="glowDark" />

      <div className="container">
        <div className={styles.valuesGrid}>
          {FEATURES.map(({ Icon, title, desc }, index) => (
            <div
              key={title}
              className={styles.valueCard}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className={styles.valueIcon}>
                <Icon />
              </div>

              <h3 className={styles.valueTitle}>{title}</h3>

              <p className={styles.valueDesc}>{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Features;
