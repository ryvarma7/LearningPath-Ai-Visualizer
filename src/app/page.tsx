'use client';

import React from 'react';
import { motion } from 'framer-motion';
import UserInputPanel from '@/components/UserInputPanel';
import GraphVisualizer from '@/components/GraphVisualizer';
import ControlPanel from '@/components/ControlPanel';
import DebugPanel from '@/components/DebugPanel';
import FullscreenVisualizer from '@/components/FullscreenVisualizer';
import LearningPathOutput from '@/components/LearningPathOutput';
import { useStore } from '@/store/useStore';
import Image from 'next/image';

export default function Home() {
  const algorithmResult = useStore((s) => s.algorithmResult);

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="logo">
          <div className="logo-icon">
            <Image src="/BrainLogo.png" alt="PathFinder AI Logo" width={32} height={32} />
          </div>
          <div className="logo-text">
            <span>PathFinder AI</span>
          </div>
        </div>
        <div className="header-badge">Algorithm Visualizer v1.0</div>
      </header>

      {/* Main Layout */}
      <div className="main-layout">
        {/* Left Panel — User Input */}
        <div className="left-panel">
          <UserInputPanel />
        </div>

        {/* Center Panel — Graph + Controls */}
        <div className="center-panel">
          <ControlPanel />
          {algorithmResult ? (
            <GraphVisualizer />
          ) : (
            <motion.div
              className="empty-visualizer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="empty-icon">🧠</div>
              <div className="empty-text">Configure & Generate</div>
              <div className="empty-subtext">
                Select a track, set your preferences, and click Generate to see the algorithm in action
              </div>
            </motion.div>
          )}
          {algorithmResult && <LearningPathOutput />}
        </div>

        {/* Right Panel — Debug */}
        <div className="right-panel">
          <DebugPanel />
        </div>
      </div>

      {/* Fullscreen Visualizer Modal */}
      <FullscreenVisualizer />
    </div>
  );
}
