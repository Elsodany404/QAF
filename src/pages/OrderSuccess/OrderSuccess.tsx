import { CheckCircle, ArrowRight, Package, Truck, Mail } from "lucide-react";
import styles from "./OrderSuccess.module.css";

export default function OrderSuccess() {
  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.iconWrap}>
            <CheckCircle className="w-12 h-12" />
          </div>

          <h1 className={styles.title}>Order Confirmed!</h1>
          <p className={styles.message}>
            Thank you for your purchase. We're roasting your coffee now.
          </p>
          <p className={styles.orderId}>
            Order ID:{" "}
            <span className={styles.orderIdValue}>
              {orderId.slice(0, 8).toUpperCase()}
            </span>
          </p>
        </div>

        <div className={styles.steps}>
          {[
            {
              Icon: Mail,
              title: "Confirmation Email",
              desc: "Check your inbox for order details",
            },
            {
              Icon: Package,
              title: "Roasting & Packaging",
              desc: "Freshly roasted within 24 hours",
            },
            {
              Icon: Truck,
              title: "Fast Delivery",
              desc: "Ships within 2-5 business days",
            },
          ].map(({ Icon, title, desc }) => (
            <div key={title} className={styles.stepCard}>
              <div className={styles.stepIcon}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <p className={styles.stepTitle}>{title}</p>
                <p className={styles.stepDesc}>{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.tipCard}>
          <p className={styles.tipTitle}>Brewing tip from our roasters:</p>
          <p className={styles.tipText}>
            Let your coffee rest for 7 days after roasting to reach peak flavor.
            Quality takes time!
          </p>
        </div>

        <button onClick={onContinue} className={styles.continueButton}>
          Continue Shopping
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
