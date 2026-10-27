"use client";

/*
 * Last-resort error page, used when the root layout itself fails. It replaces
 * the layout, so it can't rely on the site's fonts or global styles, or know
 * the page's language: it says everything in English and Arabic.
 */
export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: "1.5rem",
          background: "#fff9f0",
          color: "#11101f",
          fontFamily: "Arial, Helvetica, sans-serif",
          textAlign: "center",
        }}
      >
        <title>Something went wrong | QAF Coffee</title>
        <main>
          <h1 style={{ fontFamily: "Georgia, serif" }}>Something went wrong</h1>
          <p>We couldn&apos;t load this page. Please try again in a moment.</p>
          <div lang="ar" dir="rtl">
            <h2 style={{ margin: "1.5rem 0 0.5rem" }}>حدث خطأ ما</h2>
            <p>تعذّر تحميل هذه الصفحة. يُرجى المحاولة مرة أخرى بعد قليل.</p>
          </div>
          {error.digest && (
            <p style={{ fontSize: "0.8rem", color: "#5b5876" }}>
              Reference: {error.digest}
            </p>
          )}
          <button
            type="button"
            onClick={() => retry()}
            style={{
              marginTop: "1rem",
              padding: "0.75rem 1.25rem",
              border: 0,
              borderRadius: "0.5rem",
              background: "#eab22d",
              color: "#0c0b16",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Try again · <span lang="ar">حاول مرة أخرى</span>
          </button>
        </main>
      </body>
    </html>
  );
}
