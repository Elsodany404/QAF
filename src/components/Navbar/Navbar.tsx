import { useState, useEffect } from "react";
import { ShoppingCart, Menu, X, Coffee } from "lucide-react";
import { useCart } from "../../context/CartContext";
import styles from "./Navbar.module.css";
import { useLocation, useNavigate } from "react-router-dom";

// interface NavbarProps {
// }

export default function Navbar() {
  const location = useLocation();
  const { totalItems, openCart } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  // console.log(location.pathname); // /about
  // console.log(location.search);   // ?id=1
  // console.log(location.hash);     // #section
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const navLinks = [
    { id: "Home", label: "home" },
    { id: "Shop", label: "menu" },
    { id: "Our Story", label: "about" },
    { id: "Dashboard", label: "dashboard" },
  ];
  const transparentNavBar = location.pathname === "/home";

  const navbarClass = `${styles.nav} ${
    scrolled || mobileOpen ? styles.navScrolled : styles.navTransparent
  } ${!transparentNavBar ? styles["contrast-navbar"] : ""}`;
  return (
    <nav className={navbarClass}>
      <div className={styles.container}>
        <div className={styles.navInner}>
          <button
            onClick={() => navigate("/home")}
            className={styles.logoButton}
          >
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
          </button>

          <div className={styles.desktopNav}>
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => navigate(`/${link.label}`)}
                className={`${styles.navLink} ${location.pathname === `/${link.label}` ? styles.navLinkActive : ""}`}
              >
                {link.id}
              </button>
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
                  navigate(`/${link.label}`);
                  setMobileOpen(false);
                }}
                className={`${styles.mobileLink} ${location.pathname === `/${link.label}` ? styles.mobileLinkActive : styles.mobileLinkDefault}`}
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
