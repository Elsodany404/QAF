import { Coffee, Mail, Phone, MapPin } from "lucide-react";
import styles from "./Footer.module.css";
import { SiInstagram, SiFacebook } from "@icons-pack/react-simple-icons";
import Link from "next/link";

export default function Footer() {
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
                <p className={styles.brandTitle}>Qaf Coffee</p>
                <p className={styles.brandSubtitle}>Artisan Roasters</p>
              </div>
            </div>
            <p className={styles.brandDescription}>
              Small-batch roasted coffee from the world&apos;s finest origins.
              Crafted with passion, served with purpose.
            </p>
            <div className={styles.socials}>
              {[
                {
                  Icon: SiInstagram,
                  label: "Qaf Coffee on Instagram",
                  href: "https://www.instagram.com/qafcoffeebn/",
                },
                {
                  Icon: SiFacebook,
                  label: "Qaf Coffee on Facebook",
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
            <h4 className={styles.sectionHeading}>Contact</h4>
            <ul className={styles.contactList}>
              <li className={styles.contactItem}>
                <MapPin aria-hidden="true" />
                <span>C8, 10th of Ramadan, Al-Sharqya, Egypt</span>
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
            &copy; {new Date().getFullYear()} Qaf Coffee Co. All rights
            reserved.
          </p>
          <div className={styles.legalLinks}>
            <Link
              href="/policies#privacy-policy"
              className={styles.legalLink}
            >
              Privacy Policy
            </Link>
            <Link
              href="/policies#delivery-shipping-policy"
              className={styles.legalLink}
            >
              Delivery &amp; Shipping
            </Link>
            <Link
              href="/policies#return-refund-policy"
              className={styles.legalLink}
            >
              Returns &amp; Refunds
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
