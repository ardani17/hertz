import styles from '@/components/tools/ToolShell.module.css';

export default function ToolsLoading() {
  return (
    <div className={styles.toolLoadingPane} role="status" aria-live="polite">
      Memuat tool…
    </div>
  );
}
