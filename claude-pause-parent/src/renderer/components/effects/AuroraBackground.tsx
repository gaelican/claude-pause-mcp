
import { motion } from 'framer-motion';

export default function AuroraBackground() {
  return (
    <div className="aurora-container">
      <motion.div
        className="aurora-gradient aurora-1"
        animate={{
          backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
        }}
        transition={{
          duration: 20,
          ease: 'linear',
          repeat: Infinity,
        }}
      />
      <motion.div
        className="aurora-gradient aurora-2"
        animate={{
          backgroundPosition: ['100% 0%', '0% 100%', '100% 0%'],
        }}
        transition={{
          duration: 25,
          ease: 'linear',
          repeat: Infinity,
        }}
      />
      <motion.div
        className="aurora-gradient aurora-3"
        animate={{
          opacity: [0.3, 0.6, 0.3],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 15,
          ease: 'easeInOut',
          repeat: Infinity,
        }}
      />
      <svg className="aurora-filter">
        <defs>
          <filter id="aurora-blur">
            <feGaussianBlur in="SourceGraphic" stdDeviation="40" />
            <feColorMatrix
              values="1 0 0 0 0
                      0 1 0 0 0
                      0 0 1 0 0
                      0 0 0 1.2 0"
            />
          </filter>
        </defs>
      </svg>
    </div>
  );
}