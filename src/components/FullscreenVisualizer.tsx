'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Info } from 'lucide-react';
import { useStore } from '@/store/useStore';
import GraphVisualizer from './GraphVisualizer';
import ControlPanel from './ControlPanel';
import DebugPanel from './DebugPanel';
import AlgorithmExplainer from './AlgorithmExplainer';

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
          className="fixed inset-0 z-[999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-6"
          onClick={() => setFullscreenMode(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.3, type: 'spring', stiffness: 300, damping: 30 }}
            className="w-[90vw] h-[90vh] bg-slate-950 rounded-xl border-2 border-indigo-500/40 shadow-2xl shadow-indigo-500/20 flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with close button */}
            <div className="bg-gradient-to-r from-slate-900/80 to-slate-900/40 backdrop-blur-lg border-b border-indigo-500/20 px-8 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  Learning Path Visualization
                </h2>
                <div className="relative group cursor-help">
                  <Info size={20} className="text-indigo-400 hover:text-indigo-300 transition" />
                  <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block bg-slate-900 border border-indigo-500/40 rounded-lg px-4 py-2 whitespace-nowrap text-sm text-white shadow-xl z-50">
                    Interactive visualization of your learning pathway with real-time algorithm execution
                  </div>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setFullscreenMode(false)}
                className="text-white hover:text-indigo-300 transition-colors"
              >
                <X size={28} />
              </motion.button>
            </div>

            {/* Main content grid */}
            <div className="flex-1 overflow-hidden flex gap-6 p-6 bg-gradient-to-br from-slate-900/20 to-slate-950/20 min-h-0">
              {/* Left - Graph */}
              <div className="flex-1 flex flex-col rounded-lg bg-slate-900/40 border border-indigo-500/20 overflow-hidden min-w-0 min-h-0">
                <div style={{ width: '100%', height: '100%', display: 'block', position: 'relative' }}>
                  <GraphVisualizer />
                </div>
              </div>

              {/* Right - Controls & Debug */}
              <div className="w-96 flex flex-col gap-4 overflow-y-auto custom-scrollbar min-h-0">
                {/* Control Panel */}
                <div className="rounded-lg bg-slate-900/40 border border-indigo-500/20 overflow-hidden">
                  <ControlPanel />
                </div>

                {/* Debug Panel */}
                <div className="flex-1 rounded-lg bg-slate-900/40 border border-indigo-500/20 overflow-hidden">
                  <DebugPanel />
                </div>
              </div>
            </div>

            {/* Algorithm Explainer Overlay */}
            <AlgorithmExplainer />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
