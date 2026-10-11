import { Shield, Truck, RotateCcw } from "lucide-react";
import styles from "./page.module.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Policies",
  description:
    "Privacy policy, delivery & shipping policy, and return & refund policy for Qaf Coffee.",
};

const policies = [
  {
    id: "privacy-policy",
    Icon: Shield,
    title: "Privacy Policy",
    content: [
      "We collect the name, email, phone number, and delivery address needed to process and deliver orders. Payment details are handled by our payment provider and are not stored by Qaf Coffee. We use order information for payment confirmation, preparation, delivery, support, and legal requirements. We do not sell customer information.",
      <>
        Privacy questions can be sent to{" "}
        <a href="mailto:sales@qafcoffee.store">sales@qafcoffee.store</a>.
      </>,
    ],
  },
  {
    id: "delivery-shipping-policy",
    Icon: Truck,
    title: "Delivery & Shipping Policy",
    content: [
      "Orders are prepared and dispatched within 24 hours on business days. Delivery normally takes 24 to 48 hours after dispatch, depending on the destination and courier availability. Delivery fees are shown at checkout before payment.",
      "Customers should provide an accurate phone number and address. If a delivery attempt is missed, the courier may contact the customer to arrange another attempt.",
    ],
  },
  {
    id: "return-refund-policy",
    Icon: RotateCcw,
    title: "Return & Refund Policy",
    content: [
      <>
        We do not offer order cancellations through the website. To request a
        return, contact us on{" "}
        <a
          href="https://wa.me/201031200143?text=Hello%20Qaf%20Coffee%2C%20I%20would%20like%20to%20request%20a%20return."
          target="_blank"
          rel="noreferrer"
        >
          WhatsApp at +20 103 120 0143
        </a>{" "}
        and include your order number and photos when relevant.
      </>,
      <>
        We will check the order and review the return request. If it is
        approved, we will refund the customer through the original payment
        method. For damaged, incorrect, or materially different orders, please
        contact us within 48 hours through{" "}
        <a
          href="https://wa.me/201031200143?text=Hello%20Qaf%20Coffee%2C%20I%20need%20help%20with%20a%20return%20or%20a%20damaged%20order."
          target="_blank"
          rel="noreferrer"
        >
          WhatsApp
        </a>{" "}
        with the order number and photos.
      </>,
    ],
  },
] as const;

export default function Policies() {
  return (
    <div className={styles.page}>
      {/* Hero */}
      <div className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.heroBadge}>
            <p className={styles.heroBadgeText}>Customer Information</p>
          </div>
          <h1 className={styles.heroTitle}>Our Policies</h1>
          <p className={styles.heroText}>
            Everything you need to know about privacy, delivery, and returns —
            all in one place.
          </p>
        </div>
      </div>

      {/* Policy cards */}
      <section className={styles.section}>
        <div className={styles.glow} />
        <div className={styles.container}>
          <div className={styles.grid}>
            {policies.map(({ id, Icon, title, content }) => (
              <article id={id} key={id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardIcon}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h2 className={styles.cardTitle}>{title}</h2>
                </div>
                <div className={styles.cardBody}>
                  {content.map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
