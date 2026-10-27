import styles from "./UserPage.module.css";
import Link from "@/i18n/Link";
import { rich } from "@/i18n/rich";
import { getI18n } from "@/i18n/server";
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
import OrdersList from "../OrdersList/OrdersList";
import ProfileEditor from "./ProfileEditor";
import { getDisplayStatus } from "@/lib/orderStatus";
import { SHOP_WHATSAPP_DISPLAY, shopWhatsAppUrl } from "@/lib/whatsapp";

export default async function UserPage({
  user,
  orders,
}: {
  user: User;
  orders: OrderQuery[];
}) {
  const { t } = await getI18n();
  const text = t.account;
  const statuses = orders.map(getDisplayStatus);
  const activeOrders = statuses.filter(
    (status) =>
      status !== "delivered" && status !== "cancelled" && status !== "returned",
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
            <p className={styles.heroBadgeText}>{text.badge}</p>
          </div>
          <h1 className={styles.heroTitle}>
            {text.welcome}{" "}
            <span className={styles.heroTitleAccent}>
              {user.name || text.fallbackName}
            </span>
          </h1>
        </div>
      </div>

      <div className={styles.container}>
        <div className={styles.layout}>
          {/* ── Left column ──────────────────────────────────────────── */}
          <UserSideBar user={user} />

          {/* ── Right column ─────────────────────────────────────────── */}
          <div className={styles.main}>
            <section className={styles.overview} aria-label={text.overview}>
              <div className={styles.overviewItem}>
                <ShoppingBag aria-hidden="true" />
                <div>
                  <span className={styles.overviewValue}>{orders.length}</span>
                  <span className={styles.overviewLabel}>
                    {text.ordersPlaced}
                  </span>
                </div>
              </div>
              <div className={styles.overviewItem}>
                <Clock3 aria-hidden="true" />
                <div>
                  <span className={styles.overviewValue}>{activeOrders}</span>
                  <span className={styles.overviewLabel}>{text.inProgress}</span>
                </div>
              </div>
              <div className={styles.overviewItem}>
                <PackageCheck aria-hidden="true" />
                <div>
                  <span className={styles.overviewValue}>
                    {deliveredOrders}
                  </span>
                  <span className={styles.overviewLabel}>{text.delivered}</span>
                </div>
              </div>
            </section>

            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <UserRound aria-hidden="true" />
                <h2 className={styles.sectionTitle}>{text.profileTitle}</h2>
                <span
                  className={
                    user.emailVerified ? styles.verified : styles.unverified
                  }
                >
                  <BadgeCheck aria-hidden="true" />
                  {user.emailVerified ? text.emailVerified : text.emailNotVerified}
                </span>
              </div>
              <ProfileEditor initialName={user.name} />
            </section>

            {/* Orders section */}
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <ShoppingBag aria-hidden="true" />
                <h2 className={styles.sectionTitle}>{text.ordersTitle}</h2>
              </div>

              <OrdersList orders={orders} />
            </section>

            {/* Contact info section */}
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <Mail aria-hidden="true" />
                <h2 className={styles.sectionTitle}>{text.helpTitle}</h2>
              </div>
              <div className={styles.helpCard}>
                <p className={styles.helpText}>{text.helpText}</p>
                <div className={styles.helpLinks}>
                  <a
                    href={shopWhatsAppUrl()}
                    target="_blank"
                    rel="noreferrer"
                    className={styles.helpLink}
                  >
                    {rich(text.whatsapp, {
                      // Keeps "+20 103 …" in order inside Arabic text.
                      number: <span dir="ltr">{SHOP_WHATSAPP_DISPLAY}</span>,
                    })}
                  </a>
                  <Link href="/contact" className={styles.helpLink}>
                    {text.sendMessage}
                  </Link>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
