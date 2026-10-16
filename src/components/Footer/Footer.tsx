"use client";

import { startTransition, useActionState, useEffect, useRef } from "react";
import { Coffee, Mail, Phone, MapPin, ArrowRight } from "lucide-react";
import styles from "./Footer.module.css";
import { SiInstagram, SiFacebook } from "@icons-pack/react-simple-icons";
import Link from "next/link";
import subscribeToNewsletter from "@/actions/subscribeToNewsletter";
import { HONEYPOT_FIELD } from "@/lib/honeypot";
import type { ActionState } from "@/types/customTypes";

const initialState: ActionState = { status: "idle", message: "" };

export default function Footer() {
  const [state, formAction, isPending] = useActionState(
    subscribeToNewsletter,
    initialState,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") formRef.current?.reset();
  }, [state]);

  function handleSubscribe(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => formAction(formData));
  }

  return (
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
              ref={formRef}
              className={styles.form}
              onSubmit={handleSubscribe}
            >
              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                className={styles.input}
                aria-label="Your email address"
                autoComplete="email"
                maxLength={254}
                required
              />
              <input
                type="text"
                name={HONEYPOT_FIELD}
                className={styles.honeypot}
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
              />
              <button
                type="submit"
                className={styles.button}
                aria-label="Join the newsletter"
                disabled={isPending}
              >
                <ArrowRight size={20} aria-hidden="true" />
              </button>
            </form>
            <p className={styles.formMessage} role="status">
              {state.message}
            </p>
          </div>
        </div>
      </div>

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
