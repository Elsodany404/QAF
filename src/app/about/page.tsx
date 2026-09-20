import { Leaf, Globe, Award, Heart, ArrowRight } from "lucide-react";
import styles from "./page.module.css";
import Image from "next/image";
import Link from "next/link";
import ContactForm from "@/components/ContactForm/ContactForm";
import signature_coffee_photo from "@/assets/images/signature_coffee_photo_big.jpg";
import story_section_photo from "@/assets/images/story_section_photo.jpg";
import story_section_photo_2 from "@/assets/images/story_section_photo_2.jpg";
export default function About() {
  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <Image
          quality={50}
          loading="eager"
          priority={true}
          placeholder="blur"
          className={styles.heroImage}
          src={signature_coffee_photo}
          alt="About section coffee photo"
        />
        <div className={styles.heroOverlay} />
        <div className={styles.heroOverlaySoft} />
        <div className={styles.heroContent}>
          <div className={styles.heroBadge}>
            <p className={styles.heroBadgeText}>Our Journey</p>
          </div>
          <h1 className={styles.heroTitle}>
            Passion for{" "}
            <span className={styles.heroTitleAccent}>Perfect Coffee</span>
          </h1>
          <p className={styles.heroText}>
            From single-origin sourcing to precision roasting — we obsess over
            every detail to bring you extraordinary coffee.
          </p>
        </div>
      </div>

      <section className={styles.section}>
        <div className={styles.glow} />
        <div className={styles.container}>
          <div className={styles.storyGrid}>
            <div>
              <h2 className={styles.storyTitle}>
                Rooted in{" "}
                <span className={styles.storyTitleAccent}>Tradition</span>
              </h2>
              <p className={styles.storyText}>
                Founded in 10th of Ramadan, Qaf Coffee is the culmination of
                generations of coffee culture and modern roasting science. We
                source from the world premier growing regions — Ethiopia,
                Colombia, Yemen — and bring those stories to your cup.
              </p>
              <p className={styles.storyText}>
                Our Turkish coffee blends pay homage to centuries of tradition
                while pushing the boundaries of what ground coffee can be. Each
                of our three blends — Qaf, Colombian, and Golden — represents a
                distinct flavor philosophy.
              </p>
              <p className={styles.storyText}>
                We believe that exceptional coffee should be accessible to
                everyone who cares about quality. That is why we roast in small
                batches, ship within 24 hours of roasting, and obsess over every
                detail of the process.
              </p>
            </div>
            <div className={styles.imageGrid}>
              <Image
                src={story_section_photo}
                placeholder="blur"
                alt="Coffee"
                className={styles.image}
              />
              <Image
                src={story_section_photo_2}
                placeholder="blur"
                alt="Beans"
                className={`${styles.image} ${styles.imageOffset}`}
              />
            </div>
          </div>
        </div>
      </section>

      <section className={styles.sectionAlt}>
        <div className={styles.glowLeft} />
        <div className={styles.container}>
          <div className={styles.sectionHeading}>
            <div className={styles.sectionBadge}>
              <p className={styles.sectionBadgeText}>Values</p>
            </div>
            <h2 className={styles.sectionTitle}>What Drives Us</h2>
          </div>

          <div className={styles.valuesGrid}>
            {[
              {
                Icon: Globe,
                title: "Global Sourcing",
                desc: "We partner directly with farmers in Colombia, Ethiopia, and Yemen for traceable, premium beans.",
              },
              {
                Icon: Award,
                title: "Expert Roasting",
                desc: "Our Q-certified roasters bring precision and passion to every small-batch roast.",
              },
              {
                Icon: Leaf,
                title: "Sustainability",
                desc: "Carbon-neutral shipping, compostable packaging, and forest restoration with every order.",
              },
              {
                Icon: Heart,
                title: "Community First",
                desc: "We reinvest in farming communities through fair pricing and long-term partnerships.",
              },
            ].map(({ Icon, title, desc }, i) => (
              <div
                key={title}
                className={styles.valueCard}
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className={styles.valueIcon}>
                  <Icon className="w-7 h-7" />
                </div>
                <h3 className={styles.valueTitle}>{title}</h3>
                <p className={styles.valueDesc}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.glow} />
        <div className={styles.container}>
          <div className={styles.sectionHeading}>
            <div className={styles.sectionBadge}>
              <p className={styles.sectionBadgeText}>Our Process</p>
            </div>
            <h2 className={styles.sectionTitle}>From Farm to Cup</h2>
          </div>

          <div className={styles.processGrid}>
            {[
              {
                step: "01",
                title: "Source",
                desc: "Direct relationships with micro-farms",
              },
              {
                step: "02",
                title: "Import",
                desc: "Fresh beans to our roastery",
              },
              {
                step: "03",
                title: "Roast",
                desc: "Small-batch precision roasting",
              },
              {
                step: "04",
                title: "Deliver",
                desc: "Fresh to your door in 24-48 hours",
              },
            ].map((item, i) => (
              <div
                key={item.step}
                className={styles.processCard}
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className={styles.processStep}>{item.step}</div>
                <h3 className={styles.processTitle}>{item.title}</h3>
                <p className={styles.processDesc}>{item.desc}</p>
                {i < 3 && <ArrowRight className={styles.arrow} />}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.contactSection}>
        <div className={styles.container}>
          <div className={styles.contactContent}>
            <div>
              <div className={styles.sectionBadge}>
                <p className={styles.sectionBadgeText}>Visit or write to us</p>
              </div>
              <h2 className={styles.contactTitle}>Let&apos;s talk coffee</h2>
              <p className={styles.contactText}>
                Qaf Coffee is based at C8, 10th of Ramadan, Al-sharqya, Egypt.
                Our team can help with product questions, orders, and delivery
                support.
              </p>
            </div>
            <div className={styles.contactDetails}>
              <p>C8, 10th of Ramadan, Al-sharqya, Egypt</p>
              <a href="tel:01031200143">01031200143</a>
              <a href="mailto:sales@qafcoffee.store">sales@qafcoffee.store</a>
            </div>
          </div>
          <ContactForm />
        </div>
      </section>
      <section className={styles.policySection}>
        <div className={styles.container}>
          <div className={styles.sectionHeading}>
            <div className={styles.sectionBadge}>
              <p className={styles.sectionBadgeText}>Customer information</p>
            </div>
            <h2 className={styles.sectionTitle}>Policies</h2>
          </div>

          <div className={styles.policyGrid}>
            <article id="privacy-policy" className={styles.policyCard}>
              <h3>Privacy Policy</h3>
              <p>
                We collect the name, email, phone number, and delivery address
                needed to process and deliver orders. Payment details are
                handled by our payment provider and are not stored by Qaf
                Coffee. We use order information for payment confirmation,
                preparation, delivery, support, and legal requirements. We do
                not sell customer information.
              </p>
              <p>
                Privacy questions can be sent to{" "}
                <a href="mailto:sales@qafcoffee.store">sales@qafcoffee.store</a>
                .
              </p>
            </article>

            <article
              id="delivery-shipping-policy"
              className={styles.policyCard}
            >
              <h3>Delivery &amp; Shipping Policy</h3>
              <p>
                Orders are prepared and dispatched within 24 hours on business
                days. Delivery normally takes 24 to 48 hours after dispatch,
                depending on the destination and courier availability. Delivery
                fees are shown at checkout before payment.
              </p>
              <p>
                Customers should provide an accurate phone number and address.
                If a delivery attempt is missed, the courier may contact the
                customer to arrange another attempt.
              </p>
            </article>

            <article id="return-refund-policy" className={styles.policyCard}>
              <h3>Return &amp; Refund Policy</h3>
              <p>
                We do not offer order cancellations through the website. To
                request a return, contact us on{" "}
                <a
                  href="https://wa.me/201031200143?text=Hello%20Qaf%20Coffee%2C%20I%20would%20like%20to%20request%20a%20return."
                  target="_blank"
                  rel="noreferrer"
                >
                  WhatsApp at +20 103 120 0143
                </a>{" "}
                and include your order number and photos when relevant.
              </p>
              <p>
                We will check the order and review the return request. If it is
                approved, we will refund the customer through the original
                payment method. For damaged, incorrect, or materially different
                orders, please contact us within 48 hours through{" "}
                <a
                  href="https://wa.me/201031200143?text=Hello%20Qaf%20Coffee%2C%20I%20need%20help%20with%20a%20return%20or%20a%20damaged%20order."
                  target="_blank"
                  rel="noreferrer"
                >
                  WhatsApp
                </a>{" "}
                with the order number and photos.
              </p>
            </article>
          </div>
        </div>
      </section>
      <section className={styles.ctaSection}>
        <div className={styles.container}>
          <div className={styles.ctaContent}>
            <h2 className={styles.ctaTitle}>Experience the Difference</h2>
            <p className={styles.ctaText}>
              Taste coffee that been crafted with passion, sourced ethically,
              and roasted to perfection.
            </p>
            <Link href="/menu" className={styles.ctaButton}>
              Shop Our Blends
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
