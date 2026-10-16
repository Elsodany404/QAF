import Navbar from "@/components/Navbar/Navbar";
import CartDrawer from "@/components/CartDrawer/CartDrawer";
import Footer from "@/components/Footer/Footer";
import type { Metadata } from "next";
import styles from "./layout.module.css";
import { Outfit, Playfair_Display } from "next/font/google";

import { getSiteUrl } from "@/lib/siteUrl";

import "./index.css";
import { Providers } from "./providers";

const description =
  "QAF — premium coffee crafted from carefully selected beans and expertly roasted for a rich, distinctive taste.";

/** Base for absolute metadata URLs (Open Graph images, canonical links). */
function metadataBase(): URL | undefined {
  try {
    return new URL(getSiteUrl());
  } catch {
    return undefined; // missing NEXT_PUBLIC_SITE_URL is reported elsewhere
  }
}

export const metadata: Metadata = {
  metadataBase: metadataBase(),
  title: {
    default: "QAF Coffee",
    template: "%s | QAF Coffee",
  },
  description,
  openGraph: {
    type: "website",
    siteName: "QAF Coffee",
    locale: "en_EG",
    description,
  },
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
