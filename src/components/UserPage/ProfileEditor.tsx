"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Save } from "lucide-react";
import { updateProfile } from "@/actions/auth/updateProfile";
import styles from "./ProfileEditor.module.css";

export default function ProfileEditor({
  initialName,
}: {
  initialName: string;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [feedback, setFeedback] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback("");

    startTransition(async () => {
      const result = await updateProfile(name);
      if (!result.success) {
        setFeedback(result.error);
        return;
      }

      setFeedback("Profile updated");
      router.refresh();
    });
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <label className={styles.label} htmlFor="profile-name">
        Display name
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
          {feedback === "Profile updated" ? <Check /> : <Save />}
          {isPending ? "Saving…" : "Save profile"}
        </button>
      </div>
      <p
        className={
          feedback === "Profile updated" ? styles.success : styles.feedback
        }
        role="status"
      >
        {feedback}
      </p>
    </form>
  );
}
