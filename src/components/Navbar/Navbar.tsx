import { useState, useEffect } from "react";
import { ShoppingCart, Menu, X, Coffee } from "lucide-react";
import { useCart } from "../../context/CartContext";
import styles from "./Navbar.module.css";

interface NavbarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export default function Navbar({ currentPage, onNavigate }: NavbarProps) {
  const { totalItems, openCart } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const navLinks = [
    { id: "home", label: "Home" },
    { id: "menu", label: "Shop" },
    { id: "about", label: "Our Story" },
  ];

  return (
    <nav
      className={`${styles.nav} ${scrolled || mobileOpen ? styles.navScrolled : styles.navTransparent}`}
    >
      <div className={styles.container}>
        <div className={styles.navInner}>
          <button
            onClick={() => onNavigate("home")}
            className={styles.logoButton}
          >
            <div className={styles.logoMark}>
              <div className={styles.logoMarkInner} />
              <div className={styles.logoIcon}>
                <Coffee className="w-6 h-6" />
              </div>
            </div>
            <div className="text-left">
              <p className={styles.logoTitle}>Qaf</p>
              <p className={styles.logoSubtitle}>Coffee Co.</p>
            </div>
          </button>

          <div className={styles.desktopNav}>
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => onNavigate(link.id)}
                className={`${styles.navLink} ${currentPage === link.id ? styles.navLinkActive : ""}`}
              >
                {link.label}
              </button>
            ))}
          </div>

          <div className={styles.actions}>
            <button
              onClick={openCart}
              className={styles.cartButton}
              aria-label="Open cart"
            >
              <div style={{ position: "relative" }}>
                <ShoppingCart className="w-6 h-6" />
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
                  onNavigate(link.id);
                  setMobileOpen(false);
                }}
                className={`${styles.mobileLink} ${currentPage === link.id ? styles.mobileLinkActive : styles.mobileLinkDefault}`}
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
