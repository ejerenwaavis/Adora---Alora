import styles from './Intro.module.css';

export default function Intro() {
  return (
    <section className={styles.intro} id="house">
      <div className={`${styles.wrap} reveal`}>
        <span className={styles.quoteMark}>“</span>
        <p className={styles.text}>
          Made in Lagos by a mother and daughter, Aora House brings together the rituals that make everyday life feel fuller — thoughtful movement, good food, personal style and meaningful connection.
        </p>
        <div className={styles.sign}>Keni &amp; Mimi</div>
        <div className={styles.signSub}>Founders, Aora House</div>
      </div>
    </section>
  );
}
