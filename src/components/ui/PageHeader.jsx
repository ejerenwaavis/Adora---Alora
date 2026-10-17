import React from 'react';
import styles from './PageHeader.module.css';

export default function PageHeader({ eyebrow, title, description, children }) {
  return (
    <div className={styles.pageHeader}>
      {eyebrow && (
        <div className={styles.eyebrow}>
          {eyebrow}
        </div>
      )}
      <h1 className={styles.title}>
        {title}
      </h1>
      {description && (
        <p className={styles.description}>
          {description}
        </p>
      )}
      {children && (
        <div className={styles.children}>
          {children}
        </div>
      )}
    </div>
  );
}
