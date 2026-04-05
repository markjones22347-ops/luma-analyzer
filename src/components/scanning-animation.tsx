'use client';

import { motion } from 'framer-motion';
import { Shield, Scan } from 'lucide-react';

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px 24px',
    minHeight: '400px',
  },
  ringsContainer: {
    position: 'relative' as const,
    width: '220px',
    height: '220px',
    marginBottom: '40px',
  },
  centerIcon: {
    position: 'absolute' as const,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '90px',
    height: '90px',
    borderRadius: '24px',
    background: 'linear-gradient(135deg, rgba(59,130,246,0.3), rgba(139,92,246,0.3))',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 0 50px rgba(59,130,246,0.4)',
    border: '1px solid rgba(255,255,255,0.1)',
  },
  ring: (size: number, color: string) => ({
    position: 'absolute' as const,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: '50%',
    border: `2px solid ${color}`,
    opacity: 0.3,
  }),
  statusText: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#ffffff',
    marginBottom: '10px',
    textAlign: 'center' as const,
  },
  subText: {
    fontSize: '15px',
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center' as const,
  },
  progressBar: {
    width: '280px',
    height: '6px',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: '3px',
    marginTop: '32px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
    borderRadius: '3px',
  },
  scanningLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginTop: '16px',
    fontSize: '13px',
    color: 'rgba(255,255,255,0.4)',
  },
};

export function ScanningAnimation() {
  return (
    <div style={styles.container}>
      <div style={styles.ringsContainer}>
        {/* Animated rings */}
        <motion.div
          style={styles.ring(220, 'rgba(59,130,246,0.5)')}
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.3, 0.6, 0.3],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          style={styles.ring(180, 'rgba(139,92,246,0.5)')}
          animate={{
            scale: [1, 1.25, 1],
            opacity: [0.2, 0.5, 0.2],
            rotate: [0, -180, -360],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 0.5,
          }}
        />
        <motion.div
          style={styles.ring(140, 'rgba(59,130,246,0.5)')}
          animate={{
            scale: [1, 1.35, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 1,
          }}
        />

        {/* Center icon */}
        <motion.div
          style={styles.centerIcon}
          animate={{
            scale: [1, 1.08, 1],
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <Shield style={{ width: '44px', height: '44px', color: '#ffffff' }} />
        </motion.div>
      </div>

      <motion.h2
        style={styles.statusText}
        animate={{ opacity: [1, 0.6, 1] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        Scanning Script...
      </motion.h2>
      <p style={styles.subText}>
        Analyzing behavioral patterns and security risks
      </p>

      {/* Progress bar */}
      <div style={styles.progressBar}>
        <motion.div
          style={styles.progressFill}
          initial={{ width: '0%' }}
          animate={{ width: ['0%', '100%', '0%'] }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      </div>

      <div style={styles.scanningLabel}>
        <Scan style={{ width: '14px', height: '14px' }} />
        <span>Static Analysis in Progress</span>
      </div>
    </div>
  );
}
