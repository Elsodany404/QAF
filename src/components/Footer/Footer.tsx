"use client"
import { Coffee, Mail, Phone, MapPin, ArrowRight } from "lucide-react";
import styles from "./Footer.module.css";
import { SiInstagram, SiFacebook, SiX } from "@icons-pack/react-simple-icons";
import { useRouter } from "next/navigation";
export default function Footer() {
  const router = useRouter();
  return (
    <footer className={styles.footer}>
      <div className={styles.newsletterSection}>
        <div className={styles.newsletterInner}>
          <div className={styles.newsletterCopy}>
            <h3 className={styles.title}>Join Our Coffee Community</h3>
            <p className={styles.description}>
              Get exclusive blends, brewing tips, and roasting stories delivered
              to your inbox.
            </p>
            <div className={styles.form}>
              <input
                type="email"
                placeholder="Enter your email"
                className={styles.input}
              />
              <button className={styles.button}>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.mainFooter}>
        <div className={styles.grid}>
          <div>
            <div className={styles.brandWrap}>
              <div className={styles.brandIcon}>
                <Coffee className="w-5 h-5" />
              </div>
              <div>
                <p className={styles.brandTitle}>Qaf Coffee</p>
                <p className={styles.brandSubtitle}>Artisan Roasters</p>
              </div>
            </div>
            <p className={styles.brandDescription}>
              Small-batch roasted coffee from the world finest origins.
              Crafted with passion, served with purpose.
            </p>
            <div className={styles.socials}>
              {[
                { Icon: SiInstagram, href: "#instagram" },
                { Icon: SiFacebook, href: "#facebook" },
                { Icon: SiX, href: "#X" },
              ].map(({ Icon, href }) => (
                <a
                  key={href}
                  href={href}
                  className={styles.socialLink}
                  aria-label="Social link"
                >
                  <Icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className={styles.sectionHeading}>Shop</h4>
            <ul className={styles.linkList}>
              {[
                "Turkish Coffee",
                "Espresso Blends",
                "Flavored Coffee",
                "All Products",
              ].map((item) => (
                <li key={item}>
                  <button
                    onClick={() => router.push("/menu")}
                    className={styles.linkButton}
                  >
                    <span className="flex items-center gap-1">
                      {item}
                      <ArrowRight className={styles.linkIcon} />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className={styles.sectionHeading}>Company</h4>
            <ul className={styles.linkList}>
              {["Our Story", "Sourcing", "Sustainability", "Contact"].map(
                (item) => (
                  <li key={item}>
                    <button
                      onClick={() => router.push("/about")}
                      className={styles.linkButton}
                    >
                      <span className="flex items-center gap-1">
                        {item}
                        <ArrowRight className={styles.linkIcon} />
                      </span>
                    </button>
                  </li>
                ),
              )}
            </ul>
          </div>

          <div>
            <h4 className={styles.sectionHeading}>Contact</h4>
            <ul className={styles.contactList}>
              <li className={styles.contactItem}>
                <MapPin className="w-5 h-5" />
                <span>Cairo, Egypt</span>
              </li>
              <li className={styles.contactItem}>
                <Phone className="w-5 h-5" />
                <span>+20 100 000 0000</span>
              </li>
              <li className={styles.contactItem}>
                <Mail className="w-5 h-5" />
                <span>hello@qafcoffee.com</span>
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
            <a href="#" className={styles.legalLink}>
              Privacy Policy
            </a>
            <a href="#" className={styles.legalLink}>
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
