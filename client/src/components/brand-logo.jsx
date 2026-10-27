import Image from "next/image";
import styles from "./brand-logo.module.css";

// Replace the four PNG assets in public/brand to update every logo placement.
export default function BrandLogo({ variant = "auto", className = "" }) {
  const icon = variant === "icon" || variant === "icon-inverted";
  const asset = icon ? "icon" : "logo";
  return (
    <span className={`${styles.logo} ${icon ? styles.icon : ""} ${className}`}>
      {variant === "auto" || variant === "icon" ? (
        <>
          <Image
            unoptimized
            src={`/brand/${asset}.png?v=2`}
            alt="COCREATE"
            width={icon ? 48 : 240}
            height={48}
            className={`${styles.image} ${styles.standard}`}
          />
          <Image
            unoptimized
            src={`/brand/${asset}-inverted.png?v=2`}
            alt="COCREATE"
            width={icon ? 48 : 240}
            height={48}
            className={`${styles.image} ${styles.inverted}`}
          />
        </>
      ) : (
        <Image
          unoptimized
          src={`/brand/${asset}${variant === "inverted" || variant === "icon-inverted" ? "-inverted" : ""}.png?v=2`}
          alt="COCREATE"
          width={icon ? 48 : 240}
          height={48}
          className={styles.image}
        />
      )}
    </span>
  );
}
