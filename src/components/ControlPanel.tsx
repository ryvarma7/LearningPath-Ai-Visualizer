'use client';

import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useStore, type AlgorithmType } from '@/store/useStore';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  RotateCcw,
  Gauge,
  GitCompare,
} from 'lucide-react';

const algorithms: { value: AlgorithmType; label: string; description: string }[] = [
  { value: 'astar', label: 'A* Search', description: 'f(n) = g(n) + h(n)' },
  { value: 'csp', label: 'CSP', description: 'Backtracking + Forward Checking' },
  { value: 'hillClimbing', label: 'Hill Climbing', description: 'Local Search + Restarts' },
  { value: 'genetic', label: 'Genetic Algorithm', description: 'Population Evolution' },
];

export default function ControlPanel() {
  const {
    selectedAlgorithm,
    setSelectedAlgorithm,
    algorithmResult,
    currentStepIndex,
    isPlaying,
    speed,
    setSpeed,
    play,
    pause,
    stepForward,
    stepBackward,
    reset,
    comparisonMode,
    toggleComparisonMode,
    generatePath,
  } = useStore();

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const totalSteps = algorithmResult?.steps.length || 0;

  // Auto-play timer
  useEffect(() => {
    if (isPlaying && algorithmResult) {
      intervalRef.current = setInterval(() => {
        const state = useStore.getState();
        if (state.currentStepIndex < (state.algorithmResult?.steps.length || 0) - 1) {
          state.stepForward();
        } else {
          state.pause();
        }
      }, 1000 / speed);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, speed, algorithmResult]);

  const progress = totalSteps > 0 ? ((currentStepIndex + 1) / totalSteps) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 25, delay: 0.1 }}
      className="glass-panel control-panel"
    >
      {/* Algorithm Selector */}
      <div className="algo-selector">
        {algorithms.map((algo) => (
          <motion.button
            key={algo.value}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`algo-chip ${selectedAlgorithm === algo.value ? 'active' : ''}`}
            onClick={() => {
              setSelectedAlgorithm(algo.value);
              if (algorithmResult) generatePath();
            }}
          >
            <span className="algo-chip-label">{algo.label}</span>
            <span className="algo-chip-desc">{algo.description}</span>
          </motion.button>
        ))}
      </div>

      {/* Progress bar */}
      {algorithmResult && (
        <div className="progress-container">
          <div className="progress-bar">
            <motion.div
              className="progress-fill"
              animate={{ width: `${progress}%` }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
          </div>
          <span className="progress-text">
            Step {currentStepIndex + 1} / {totalSteps}
          </span>
        </div>
      )}

      {/* Playback Controls */}
      <div className="controls-row">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={reset}
          className="control-btn"
          disabled={!algorithmResult}
          title="Reset"
        >
          <RotateCcw size={18} />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={stepBackward}
          className="control-btn"
          disabled={!algorithmResult || currentStepIndex <= 0}
          title="Step Back"
        >
          <SkipBack size={18} />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={isPlaying ? pause : play}
          className="control-btn primary"
          disabled={!algorithmResult}
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <Pause size={22} /> : <Play size={22} />}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={stepForward}
          className="control-btn"
          disabled={!algorithmResult || currentStepIndex >= totalSteps - 1}
          title="Step Forward"
        >
          <SkipForward size={18} />
        </motion.button>

        {/* Speed control */}
        <div className="speed-control">
          <Gauge size={14} />
          <input
            type="range"
            min="0.5"
            max="5"
            step="0.5"
            value={speed}
            onChange={(e) => setSpeed(parseFloat(e.target.value))}
            className="speed-slider"
          />
          <span className="speed-label">{speed}x</span>
        </div>

        {/* Comparison mode toggle */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleComparisonMode}
          className={`control-btn comparison-btn ${comparisonMode ? 'active' : ''}`}
          title="Compare A* vs Hill Climbing"
        >
          <GitCompare size={16} />
        </motion.button>
      </div>
    </motion.div>
  );
}
