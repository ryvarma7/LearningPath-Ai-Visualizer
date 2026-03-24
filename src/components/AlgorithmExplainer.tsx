'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { BrainCircuit, Info, MessageSquareText } from 'lucide-react';

export default function AlgorithmExplainer() {
  const { algorithmResult, currentStepIndex, isFullscreenMode } = useStore();

  const currentStep = React.useMemo(() => {
    if (!algorithmResult || currentStepIndex < 0) return null;
    return algorithmResult.steps[currentStepIndex] || null;
  }, [algorithmResult, currentStepIndex]);

  if (!isFullscreenMode || !currentStep) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentStep.stepNumber}
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-3xl z-50 pointer-events-none"
      >
        <div className="bg-white/95 backdrop-blur-sm border border-gray-200 shadow-xl rounded-2xl overflow-hidden pointer-events-auto">
          {/* Header */}
          <div className="bg-slate-50 px-6 py-3 border-b border-gray-200 flex items-center gap-3">
            <div className="bg-slate-700/10 p-2 rounded-lg text-slate-700">
              <BrainCircuit size={20} />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-0.5">
                Algorithm Reasoning • Step {currentStep.stepNumber}
              </div>
              <h3 className="text-lg font-bold text-slate-900 leading-tight">
                {currentStep.description}
              </h3>
            </div>
          </div>

          {/* Details */}
          {currentStep.decisionDetails && (
            <div className="px-6 py-4 flex gap-4 items-start bg-gray-50/50">
              <MessageSquareText size={20} className="text-slate-600 shrink-0 mt-1" />
              <div className="text-slate-700 text-sm leading-relaxed">
                {currentStep.decisionDetails}
              </div>
            </div>
          )}
          
          {!currentStep.decisionDetails && (
            <div className="px-6 py-3 flex gap-3 items-center bg-gray-50/50 text-slate-500 text-sm">
              <Info size={16} />
              <span>Processing...</span>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
