import { Mail, Phone, MapPin, Clock, MessageCircle } from "lucide-react";
import styles from "./page.module.css";
import ContactForm from "@/components/ContactForm/ContactForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with Qaf Coffee for product questions, orders, and delivery support.",
};

export default function Contact() {
  return (
    <div className={styles.page}>
      {/* Hero */}
      <div className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.heroBadge}>
            <p className={styles.heroBadgeText}>We&apos;re here for you</p>
          </div>
          <h1 className={styles.heroTitle}>
            Let&apos;s Talk{" "}
            <span className={styles.heroTitleAccent}>Coffee</span>
          </h1>
          <p className={styles.heroText}>
            Questions about an order, a product, or just want to say hello? Our
            team is ready to help.
          </p>
        </div>
      </div>

      {/* Main content */}
      <section className={styles.section}>
        <div className={styles.glow} />
        <div className={styles.glowLeft} />
        <div className={styles.container}>
          <div className={styles.layout}>
            {/* Left — contact info */}
            <aside className={styles.info}>
              <div className={styles.infoCard}>
                <h2 className={styles.infoTitle}>Contact Details</h2>
                <p className={styles.infoSubtitle}>
                  Qaf Coffee is based at C8, 10th of Ramadan, Al-Sharqya, Egypt.
                  Our team can help with product questions, orders, and delivery
                  support.
                </p>

                <ul className={styles.contactList}>
                  <li className={styles.contactItem}>
                    <span className={styles.contactIcon}>
                      <MapPin className="w-5 h-5" />
                    </span>
                    <div>
                      <p className={styles.contactLabel}>Address</p>
                      <p className={styles.contactValue}>
                        C8, 10th of Ramadan, Al-Sharqya, Egypt
                      </p>
                    </div>
                  </li>

                  <li className={styles.contactItem}>
                    <span className={styles.contactIcon}>
                      <Phone className="w-5 h-5" />
                    </span>
                    <div>
                      <p className={styles.contactLabel}>Phone</p>
                      <a href="tel:01031200143" className={styles.contactValue}>
                        01031200143
                      </a>
                    </div>
                  </li>

                  <li className={styles.contactItem}>
                    <span className={styles.contactIcon}>
                      <Mail className="w-5 h-5" />
                    </span>
                    <div>
                      <p className={styles.contactLabel}>Email</p>
                      <a
                        href="mailto:sales@qafcoffee.store"
                        className={styles.contactValue}
                      >
                        sales@qafcoffee.store
                      </a>
                    </div>
                  </li>

                  <li className={styles.contactItem}>
                    <span className={styles.contactIcon}>
                      <Clock className="w-5 h-5" />
                    </span>
                    <div>
                      <p className={styles.contactLabel}>Business Hours</p>
                      <p className={styles.contactValue}>
                        Sat – Thu, 9 am – 6 pm EET
                      </p>
                    </div>
                  </li>
                </ul>

                <a
                  href="https://wa.me/201031200143?text=Hello%20Qaf%20Coffee%2C%20I%20would%20like%20to%20get%20in%20touch."
                  target="_blank"
                  rel="noreferrer"
                  className={styles.whatsappButton}
                >
                  <MessageCircle className="w-5 h-5" />
                  Chat on WhatsApp
                </a>
              </div>
            </aside>

            {/* Right — form */}
            <div className={styles.formWrap}>
              <ContactForm />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
