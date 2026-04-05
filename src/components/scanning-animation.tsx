'use client';

import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 24px',
  },
  iconBox: {
    width: '64px',
    height: '64px',
    borderRadius: '8px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '20px',
  },
  statusText: {
    fontSize: '16px',
    fontWeight: 500,
    color: '#ffffff',
    marginBottom: '6px',
  },
  subText: {
    fontSize: '13px',
    color: 'rgba(255, 255, 255, 0.4)',
  },
};

export function ScanningAnimation() {
  return (
    <div style={styles.container}>
      <motion.div
        style={styles.iconBox}
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <Shield style={{ width: '28px', height: '28px', color: 'rgba(255,255,255,0.6)' }} />
      </motion.div>
      <motion.p
        style={styles.statusText}
        animate={{ opacity: [1, 0.5, 1] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        Analyzing...
      </motion.p>
      <p style={styles.subText}>Performing static analysis</p>
    </div>
  );
}
