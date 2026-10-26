import { Shield, Truck, RotateCcw } from "lucide-react";
import styles from "./page.module.css";
import type { Metadata } from "next";
import Link from "next/link";
import { SHOP_WHATSAPP_DISPLAY, shopWhatsAppUrl } from "@/lib/whatsapp";

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
      "Online card payments are handled by our payment provider, Paymob, and card details are never stored by Qaf Coffee. Your name, phone number, and address are shared with our courier, Bosta, only to deliver your order.",
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
        Returns and refunds are handled personally on WhatsApp at{" "}
        <a href={shopWhatsAppUrl()} target="_blank" rel="noreferrer">
          {SHOP_WHATSAPP_DISPLAY}
        </a>
        . Message us with your order number and we&apos;ll take it from there.
      </>,
      <>
        If you paid in cash on delivery, or haven&apos;t paid yet, you can
        cancel an order from <Link href="/user">your account</Link> while it is
        still being prepared, before it is handed to the courier. If you paid
        online, message us on WhatsApp to cancel it and we&apos;ll arrange your
        refund. Once the courier has the order, it can no longer be cancelled.
      </>,
      "If something is wrong with a delivered order (damaged, incorrect, or materially different from what you ordered), message us on WhatsApp within 48 hours of delivery, with photos of the problem if you can. We review every request and agree the next step with you, whether a return, a replacement or a refund.",
      "Refunds are arranged with you directly on WhatsApp. Nothing is refunded automatically through the website.",
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
