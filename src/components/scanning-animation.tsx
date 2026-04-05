'use client';

import { motion } from 'framer-motion';
import { Shield, Zap, Lock, Eye } from 'lucide-react';

export function ScanningAnimation() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center py-20"
    >
      {/* Animated Icon */}
      <div className="relative w-32 h-32 mb-8">
        {/* Outer ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 rounded-full border-2 border-dashed border-luma-primary/30"
        />
        
        {/* Middle ring */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          className="absolute inset-3 rounded-full border-2 border-dashed border-luma-accent/30"
        />
        
        {/* Center icon */}
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-6 rounded-3xl bg-gradient-to-br from-luma-primary/20 to-luma-accent/20 flex items-center justify-center"
        >
          <Shield className="w-10 h-10 text-luma-primary" />
        </motion.div>

        {/* Pulse effect */}
        <motion.div
          animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-0 rounded-full bg-luma-primary/10"
        />
      </div>

      {/* Text */}
      <motion.h3
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="text-xl font-semibold text-white mb-4"
      >
        Analyzing script...
      </motion.h3>

      {/* Progress bar */}
      <div className="w-64 h-2 bg-luma-card rounded-full overflow-hidden">
        <motion.div
          animate={{ x: ["-100%", "100%"] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="w-1/2 h-full bg-gradient-to-r from-luma-primary to-luma-accent rounded-full"
        />
      </div>

      {/* Feature indicators */}
      <div className="flex gap-6 mt-8">
        <FeatureIcon icon={Eye} label="Pattern Analysis" delay={0} />
        <FeatureIcon icon={Lock} label="Obfuscation Check" delay={0.2} />
        <FeatureIcon icon={Zap} label="Risk Scoring" delay={0.4} />
      </div>
    </motion.div>
  );
}

function FeatureIcon({ icon: Icon, label, delay }: { icon: typeof Eye; label: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="flex flex-col items-center gap-2"
    >
      <motion.div
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.5, 1, 0.5]
        }}
        transition={{ duration: 2, repeat: Infinity, delay }}
        className="w-10 h-10 rounded-xl bg-luma-card flex items-center justify-center"
      >
        <Icon className="w-5 h-5 text-luma-primary" />
      </motion.div>
      <span className="text-xs text-luma-muted">{label}</span>
    </motion.div>
  );
}
