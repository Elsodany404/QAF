import styles from "./ListSkeleton.module.css";
function ListSkeleton() {
  return (
    <div className="productGrid">
      {[...Array(8)].map((_, i) => (
        <div key={i} className={styles.skeletonCard}>
          <div className={styles.skeletonImage} />
          <div className={styles.skeletonBody}>
            <div
              className={`${styles.skeletonLine} ${styles.skeletonLineShort}`}
            />
            <div className={styles.skeletonLine} />
            <div className={styles.skeletonLine} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default ListSkeleton;
