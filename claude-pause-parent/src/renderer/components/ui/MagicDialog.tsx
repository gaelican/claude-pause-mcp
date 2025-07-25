import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface MagicDialogProps {
  children: ReactNode;
  className?: string;
}

export default function MagicDialog({ children, className = '' }: MagicDialogProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      transition={{
        type: "spring",
        damping: 25,
        stiffness: 300,
      }}
      className={`magic-dialog ${className}`}
    >
      {/* Animated gradient border */}
      <div className="magic-dialog-border" />
      
      {/* Glass morphism background */}
      <div className="magic-dialog-bg">
        {/* Content */}
        <div className="magic-dialog-content">
          {children}
        </div>
        
        {/* Particle overlay */}
        <div className="magic-dialog-particles" />
      </div>
    </motion.div>
  );
}