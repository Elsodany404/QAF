import styles from "./UserSkeleton.module.css";

export function userSkeleton() {
  return (
    <div className={styles.page}>
      <div className={styles.skeleton}>
        <div className={styles.skeletonAvatar} />
        <div className={styles.skeletonLine} />
        <div className={`${styles.skeletonLine} ${styles.skeletonLineShort}`} />
      </div>
    </div>
  );
}
