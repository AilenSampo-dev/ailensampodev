import styles from "./Ticker.module.css";

type TickerProps = {
  lead: string;
  emphasis: string;
};

export default function Ticker({ lead, emphasis }: TickerProps) {
  const full = `${lead}${emphasis}`;

  return (
    <div className={styles.ticker} aria-label={full}>
      <p className={styles.text}>
        <span className={styles.lead}>{lead}</span>
        <strong className={styles.emphasis}>{emphasis}</strong>
      </p>
    </div>
  );
}
