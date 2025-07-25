import React from 'react';
import { motion } from 'framer-motion';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
  animateHover?: boolean;
}

export default function GlassCard({ 
  children, 
  className = '',
  glowColor = '#89b4fa',
  animateHover = true
}: GlassCardProps) {
  return (
    <motion.div
      className={`glass-card ${className}`}
      whileHover={animateHover ? {
        scale: 1.02,
        transition: { duration: 0.3 }
      } : {}}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="glass-card-border"
        animate={{
          background: [
            `conic-gradient(from 0deg at 50% 50%, transparent 0deg, ${glowColor} 60deg, transparent 120deg)`,
            `conic-gradient(from 120deg at 50% 50%, transparent 0deg, ${glowColor} 60deg, transparent 120deg)`,
            `conic-gradient(from 240deg at 50% 50%, transparent 0deg, ${glowColor} 60deg, transparent 120deg)`,
            `conic-gradient(from 360deg at 50% 50%, transparent 0deg, ${glowColor} 60deg, transparent 120deg)`,
          ],
        }}
        transition={{
          duration: 4,
          ease: 'linear',
          repeat: Infinity,
        }}
      />
      <div className="glass-card-content">
        {children}
      </div>
      <div className="glass-card-blur" />
    </motion.div>
  );
}