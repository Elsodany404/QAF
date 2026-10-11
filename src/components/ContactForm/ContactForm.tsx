"use client";

import { useActionState, useEffect, useTransition } from "react";
import sendContactMessage from "@/actions/sendContactMessage";
import styles from "./ContactForm.module.css";

const initialState = {
  status: "idle" as const,
  message: "",
};

export default function ContactForm() {
  const [state, formAction] = useActionState(sendContactMessage, initialState);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (state.status === "success") {
      const form = document.getElementById("contact-form");
      if (form instanceof HTMLFormElement) {
        form.reset();
      }
    }
  }, [state.status]);

  function handleSubmit(formData: FormData) {
    startTransition(() => formAction(formData));
  }

  return (
    <form
      id="contact-form"
      className={styles.form}
      action={handleSubmit}
      noValidate
    >
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
          <input type="text" name="name" autoComplete="name" required />
        </label>
        <label className={styles.field}>
          Email
          <input type="email" name="email" autoComplete="email" required />
        </label>
      </div>

      <label className={styles.field}>
        Subject
        <input type="text" name="subject" required />
      </label>

      <label className={styles.field}>
        Message
        <textarea name="message" rows={4} required />
      </label>

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
