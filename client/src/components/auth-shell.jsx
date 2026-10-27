import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import BrandLogo from "@/components/brand-logo";
import styles from "./auth-shell.module.css";

export default function AuthShell({ children, onBack, backDisabled = false }) {
  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <section className={styles.form}>
          <header className={styles.header}>
            {onBack ? (
              <button
                type="button"
                onClick={onBack}
                disabled={backDisabled}
                aria-label="Change account type"
                className={styles.back}
              >
                <ArrowLeft size={16} />
              </button>
            ) : (
              <Link href="/" aria-label="Back to home" className={styles.back}>
                <ArrowLeft size={16} />
              </Link>
            )}
          </header>
          <div className={styles.content}>{children}</div>
        </section>
        <aside className={styles.story}>
          <BrandLogo variant="inverted" />
          <p className={styles.eyebrow}>Create together</p>
          <h2>
            Big ideas.
            <br />
            Better together.
          </h2>
          <p className={styles.description}>
            A shared space for brands and creators to turn ideas into campaigns,
            collaborations, and rewards.
          </p>
          <span className={styles.badge}>
            Your next collaboration starts here ?
          </span>
        </aside>
      </div>
    </main>
  );
}
