"use client";

import { User } from "@/types/customTypes";
import styles from "./UserSideBar.module.css";
import Image from "next/image";
import signOut from "@/actions/auth/signOut";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import defaultPhoto from "@/assets/images/user.png";
import {
  UserIcon,
  ArrowRight,
  LogOut,
  Coffee,
  MessageCircle,
} from "lucide-react";
import { INTL_LOCALE } from "@/i18n/config";
import { format } from "@/i18n/format";
import { useI18n } from "@/i18n/I18nProvider";
import Link from "@/i18n/Link";
import { useSession } from "@/lib/auth-client";

function UserSideBar({ user }: { user: User }) {
  const router = useRouter();
  const { locale, t, href } = useI18n();
  const text = t.sidebar;
  const { refetch } = useSession();

  async function handleSignOut() {
    const res = await signOut();
    if (res.status === "failed") {
      toast.error(res.message);
      return;
    }
    toast.success(res.message);
    await refetch(); // the navbar reads the session through useSession()
    router.replace(href("/"));
    router.refresh();
  }
  const memberSince = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString(INTL_LOCALE[locale], {
        month: "long",
        year: "numeric",
        // Fixed zone: rendered on the server and again in the browser.
        timeZone: "Africa/Cairo",
      })
    : null;

  return (
    <aside className={styles.sidebar}>
      {/* Profile card */}
      <div className={styles.profileCard}>
        <Image
          src={user.image || defaultPhoto}
          alt=""
          width={100}
          height={100}
        />
        <div className={styles.profileInfo}>
          {user.name && <p className={styles.profileName}>{user.name}</p>}
          <p className={styles.profileEmail}>{user.email}</p>
          {memberSince && (
            <p className={styles.profileSince}>
              {format(text.memberSince, { date: memberSince })}
            </p>
          )}
          {user.role === "admin" && (
            <span className={styles.adminBadge}>{text.admin}</span>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <nav className={styles.quickNav}>
        <p className={styles.quickNavLabel}>{text.quickLinks}</p>
        {[
          { path: "/menu", Icon: Coffee, label: text.shop },
          { path: "/contact", Icon: MessageCircle, label: text.contact },
          ...(user.role === "admin"
            ? [
                {
                  path: "/admin/dashboard",
                  Icon: UserIcon,
                  label: text.dashboard,
                },
              ]
            : []),
        ].map(({ path, Icon, label }) => (
          <Link key={path} href={path} className={styles.quickLink}>
            <Icon size={16} aria-hidden="true" />
            {label}
            <ArrowRight
              size={16}
              className={`${styles.quickLinkArrow} flipRtl`}
              aria-hidden="true"
            />
          </Link>
        ))}
      </nav>

      {/* Sign out */}
      <button
        type="button"
        onClick={handleSignOut}
        className={styles.signOutButton}
      >
        <LogOut size={16} className="flipRtl" aria-hidden="true" />
        {text.signOut}
      </button>
    </aside>
  );
}

export default UserSideBar;
