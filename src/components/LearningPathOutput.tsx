'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { tracks } from '@/data/courses';
import { Route, Clock, BarChart3, ExternalLink, Trophy } from 'lucide-react';

export default function LearningPathOutput() {
  const { algorithmResult, preferences } = useStore();
  const track = useMemo(
    () => tracks.find((t) => t.id === preferences.goalTrack),
    [preferences.goalTrack]
  );
  const nodeMap = useMemo(
    () => new Map(track?.nodes.map(n => [n.id, n]) || []),
    [track]
  );

  // Check if the algorithm reached the final step
  const currentStep = useStore(s => {
    if (!s.algorithmResult || s.currentStepIndex < 0) return null;
    return s.algorithmResult.steps[s.currentStepIndex];
  });

  if (!algorithmResult || algorithmResult.finalPath.length === 0) {
    return null;
  }

  const isFinished = currentStep?.stepNumber === algorithmResult.steps[algorithmResult.steps.length - 1]?.stepNumber;

  if (!isFinished) return null;

  const pathNodes = algorithmResult.finalPath
    .map(id => nodeMap.get(id))
    .filter(Boolean);
  
  const totalHours = pathNodes.reduce((s, n) => s + (n?.estimatedHours || 0), 0);
  const avgDifficulty = pathNodes.reduce((s, n) => s + (n?.difficulty || 0), 0) / pathNodes.length;
  const weeksNeeded = Math.ceil(totalHours / 15); // ~15h/week

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 150, damping: 20 }}
      className="glass-panel learning-path-output"
    >
      <h2 className="panel-title">
        <Trophy size={18} />
        Your Optimized Learning Path
      </h2>

      {/* Summary stats */}
      <div className="path-stats">
        <div className="stat-card">
          <Route size={20} />
          <div className="stat-value">{pathNodes.length}</div>
          <div className="stat-label">Topics</div>
        </div>
        <div className="stat-card">
          <Clock size={20} />
          <div className="stat-value">{totalHours}h</div>
          <div className="stat-label">Est. Time</div>
        </div>
        <div className="stat-card">
          <BarChart3 size={20} />
          <div className="stat-value">{avgDifficulty.toFixed(1)}</div>
          <div className="stat-label">Avg Difficulty</div>
        </div>
        <div className="stat-card">
          <Trophy size={20} />
          <div className="stat-value">{weeksNeeded}w</div>
          <div className="stat-label">@ 15h/week</div>
        </div>
      </div>

      {/* Difficulty progression chart */}
      <div className="difficulty-chart">
        <h3 className="chart-title">Difficulty Progression</h3>
        <div className="chart-bars">
          {pathNodes.map((node, i) => (
            <motion.div
              key={node!.id}
              initial={{ height: 0 }}
              animate={{ height: `${(node!.difficulty / 10) * 100}%` }}
              transition={{ delay: i * 0.05, type: 'spring', stiffness: 200 }}
              className="chart-bar"
              style={{
                background: `linear-gradient(to top, 
                  ${node!.difficulty <= 3 ? '#16a34a' : node!.difficulty <= 6 ? '#d97706' : '#dc2626'}, 
                  ${node!.difficulty <= 3 ? '#15803d' : node!.difficulty <= 6 ? '#b45309' : '#991b1b'})`,
              }}
              title={`${node!.label}: Level ${node!.difficulty}`}
            />
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="path-timeline">
        {pathNodes.map((node, i) => (
          <motion.div
            key={node!.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="timeline-item"
          >
            <div className="timeline-connector">
              <div className="timeline-dot" style={{
                background: node!.difficulty <= 3 ? '#16a34a' : node!.difficulty <= 6 ? '#d97706' : '#dc2626',
              }} />
              {i < pathNodes.length - 1 && <div className="timeline-line" />}
            </div>
            <div className="timeline-content">
              <div className="timeline-header">
                <span className="timeline-step">Step {i + 1}</span>
                <span className="timeline-hours">{node!.estimatedHours}h</span>
              </div>
              <div className="timeline-title">{node!.label}</div>
              <div className="timeline-desc">{node!.description}</div>
              <a
                href={node!.courseUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="timeline-link"
              >
                {node!.coursePlatform} <ExternalLink size={12} />
              </a>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
