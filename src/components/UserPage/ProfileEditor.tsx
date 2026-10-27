"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Save } from "lucide-react";
import { updateProfile } from "@/actions/auth/updateProfile";
import { useI18n } from "@/i18n/I18nProvider";
import styles from "./ProfileEditor.module.css";

type Feedback = { saved: boolean; message: string };

export default function ProfileEditor({
  initialName,
}: {
  initialName: string;
}) {
  const router = useRouter();
  const { t } = useI18n();
  const [name, setName] = useState(initialName);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);

    startTransition(async () => {
      const result = await updateProfile(name);
      if (!result.success) {
        setFeedback({ saved: false, message: result.error });
        return;
      }

      setFeedback({ saved: true, message: t.profile.updated });
      router.refresh();
    });
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <label className={styles.label} htmlFor="profile-name">
        {t.profile.displayName}
      </label>
      <div className={styles.controls}>
        <input
          id="profile-name"
          className={styles.input}
          autoComplete="name"
          maxLength={80}
          minLength={2}
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <button
          className={styles.saveButton}
          type="submit"
          disabled={isPending}
        >
          {feedback?.saved ? <Check /> : <Save />}
          {isPending ? t.profile.saving : t.profile.save}
        </button>
      </div>
      <p
        className={feedback?.saved ? styles.success : styles.feedback}
        role="status"
      >
        {feedback?.message}
      </p>
    </form>
  );
}
