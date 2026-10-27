import { Coffee, Mail, Phone, MapPin } from "lucide-react";
import styles from "./Footer.module.css";
import { SiInstagram, SiFacebook } from "@icons-pack/react-simple-icons";
import Link from "@/i18n/Link";
import { format } from "@/i18n/format";
import { getI18n } from "@/i18n/server";

export default async function Footer() {
  const { t } = await getI18n();
  const footer = t.footer;

  return (
    <footer className={styles.footer}>
      <div className={styles.mainFooter}>
        <div className={styles.grid}>
          <div>
            <div className={styles.brandWrap}>
              <div className={styles.brandIcon}>
                <Coffee aria-hidden="true" />
              </div>
              <div>
                <p className={styles.brandTitle}>{t.common.brand}</p>
                <p className={styles.brandSubtitle}>{footer.subtitle}</p>
              </div>
            </div>
            <p className={styles.brandDescription}>{footer.description}</p>
            <div className={styles.socials}>
              {[
                {
                  Icon: SiInstagram,
                  label: footer.instagram,
                  href: "https://www.instagram.com/qafcoffeebn/",
                },
                {
                  Icon: SiFacebook,
                  label: footer.facebook,
                  href: "https://www.facebook.com/QAFCOFFEE/?locale=ar_AR",
                },
              ].map(({ Icon, label, href }) => (
                <a
                  key={href}
                  href={href}
                  className={styles.socialLink}
                  aria-label={label}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Icon aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className={styles.sectionHeading}>{footer.contact}</h4>
            <ul className={styles.contactList}>
              <li className={styles.contactItem}>
                <MapPin aria-hidden="true" />
                <span>{t.common.address}</span>
              </li>
              <li className={styles.contactItem}>
                <Phone aria-hidden="true" />
                <a href="tel:+201031200143">01031200143</a>
              </li>
              <li className={styles.contactItem}>
                <Mail aria-hidden="true" />
                <a href="mailto:sales@qafcoffee.store">
                  sales@qafcoffee.store
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className={styles.bottomBar}>
          <p className={styles.copyright}>
            {format(footer.copyright, { year: new Date().getFullYear() })}
          </p>
          <div className={styles.legalLinks}>
            <Link
              href="/policies#privacy-policy"
              className={styles.legalLink}
            >
              {footer.privacy}
            </Link>
            <Link
              href="/policies#delivery-shipping-policy"
              className={styles.legalLink}
            >
              {footer.delivery}
            </Link>
            <Link
              href="/policies#return-refund-policy"
              className={styles.legalLink}
            >
              {footer.returns}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
