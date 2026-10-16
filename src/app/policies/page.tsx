import { Shield, Truck, RotateCcw } from "lucide-react";
import styles from "./page.module.css";
import type { Metadata } from "next";
import Link from "next/link";

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
      "We collect the name, email, phone number, and delivery address needed to process and deliver orders, plus the account details you choose to create. We use this information for payment confirmation, preparation, delivery, order updates by email, support, and legal requirements. We do not sell customer information.",
      "Online card payments are handled by our payment provider, Paymob, and card details are never stored by Qaf Coffee. Your name, phone number, and address are shared with our courier, Bosta, only to deliver your order. If you join our newsletter, we keep your email address to send you coffee news and offers, and you can ask us to remove it at any time.",
      "Signing in uses a cookie to keep your session active for up to 30 days. It is required for your account to work and is not used for advertising.",
      <>
        Privacy questions, or requests to view or delete your data, can be sent
        to <a href="mailto:sales@qafcoffee.store">sales@qafcoffee.store</a>.
      </>,
    ],
  },
  {
    id: "delivery-shipping-policy",
    Icon: Truck,
    title: "Delivery & Shipping Policy",
    content: [
      "We deliver across Egypt through our courier partner, Bosta, to the cities and districts listed at checkout. Orders are prepared and dispatched within 24 hours on business days. Delivery normally takes 24 to 48 hours after dispatch, depending on the destination and courier availability.",
      "Delivery fees depend on your city and payment method and are shown at checkout before you place your order. You can pay online by card or in cash on delivery. Cash on delivery is available for orders up to 30,000 EGP including delivery; larger orders must be paid online.",
      "Customers should provide an accurate phone number and address. If a delivery attempt is missed, the courier may contact the customer to arrange another attempt.",
    ],
  },
  {
    id: "return-refund-policy",
    Icon: RotateCcw,
    title: "Return & Refund Policy",
    content: [
      <>
        You can cancel an order from <Link href="/user">your account</Link>{" "}
        while it is still being prepared, before it is handed to the courier. If
        you paid online, the payment is refunded to your original payment method
        automatically. Once the order has been picked up by the courier, it can
        no longer be cancelled, but you can request a return.
      </>,
      <>
        To request a return, contact us on{" "}
        <a
          href="https://wa.me/201031200143?text=Hello%20Qaf%20Coffee%2C%20I%20would%20like%20to%20request%20a%20return."
          target="_blank"
          rel="noreferrer"
        >
          WhatsApp at +20 103 120 0143
        </a>{" "}
        and include your order number and photos when relevant. For damaged,
        incorrect, or materially different orders, please contact us within 48
        hours of delivery.
      </>,
      "We will check the order and review the return request. If it is approved, we will refund the customer through the original payment method. Cash on delivery orders are refunded by a method we agree on with you.",
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
                    <Icon aria-hidden="true" />
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
