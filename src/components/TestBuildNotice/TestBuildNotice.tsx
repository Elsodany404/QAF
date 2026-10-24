import { FlaskConical } from "lucide-react";

import { TEST_BUILD } from "@/lib/testBuild";
import styles from "./TestBuildNotice.module.css";

/** "This is a test build" banner. Renders nothing in the production build. */
export default function TestBuildNotice({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!TEST_BUILD) return null;

  return (
    <div className={styles.notice} role="note">
      <FlaskConical className={styles.icon} aria-hidden="true" />
      <div>
        <p className={styles.title}>This is a test build</p>
        <p className={styles.text}>{children}</p>
      </div>
    </div>
  );
}
