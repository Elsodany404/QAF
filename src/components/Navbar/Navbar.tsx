"use client";
import { useState, useEffect } from "react";
import { ShoppingCart, Menu, X, Coffee } from "lucide-react";
import { useCart } from "../../context/CartContext";
import styles from "./Navbar.module.css";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";
import signOut from "@/actions/signOut";
import { toast } from "react-hot-toast";

export default function Navbar() {
  const pathname = usePathname();
  const { totalItems, openCart } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();
  const { data: session, isPending, refetch } = useSession();
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const navLinks = [
    { id: "Home", label: "home" },
    { id: "Shop", label: "menu" },
    { id: "Our Story", label: "about" },
    
  ];
  const transparentNavBar = pathname === "/home";
  if(mobileOpen){
    navLinks.push({id: "Sign Up", label: 'sign-up'})
    navLinks.push({id: "Sign In", label: 'sign-in'})
  }
  const handleSignOut = async () => {
    const res = await signOut();
    if (res.status === "success") {
      toast.success(res.message);
      await refetch(); // updates every useSession() consumer, including this Navbar
      router.push("/home");
      router.refresh(); // re-syncs any server-rendered bits that also read the session
    } else {
      toast.error(res.message);
    }
  };
  const navbarClass = `${styles.nav} ${
    scrolled || mobileOpen ? styles.navScrolled : styles.navTransparent
  } ${!transparentNavBar ? styles["contrast-navbar"] : ""}`;
  return (
    <nav className={navbarClass}>
      <div className={styles.container}>
        <div className={styles.navInner}>
          <Link href="/home" className={styles.logoButton}>
            <div className={styles.logoMark}>
              <div className={styles.logoMarkInner} />
              <div className={styles.logoIcon}>
                <Coffee />
              </div>
            </div>
            <div className="text-left">
              <p className={styles.logoTitle}>Qaf</p>
              <p className={styles.logoSubtitle}>Coffee Co.</p>
            </div>
          </Link>

          <div className={styles.desktopNav}>
            {navLinks.map((link) => (
              <Link
                key={link.id}
                href={`/${link.label}`}
                className={`${styles.navLink} ${pathname === `/${link.label}` ? styles.navLinkActive : ""}`}
              >
                {link.id}
              </Link>
            ))}
          </div>

          <div className={styles.actions}>
            <button
              onClick={openCart}
              className={styles.cartButton}
              aria-label="Open cart"
            >
              <div
                style={{
                  position: "relative",
                }}
              >
                <ShoppingCart />
                {totalItems > 0 && (
                  <span className={styles.cartBadge}>
                    {totalItems > 9 ? "9+" : totalItems}
                  </span>
                )}
              </div>
            </button>
            <button
              className={styles.menuButton}
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
            <div className={styles.authButtons}>
              {isPending ? null : !session?.user?.id ? (
                <>
                  <Link href="/sign-up" className={styles.signUpButton}>
                    Sign Up
                  </Link>
                  {/* Fixed missing slash in href */}
                  <Link href="/sign-in" className={styles.signInButton}>
                    Sign In
                  </Link>
                </>
              ) : (
                <button
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
        <div className={styles.mobileMenu}>
          <div className={styles.mobileMenuInner}>
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => {
                  router.push(`/${link.label}`);
                  setMobileOpen(false);
                }}
                className={`${styles.mobileLink} ${pathname === `/${link.label}` ? styles.mobileLinkActive : styles.mobileLinkDefault}`}
              >
                {link.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
