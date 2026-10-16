"use client";

import { useActionState, useEffect, useRef, useTransition } from "react";
import sendContactMessage from "@/actions/sendContactMessage";
import { HONEYPOT_FIELD } from "@/lib/honeypot";
import styles from "./ContactForm.module.css";

const initialState = {
  status: "idle" as const,
  message: "",
};

export default function ContactForm() {
  const [state, formAction] = useActionState(sendContactMessage, initialState);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") formRef.current?.reset();
  }, [state]);

  // onSubmit rather than <form action>: React resets a form after its action
  // runs, which would wipe the message when sending fails.
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => formAction(formData));
  }

  return (
    <form ref={formRef} className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Send an email</p>
          <h3 className={styles.title}>Contact Us</h3>
        </div>
        <span className={styles.recipient}>sales@qafcoffee.store</span>
      </div>

      <div className={styles.grid}>
        <label className={styles.field}>
          Name
          <input
            type="text"
            name="name"
            autoComplete="name"
            maxLength={100}
            required
          />
        </label>
        <label className={styles.field}>
          Email
          <input
            type="email"
            name="email"
            autoComplete="email"
            maxLength={254}
            required
          />
        </label>
      </div>

      <label className={styles.field}>
        Subject
        <input type="text" name="subject" maxLength={200} required />
      </label>

      <label className={styles.field}>
        Message
        <textarea name="message" rows={4} maxLength={5000} required />
      </label>

      {/* Hidden from people; bots that fill in every field get dropped. */}
      <input
        type="text"
        name={HONEYPOT_FIELD}
        className={styles.honeypot}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
      />

      <div className={styles.footer}>
        <p
          className={state.status === "success" ? styles.success : styles.error}
          aria-live="polite"
        >
          {state.message}
        </p>
        <button type="submit" className={styles.submit} disabled={isPending}>
          {isPending ? "Sending..." : "Send Message"}
        </button>
      </div>
    </form>
  );
}
