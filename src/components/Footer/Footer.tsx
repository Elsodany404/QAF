"use client";

import { useState } from "react";
import { Coffee, Mail, Phone, MapPin, ArrowRight, X } from "lucide-react";
import styles from "./Footer.module.css";
import { SiInstagram, SiFacebook } from "@icons-pack/react-simple-icons";
import Link from "next/link";
export default function Footer() {
  const [contactOpen, setContactOpen] = useState(false);

  return (
    <>
      <footer className={styles.footer}>
        <div className={styles.newsletterSection}>
          <div className={styles.newsletterInner}>
            <div className={styles.newsletterCopy}>
              <h3 className={styles.title}>Join Our Coffee Community</h3>
              <p className={styles.description}>
                Get exclusive blends, brewing tips, and roasting stories
                delivered to your inbox.
              </p>
              <form
                className={styles.form}
                action="mailto:sales@qafcoffee.store"
                method="post"
                encType="text/plain"
              >
                <input
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  className={styles.input}
                  aria-label="Your email address"
                  required
                />
                <button
                  type="submit"
                  className={styles.button}
                  aria-label="Email Qaf Coffee"
                >
                  <ArrowRight className="w-5 h-5" />
                </button>
              </form>
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
                  {
                    Icon: SiInstagram,
                    href: "https://www.instagram.com/qafcoffeebn/",
                  },
                  {
                    Icon: SiFacebook,
                    href: "https://www.facebook.com/QAFCOFFEE/?locale=ar_AR",
                  },
                ].map(({ Icon, href }) => (
                  <a
                    key={href}
                    href={href}
                    className={styles.socialLink}
                    aria-label="Visit Qaf Coffee social page"
                    target={href.startsWith("http") ? "_blank" : undefined}
                    rel={href.startsWith("http") ? "noreferrer" : undefined}
                  >
                    <Icon className="w-5 h-5" />
                  </a>
                ))}
              </div>
            </div>

            <div>
              <h4 className={styles.sectionHeading}>Contact</h4>
              <ul className={styles.contactList}>
                <li className={styles.contactItem}>
                  <MapPin className="w-5 h-5" />
                  <span>C8, 10th of Ramadan, Al-sharqya, Egypt</span>
                </li>
                <li className={styles.contactItem}>
                  <Phone className="w-5 h-5" />
                  <a href="tel:01031200143">01031200143</a>
                </li>
                <li className={styles.contactItem}>
                  <Mail className="w-5 h-5" />
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
              <Link href="/about#privacy-policy" className={styles.legalLink}>
                Privacy Policy
              </Link>
              <Link
                href="/about#delivery-shipping-policy"
                className={styles.legalLink}
              >
                Delivery &amp; Shipping
              </Link>
              <Link
                href="/about#return-refund-policy"
                className={styles.legalLink}
              >
                Returns &amp; Refunds
              </Link>
            </div>
          </div>
        </div>
      </footer>

      {contactOpen && (
        <div
          className={styles.modalBackdrop}
          onClick={() => setContactOpen(false)}
        >
          <section
            className={styles.contactModal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="contact-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <div>
                <p className={styles.modalEyebrow}>Qaf Coffee</p>
                <h2 id="contact-title" className={styles.modalTitle}>
                  Contact Us
                </h2>
              </div>
              <button
                type="button"
                className={styles.modalClose}
                onClick={() => setContactOpen(false)}
                aria-label="Close contact dialog"
              >
                <X />
              </button>
            </div>
            <p className={styles.modalDescription}>
              We are happy to help with orders, products, and delivery
              questions.
            </p>
            <div className={styles.modalContactList}>
              <a
                href="mailto:sales@qafcoffee.store"
                className={styles.modalContactItem}
              >
                <Mail />
                <span>sales@qafcoffee.store</span>
              </a>
              <a href="tel:01031200143" className={styles.modalContactItem}>
                <Phone />
                <span>01031200143</span>
              </a>
              <div className={styles.modalContactItem}>
                <MapPin />
                <span>C8, 10th of Ramadan, Al-sharqya, Egypt</span>
              </div>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
