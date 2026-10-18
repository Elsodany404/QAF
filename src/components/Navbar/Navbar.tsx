"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Coffee, Menu, ShoppingCart, X } from "lucide-react";
import { toast } from "react-hot-toast";

import signOut from "@/actions/auth/signOut";
import { useCart } from "@/context/CartContext";
import { useSession } from "@/lib/auth-client";
import styles from "./Navbar.module.css";

const LINKS = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/menu" },
  { label: "About us", href: "/about" },
  { label: "Contact", href: "/contact" },
  { label: "Our Policies", href: "/policies" },
  { label: "Account", href: "/user" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  // Product pages belong to the shop.
  if (href === "/menu") {
    return pathname === "/menu" || pathname.startsWith("/products/");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { totalItems, openCart } = useCart();
  const { data: session, isPending, refetch } = useSession();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuPathname, setMenuPathname] = useState(pathname);
  const [instant, setInstant] = useState(false);

  // Any navigation (a link, the logo, the back button) closes the menu and
  // swaps the bar's look without the scroll fade.
  if (menuPathname !== pathname) {
    setMenuPathname(pathname);
    setMobileOpen(false);
    setInstant(true);
  }

  useEffect(() => {
    if (!instant) return;
    // Two frames so the new background is painted before the fade comes back.
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => setInstant(false));
    });
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  }, [instant]);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    handler(); // sync with the real scroll position on mount / route change
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, [pathname]);

  const signedIn = Boolean(session?.user?.id);
  const links =
    session?.user?.role === "admin"
      ? [...LINKS, { label: "Dashboard", href: "/admin/dashboard" }]
      : LINKS;

  async function handleSignOut() {
    const res = await signOut();
    if (res.status === "success") {
      toast.success(res.message);
      await refetch(); // updates every useSession() consumer, including this Navbar
      router.push("/");
      router.refresh(); // re-syncs any server-rendered bits that also read the session
    } else {
      toast.error(res.message);
    }
  }

  const transparentNavBar = pathname === "/";
  const navbarClass = `${styles.nav} ${
    scrolled || mobileOpen ? styles.navScrolled : styles.navTransparent
  } ${!transparentNavBar ? styles["contrast-navbar"] : ""} ${
    instant ? styles.navInstant : ""
  }`;

  return (
    <nav className={navbarClass} aria-label="Main">
      <div className={styles.container}>
        <div className={styles.navInner}>
          <Link href="/" className={styles.logoButton}>
            <div className={styles.logoMark}>
              <div className={styles.logoMarkInner} />
              <div className={styles.logoIcon}>
                <Coffee aria-hidden="true" />
              </div>
            </div>
            <div>
              <p className={styles.logoTitle}>Qaf</p>
              <p className={styles.logoSubtitle}>Coffee Co.</p>
            </div>
          </Link>

          <div className={styles.desktopNav}>
            {links.map((link) => {
              const active = isActive(pathname, link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`${styles.navLink} ${active ? styles.navLinkActive : ""}`}
                  aria-current={active ? "page" : undefined}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              onClick={openCart}
              className={styles.cartButton}
              aria-label={
                totalItems > 0
                  ? `Open cart (${totalItems} item${totalItems === 1 ? "" : "s"})`
                  : "Open cart"
              }
            >
              <span className={styles.cartIcon}>
                <ShoppingCart aria-hidden="true" />
                {totalItems > 0 && (
                  <span className={styles.cartBadge} aria-hidden="true">
                    {totalItems > 9 ? "9+" : totalItems}
                  </span>
                )}
              </span>
            </button>

            <button
              type="button"
              className={styles.menuButton}
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              aria-controls="mobile-menu"
            >
              {mobileOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
            </button>

            <div className={styles.authButtons}>
              {isPending ? null : !signedIn ? (
                <>
                  <Link href="/sign-up" className={styles.signUpButton}>
                    Sign Up
                  </Link>
                  <Link href="/sign-in" className={styles.signInButton}>
                    Sign In
                  </Link>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleSignOut}
                  className={styles.signOutButton}
                >
                  Sign Out
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div id="mobile-menu" className={styles.mobileMenu}>
          <div className={styles.mobileMenuInner}>
            {links.map((link) => {
              const active = isActive(pathname, link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`${styles.mobileLink} ${active ? styles.mobileLinkActive : styles.mobileLinkDefault}`}
                  aria-current={active ? "page" : undefined}
                >
                  {link.label}
                </Link>
              );
            })}

            {isPending ? null : signedIn ? (
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  void handleSignOut();
                }}
                className={`${styles.mobileLink} ${styles.mobileLinkDefault}`}
              >
                Sign Out
              </button>
            ) : (
              <>
                <Link
                  href="/sign-up"
                  onClick={() => setMobileOpen(false)}
                  className={`${styles.mobileLink} ${isActive(pathname, "/sign-up") ? styles.mobileLinkActive : styles.mobileLinkDefault}`}
                >
                  Sign Up
                </Link>
                <Link
                  href="/sign-in"
                  onClick={() => setMobileOpen(false)}
                  className={`${styles.mobileLink} ${isActive(pathname, "/sign-in") ? styles.mobileLinkActive : styles.mobileLinkDefault}`}
                >
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
