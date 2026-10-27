import Navbar from "@/components/Navbar/Navbar";
import CartDrawer from "@/components/CartDrawer/CartDrawer";
import Footer from "@/components/Footer/Footer";
import type { Metadata } from "next";
import styles from "./layout.module.css";
import { Cairo, El_Messiri, Outfit, Playfair_Display } from "next/font/google";

import { LOCALES, localeDirection } from "@/i18n/config";
import { I18nProvider } from "@/i18n/I18nProvider";
import { clientMessages, getMessages } from "@/i18n/messages";
import { getI18n } from "@/i18n/server";
import { getSiteUrl } from "@/lib/siteUrl";

import "./index.css";
import { Providers } from "./providers";

/** Base for absolute metadata URLs (Open Graph images, canonical links). */
function metadataBase(): URL | undefined {
  try {
    return new URL(getSiteUrl());
  } catch {
    return undefined; // missing NEXT_PUBLIC_SITE_URL is reported elsewhere
  }
}

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export async function generateMetadata(): Promise<Metadata> {
  const { locale, t } = await getI18n();
  const { siteName, titleTemplate, description, openGraphLocale } =
    t.metadata;
  const otherLocale = LOCALES.find((other) => other !== locale)!;

  return {
    metadataBase: metadataBase(),
    title: {
      default: siteName,
      template: titleTemplate,
    },
    description,
    openGraph: {
      type: "website",
      siteName,
      locale: openGraphLocale,
      alternateLocale: getMessages(otherLocale).metadata.openGraphLocale,
      description,
    },
  };
}

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

/*
 * Arabic pages put these in front (src/styles/variables.css). They only
 * carry Arabic letters, so Latin words and digits keep Outfit and Playfair.
 * Not preloaded: English pages never use them. No size-adjusted fallback
 * either: its Arial would catch the Latin letters before Outfit does.
 */
const cairo = Cairo({
  subsets: ["arabic"],
  variable: "--font-cairo",
  preload: false,
  adjustFontFallback: false,
});

const elMessiri = El_Messiri({
  subsets: ["arabic"],
  variable: "--font-el-messiri",
  preload: false,
  adjustFontFallback: false,
});

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { locale, t } = await getI18n();

  return (
    <html
      lang={locale}
      dir={localeDirection(locale)}
      className={`${playfair.variable} ${outfit.variable} ${cairo.variable} ${elMessiri.variable}`}
      data-scroll-behavior="smooth"
    >
      <body>
        <I18nProvider locale={locale} messages={clientMessages(t)}>
          <Providers>
            <div className={styles.app}>
              <Navbar />
              <CartDrawer />

              <main className={styles.main}>{children}</main>

              <Footer />
            </div>
          </Providers>
        </I18nProvider>
      </body>
    </html>
  );
}
