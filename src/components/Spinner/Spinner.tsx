import React from "react";
import styles from "./Spinner.module.css";

export interface SpinnerProps {
  size?: "sm" | "md" | "lg" | number;
  label?: string;
  variant?: "espresso" | "gold" | "cream";
  fullScreen?: boolean;
  className?: string;
}

const SIZE_MAP = {
  sm: 36,
  md: 56,
  lg: 80,
};

export const Spinner: React.FC<SpinnerProps> = ({
  size = "md",
  label = "Brewing your request...",
  variant = "espresso",
  fullScreen = false,
  className = "",
}) => {
  const pixelSize = typeof size === "number" ? size : SIZE_MAP[size];

  const wrapperClasses = [
    styles.container,
    styles[variant],
    fullScreen ? styles.fullScreen : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={wrapperClasses}>
      <svg
        width={pixelSize}
        height={pixelSize}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="status"
        aria-label={label || "Loading"}
      >
        {/* Orbiting Outer Ring */}
        <circle
          className={styles.ringTrack}
          cx="32"
          cy="32"
          r="28"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <circle
          className={styles.ring}
          cx="32"
          cy="32"
          r="28"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* Rising Steam Lines */}
        <g className={styles.steamGroup} strokeWidth="2" strokeLinecap="round">
          <path
            className={`${styles.steamLine} ${styles.steamLine1}`}
            d="M24 23 C23 18, 26 16, 25 12"
          />
          <path
            className={`${styles.steamLine} ${styles.steamLine2}`}
            d="M32 21 C31 16, 34 14, 33 10"
          />
          <path
            className={`${styles.steamLine} ${styles.steamLine3}`}
            d="M40 23 C39 18, 42 16, 41 12"
          />
        </g>

        {/* Coffee Cup Body */}
        <path
          className={styles.cupBody}
          d="M18 28 H46 L43 45 C42.5 48.5 39.5 51 36 51 H28 C24.5 51 21.5 48.5 21 45 L18 28 Z"
        />

        {/* Liquid Surface */}
        <ellipse
          className={styles.liquidSurface}
          cx="32"
          cy="28"
          rx="14"
          ry="3"
        />

        {/* Cup Handle */}
        <path
          className={styles.cupHandle}
          d="M45 31 C49 31 51 34 50 38 C49 41.5 46 43 43.5 42.5"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />

        {/* Cup Saucer Base */}
        <path
          className={styles.saucer}
          d="M16 53 H48"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>

      {/* Optional Label */}
      {label && (
        <p
          className={`${styles.label} ${
            pixelSize < 48 ? styles.labelSmall : ""
          }`}
        >
          {label}
        </p>
      )}
    </div>
  );
};

export default Spinner;
