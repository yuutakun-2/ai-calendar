"use client";

import { motion } from "framer-motion";

interface LoadingDotsProps {
  color?: string;
  size?: number;
  gap?: number;
}

export default function LoadingDots({
  color = "currentColor",
  size = 4,
  gap = 4,
}: LoadingDotsProps) {
  const dotVariants = {
    initial: {
      y: 0,
    },
    animate: {
      y: -size,
    },
  };

  const containerVariants = {
    initial: {
      transition: {
        staggerChildren: 0.15,
      },
    },
    animate: {
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      animate="animate"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: `${gap}px`,
        height: `${size}px`,
        paddingTop: `${size}px`,
      }}
    >
      {[0, 1, 2].map((index) => (
        <motion.span
          key={index}
          variants={dotVariants}
          transition={{
            duration: 0.4,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
          }}
          style={{
            width: `${size}px`,
            height: `${size}px`,
            backgroundColor: color,
            borderRadius: "50%",
            display: "block",
          }}
        />
      ))}
    </motion.div>
  );
}
