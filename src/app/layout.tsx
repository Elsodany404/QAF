import Navbar from "@/components/Navbar/Navbar";
import CartDrawer from "@/components/CartDrawer/CartDrawer";
import Footer from "@/components/Footer/Footer";
import type { Metadata } from "next";
import Providers from "./providers";
import styles from "./layout.module.css";
import { Outfit, Playfair_Display } from "next/font/google";

import "./index.css";
import ScrollToTop from "@/components/ScrollToTop/ScrollToTop";

export const metadata: Metadata = {
  title: {
    default: "QAF Coffee",
    template: "%s | QAF Coffee",
  },

  description:
    "QAF — premium coffee crafted from carefully selected beans and expertly roasted for a rich, distinctive taste.",
};

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-playfair",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${outfit.variable}`}
      data-scroll-behavior="smooth"
    >
      <body>
        <Providers>
          <ScrollToTop />

          <div className={styles.app}>
            <Navbar />
            <CartDrawer />

            <main>{children}</main>

            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
