'use client';

import { motion } from 'framer-motion';

export const dynamic = 'force-dynamic';

/**
 * Loading Screen - Màn hình loading toàn trang với hiệu ứng khiên
 * Thiết kế theo phong cách glassmorphism đẹp mắt
 */
export default function LoadingScreen() {
  return (
    <div className="loading-container">
      <div className="loading-backdrop" />
      
      <motion.div
        className="loading-content"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        {/* Shield Icon with Pulse Animation */}
        <div className="shield-container">
          <motion.div
            className="shield-glow"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          <motion.div
            className="shield-icon"
            animate={{
              scale: [1, 1.05, 1],
              rotate: [0, 2, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="shield-svg"
            >
              <path
                d="M12 2L4 6V12C4 16.4 7.4 20.5 12 22C16.6 20.5 20 16.4 20 12V6L12 2Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M9 12L11 14L15 10"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </motion.div>
        </div>

        {/* Title with Typing Animation */}
        <div className="loading-title-container">
          <motion.h1
            className="loading-title"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <motion.span
              className="title-text"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.3 }}
            >
              Báo cáo lừa đảo
            </motion.span>
          </motion.h1>
          
          <motion.div
            className="loading-subtitle"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 0.8,
            }}
          >
            Đang tải dữ liệu...
          </motion.div>
        </div>

        {/* Loading Bar */}
        <motion.div
          className="loading-bar-container"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.3 }}
        >
          <motion.div
            className="loading-bar"
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </motion.div>

        {/* Loading Dots */}
        <motion.div
          className="loading-dots"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.3 }}
        >
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="loading-dot"
              animate={{
                scale: [0.8, 1.2, 0.8],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2,
                ease: 'easeInOut',
              }}
            />
          ))}
        </motion.div>
      </motion.div>

      <style jsx>{`
        .loading-container {
          position: fixed;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          overflow: hidden;
        }

        .loading-backdrop {
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg,
            rgba(59, 130, 246, 0.15) 0%,
            rgba(15, 23, 42, 0.9) 50%,
            rgba(59, 130, 246, 0.15) 100%
          );
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }

        .loading-backdrop::before {
          content: '';
          position: absolute;
          inset: 0;
          background: 
            radial-gradient(circle at 20% 30%, rgba(59, 130, 246, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(59, 130, 246, 0.2) 0%, transparent 50%);
          animation: bgPulse 4s ease-in-out infinite;
        }

        @keyframes bgPulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }

        .loading-content {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.5rem;
          padding: 3rem;
          z-index: 1;
        }

        .shield-container {
          position: relative;
          width: 100px;
          height: 100px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .shield-glow {
          position: absolute;
          width: 120px;
          height: 120px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(59, 130, 246, 0.6) 0%, transparent 70%);
        }

        .shield-icon {
          width: 80px;
          height: 80px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #3b82f6;
          filter: drop-shadow(0 0 20px rgba(59, 130, 246, 0.5));
        }

        .shield-svg {
          width: 100%;
          height: 100%;
        }

        .loading-title-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
        }

        .loading-title {
          font-size: 2rem;
          font-weight: 700;
          margin: 0;
          background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 50%, #93c5fd 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: -0.025em;
        }

        .title-text {
          display: inline-block;
        }

        .loading-subtitle {
          font-size: 1rem;
          color: rgba(148, 163, 184, 0.9);
          font-weight: 400;
          letter-spacing: 0.05em;
        }

        .loading-bar-container {
          width: 200px;
          height: 4px;
          background: rgba(59, 130, 246, 0.2);
          border-radius: 2px;
          overflow: hidden;
        }

        .loading-bar {
          height: 100%;
          background: linear-gradient(90deg, #3b82f6, #60a5fa, #3b82f6);
          border-radius: 2px;
        }

        .loading-dots {
          display: flex;
          gap: 0.5rem;
        }

        .loading-dot {
          width: 8px;
          height: 8px;
          background: #3b82f6;
          border-radius: 50%;
        }

        /* Responsive */
        @media (max-width: 640px) {
          .shield-container {
            width: 80px;
            height: 80px;
          }

          .shield-icon {
            width: 60px;
            height: 60px;
          }

          .shield-glow {
            width: 90px;
            height: 90px;
          }

          .loading-title {
            font-size: 1.5rem;
          }

          .loading-subtitle {
            font-size: 0.875rem;
          }

          .loading-bar-container {
            width: 160px;
          }

          .loading-content {
            padding: 2rem;
          }
        }

        @media (max-width: 480px) {
          .shield-container {
            width: 60px;
            height: 60px;
          }

          .shield-icon {
            width: 50px;
            height: 50px;
          }

          .shield-glow {
            width: 70px;
            height: 70px;
          }

          .loading-title {
            font-size: 1.25rem;
          }
        }
      `}</style>
    </div>
  );
}
