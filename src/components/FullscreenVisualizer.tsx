'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Info } from 'lucide-react';
import { useStore } from '@/store/useStore';
import GraphVisualizer from './GraphVisualizer';
import ControlPanel from './ControlPanel';
import StepExplainer from './StepExplainer';

export default function FullscreenVisualizer() {
  const { isFullscreenMode, setFullscreenMode } = useStore();

  return (
    <AnimatePresence>
      {isFullscreenMode && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[999] bg-black/20 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setFullscreenMode(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.3, type: 'spring', stiffness: 300, damping: 30 }}
            className="w-[95vw] h-[95vh] bg-white rounded-xl border border-gray-200 shadow-2xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with close button */}
            <div className="bg-slate-50 backdrop-blur-sm border-b border-gray-200 px-6 py-3 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold bg-gradient-to-r from-slate-700 to-slate-600 bg-clip-text text-transparent">
                  Algorithm Visualizer
                </h2>
                <div className="relative group cursor-help">
                  <Info size={18} className="text-slate-500 hover:text-slate-700 transition" />
                  <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block bg-white border border-gray-300 rounded-lg px-4 py-2 whitespace-nowrap text-sm text-slate-800 shadow-xl z-50">
                    Step through the algorithm to learn how it builds your learning path
                  </div>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setFullscreenMode(false)}
                className="text-slate-500 hover:text-slate-800 transition-colors"
              >
                <X size={24} />
              </motion.button>
            </div>

            {/* Main content: Graph on left, Controls + Explanation on right */}
            <div className="flex-1 overflow-hidden flex min-h-0">
              {/* Left - Graph (65%) */}
              <div className="flex-[65] min-w-0 border-r border-gray-200">
                <div style={{ width: '100%', height: '100%', display: 'block', position: 'relative' }}>
                  <GraphVisualizer />
                </div>
              </div>

              {/* Right - Controls + Explainer (35%) */}
              <div className="flex-[35] min-w-0 flex flex-col overflow-hidden bg-gradient-to-br from-slate-50/80 to-white shadow-[-5px_0_15px_-5px_rgba(0,0,0,0.05)] z-10">
                {/* Top - Controls */}
                <div className="shrink-0 border-b border-gray-200 bg-white/40 backdrop-blur-md">
                  <div className="max-h-[30vh] overflow-y-auto custom-scrollbar">
                    <ControlPanel />
                  </div>
                </div>

                {/* Bottom - Step Explainer */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                  <StepExplainer />
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
