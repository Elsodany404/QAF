import styles from "./UserPage.module.css";
import Link from "next/link";
import type { OrderQuery, User } from "@/types/customTypes";
import UserSideBar from "../UserSideBar/UserSideBar";
import {
  BadgeCheck,
  Clock3,
  Mail,
  PackageCheck,
  ShoppingBag,
  UserRound,
} from "lucide-react";
import OrdersList from "../OrdersList/OrderList";
import ProfileEditor from "./ProfileEditor";
import { getDisplayStatus } from "@/lib/orderStatus";

export default function UserPage({
  user,
  orders,
}: {
  user: User;
  orders: OrderQuery[];
}) {
  const statuses = orders.map(getDisplayStatus);
  const activeOrders = statuses.filter(
    (status) =>
      status !== "delivered" &&
      status !== "cancelled" &&
      status !== "refund_due" &&
      status !== "returned",
  ).length;
  const deliveredOrders = statuses.filter(
    (status) => status === "delivered",
  ).length;

  return (
    <div className={styles.page}>
      {/* ── Hero strip ─────────────────────────────────────────────── */}
      <div className={styles.hero}>
        <div className={styles.glow} />
        <div className={styles.heroContent}>
          <div className={styles.heroBadge}>
            <p className={styles.heroBadgeText}>My Account</p>
          </div>
          <h1 className={styles.heroTitle}>
            Welcome back,{" "}
            <span className={styles.heroTitleAccent}>
              {user.name ?? "Coffee Lover"}
            </span>
          </h1>
        </div>
      </div>

      <div className={styles.container}>
        <div className={styles.layout}>
          {/* ── Left column ──────────────────────────────────────────── */}
          <UserSideBar user={user} />

          {/* ── Right column ─────────────────────────────────────────── */}
          <main className={styles.main}>
            <section className={styles.overview} aria-label="Account overview">
              <div className={styles.overviewItem}>
                <ShoppingBag aria-hidden="true" />
                <div>
                  <span className={styles.overviewValue}>{orders.length}</span>
                  <span className={styles.overviewLabel}>Orders placed</span>
                </div>
              </div>
              <div className={styles.overviewItem}>
                <Clock3 aria-hidden="true" />
                <div>
                  <span className={styles.overviewValue}>{activeOrders}</span>
                  <span className={styles.overviewLabel}>In progress</span>
                </div>
              </div>
              <div className={styles.overviewItem}>
                <PackageCheck aria-hidden="true" />
                <div>
                  <span className={styles.overviewValue}>
                    {deliveredOrders}
                  </span>
                  <span className={styles.overviewLabel}>Delivered</span>
                </div>
              </div>
            </section>

            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <UserRound aria-hidden="true" />
                <h2 className={styles.sectionTitle}>Profile details</h2>
                <span
                  className={
                    user.emailVerified ? styles.verified : styles.unverified
                  }
                >
                  <BadgeCheck aria-hidden="true" />
                  {user.emailVerified ? "Email verified" : "Email not verified"}
                </span>
              </div>
              <ProfileEditor initialName={user.name} />
            </section>

            {/* Orders section */}
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <ShoppingBag className="w-5 h-5" />
                <h2 className={styles.sectionTitle}>Your Orders</h2>
              </div>

              <OrdersList orders={orders} />
            </section>

            {/* Contact info section */}
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <Mail className="w-5 h-5" />
                <h2 className={styles.sectionTitle}>Need Help?</h2>
              </div>
              <div className={styles.helpCard}>
                <p className={styles.helpText}>
                  For order issues, returns, or any questions reach out to our
                  team — we respond within one business day.
                </p>
                <div className={styles.helpLinks}>
                  <Link href="/contact" className={styles.helpLink}>
                    Send us a message
                  </Link>
                  <a
                    href="https://wa.me/201031200143"
                    target="_blank"
                    rel="noreferrer"
                    className={styles.helpLink}
                  >
                    WhatsApp: +20 103 120 0143
                  </a>
                </div>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
