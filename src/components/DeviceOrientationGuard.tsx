'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function DeviceOrientationGuard({ children }: { children: React.ReactNode }) {
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    const checkDeviceAndOrientation = () => {
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
      const isPortrait = window.innerHeight > window.innerWidth;
      const isSmallScreen = window.innerWidth < 768; // Tablets e menores

      // Mostra aviso se não for mobile OU se não estiver em portrait
      setShowWarning(!isMobile || !isPortrait || !isSmallScreen);
    };

    checkDeviceAndOrientation();
    window.addEventListener('resize', checkDeviceAndOrientation);
    window.addEventListener('orientationchange', checkDeviceAndOrientation);

    return () => {
      window.removeEventListener('resize', checkDeviceAndOrientation);
      window.removeEventListener('orientationchange', checkDeviceAndOrientation);
    };
  }, []);

  // Gerar estrelas aleatórias
  const stars = Array.from({ length: 100 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 2 + 1,
    duration: Math.random() * 3 + 2,
    delay: Math.random() * 2,
  }));

  return (
    <>
      <AnimatePresence>
        {showWarning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black overflow-y-auto"
          >
            {/* Estrelas animadas */}
            <div className="absolute inset-0 overflow-hidden">
              {stars.map((star) => (
                <motion.div
                  key={star.id}
                  className="absolute bg-white rounded-full"
                  style={{
                    left: `${star.x}%`,
                    top: `${star.y}%`,
                    width: `${star.size}px`,
                    height: `${star.size}px`,
                  }}
                  animate={{
                    opacity: [0.2, 1, 0.2],
                    scale: [1, 1.5, 1],
                  }}
                  transition={{
                    duration: star.duration,
                    repeat: Infinity,
                    delay: star.delay,
                  }}
                />
              ))}
            </div>

            {/* Conteúdo */}
            <div className="relative z-10 text-center max-w-sm mx-auto px-4 py-8 w-full">
              {/* Ícone de celular animado */}
              <motion.div
                animate={{
                  rotate: [0, -15, 15, -15, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 1,
                }}
                className="mb-6 inline-block"
              >
                <svg
                  className="w-20= h-20 sm:w-12 sm:h-12 mx-auto text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <rect
                    x="6"
                    y="3"
                    width="12"
                    height="18"
                    rx="2"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <line x1="12" y1="18" x2="12" y2="18" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </motion.div>

              {/* Seta indicando rotação */}
              <motion.div
                animate={{
                  rotate: 360,
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "linear",
                }}
                className="mb-4 sm:mb-6"
              >
                <svg
                  className="w-12 h-12 sm:w-8 sm:h-8 mx-auto text-yellow-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
									width="24"
									height="24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </motion.div>

              {/* Mensagem */}
              <motion.h1
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-2xl sm:text-3xl font-bold text-white mb-3 sm:mb-4"
              >
                📱 Use seu Celular
              </motion.h1>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="space-y-3 sm:space-y-4"
              >
                <p className="text-base sm:text-lg text-white/90 px-2">
                  Esta aplicação foi projetada para dispositivos móveis na orientação vertical.
                </p>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {!showWarning && children}
    </>
  );
}
