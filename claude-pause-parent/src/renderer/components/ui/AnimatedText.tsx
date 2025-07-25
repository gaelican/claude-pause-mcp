import { motion } from 'framer-motion';

interface AnimatedTextProps {
  text: string;
  className?: string;
  variant?: 'gradient' | 'glow' | 'shimmer' | 'holographic';
  delay?: number;
}

export default function AnimatedText({ 
  text, 
  className = '', 
  variant = 'gradient',
  delay = 0 
}: AnimatedTextProps) {
  const words = text.split(' ');

  const container = {
    hidden: { opacity: 0 },
    visible: (_i = 1) => ({
      opacity: 1,
      transition: { staggerChildren: 0.05, delayChildren: delay },
    }),
  };

  const child = {
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring' as const,
        damping: 12,
        stiffness: 100,
      },
    },
    hidden: {
      opacity: 0,
      y: 20,
      transition: {
        type: 'spring' as const,
        damping: 12,
        stiffness: 100,
      },
    },
  };

  if (variant === 'holographic') {
    return (
      <motion.div
        className={`animated-text holographic ${className}`}
        animate={{
          backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
        }}
        transition={{
          duration: 5,
          ease: 'linear',
          repeat: Infinity,
        }}
      >
        {text}
      </motion.div>
    );
  }

  return (
    <motion.div
      className={`animated-text ${variant} ${className}`}
      variants={container}
      initial="hidden"
      animate="visible"
    >
      {words.map((word, index) => (
        <motion.span
          key={index}
          variants={child}
          style={{ marginRight: '0.25em', display: 'inline-block' }}
        >
          {word}
        </motion.span>
      ))}
    </motion.div>
  );
}