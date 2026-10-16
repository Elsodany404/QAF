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
import Link from "next/link";
import { useSession } from "@/lib/auth-client";

function UserSideBar({ user }: { user: User }) {
  const router = useRouter();
  const { refetch } = useSession();

  async function handleSignOut() {
    const res = await signOut();
    if (res.status === "failed") {
      toast.error(res.message);
      return;
    }
    toast.success(res.message);
    await refetch(); // the navbar reads the session through useSession()
    router.replace("/");
    router.refresh();
  }
  const memberSince = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-GB", {
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
            <p className={styles.profileSince}>Member since {memberSince}</p>
          )}
          {user.role === "admin" && (
            <span className={styles.adminBadge}>Admin</span>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <nav className={styles.quickNav}>
        <p className={styles.quickNavLabel}>Quick Links</p>
        {[
          { href: "/menu", Icon: Coffee, label: "Shop Coffee" },
          { href: "/contact", Icon: MessageCircle, label: "Contact Us" },
          ...(user.role === "admin"
            ? [
                {
                  href: "/admin/dashboard",
                  Icon: UserIcon,
                  label: "Dashboard",
                },
              ]
            : []),
        ].map(({ href, Icon, label }) => (
          <Link key={href} href={href} className={styles.quickLink}>
            <Icon size={16} aria-hidden="true" />
            {label}
            <ArrowRight
              size={16}
              className={styles.quickLinkArrow}
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
        <LogOut size={16} aria-hidden="true" />
        Sign Out
      </button>
    </aside>
  );
}

export default UserSideBar;
