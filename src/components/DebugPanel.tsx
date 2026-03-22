'use client';

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { tracks } from '@/data/courses';
import { Bug, List, XCircle, Brain, Dna, Mountain, Search } from 'lucide-react';
import InfoTooltip from './InfoTooltip';

export default function DebugPanel() {
  const { algorithmResult, currentStepIndex, preferences, selectedAlgorithm } = useStore();
  
  const track = useMemo(
    () => tracks.find((t) => t.id === preferences.goalTrack),
    [preferences.goalTrack]
  );
  const nodeMap = useMemo(
    () => new Map(track?.nodes.map(n => [n.id, n]) || []),
    [track]
  );

  const currentStep = useMemo(() => {
    if (!algorithmResult || currentStepIndex < 0) return null;
    return algorithmResult.steps[currentStepIndex] || null;
  }, [algorithmResult, currentStepIndex]);

  if (!currentStep) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="glass-panel debug-panel"
      >
        <h2 className="panel-title">
          <Bug size={18} />
          Debug Panel
        </h2>
        <div className="debug-empty">
          <p>Generate a path to see algorithm internals</p>
        </div>
      </motion.div>
    );
  }

  const currentNode = currentStep.currentNodeId ? nodeMap.get(currentStep.currentNodeId) : null;
  const algoIcon = {
    astar: <Search size={16} />,
    csp: <XCircle size={16} />,
    hillClimbing: <Mountain size={16} />,
    genetic: <Dna size={16} />,
  }[selectedAlgorithm];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 25, delay: 0.2 }}
      className="glass-panel debug-panel"
    >
      <h2 className="panel-title">
        <Bug size={18} />
        Debug Panel
        <span className="algo-badge">{algoIcon} {algorithmResult?.algorithmType}</span>
      </h2>

      {/* Step description */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep.stepNumber}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="step-description p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg mb-4 text-sm text-indigo-100 leading-relaxed"
        >
          <div className="font-semibold text-indigo-300 mb-2">Step {currentStep.stepNumber}: {currentStep.description}</div>
          {currentStep.decisionDetails && (
            <div className="text-sm text-indigo-100 mb-2 pb-2 border-b border-indigo-500/20">
              {currentStep.decisionDetails}
            </div>
          )}
          {selectedAlgorithm === 'astar' && (
            <div className="text-xs text-indigo-200/80">
              A* Search explores the most promising nodes first, balancing between cost from start and estimated cost to goal.
            </div>
          )}
          {selectedAlgorithm === 'csp' && (
            <div className="text-xs text-indigo-200/80">
              Constraint Satisfaction Problem solving enforces constraints while exploring the solution space.
            </div>
          )}
          {selectedAlgorithm === 'hillClimbing' && (
            <div className="text-xs text-indigo-200/80">
              Hill Climbing greedily selects neighbors with better fitness scores to climb toward optimal solutions.
            </div>
          )}
          {selectedAlgorithm === 'genetic' && (
            <div className="text-xs text-indigo-200/80">
              Genetic Algorithm combines the best candidates through selection, crossover, and mutation.
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Current Node Info */}
      {currentNode && (
        <div className="debug-section">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="debug-section-title text-base font-semibold">📍 Current Node</h3>
            <InfoTooltip text="The node currently being processed by the algorithm in this step." size={14} />
          </div>
          <div className="debug-node-info">
            <div className="debug-node-name">{currentNode.label}</div>
            <div className="debug-node-meta text-sm text-indigo-200">
              <div>Difficulty: {currentNode.difficulty}/10 • {currentNode.estimatedHours}h • {currentNode.category}</div>
              {currentNode.description && <div className="mt-2 text-xs text-indigo-300/60">{currentNode.description}</div>}
            </div>
          </div>
        </div>
      )}

      {/* A* Scores */}
      {selectedAlgorithm === 'astar' && currentStep.gScores && (
        <div className="debug-section">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="debug-section-title text-base font-semibold">📊 A* Scores</h3>
            <InfoTooltip text="g(n) = cost from start, h(n) = heuristic to goal, f(n) = g(n) + h(n) total estimate" size={14} />
          </div>
          <div className="scores-grid">
            {currentStep.currentNodeId && currentStep.gScores.get(currentStep.currentNodeId) !== undefined && (
              <>
                <div className="score-item g-score">
                  <span className="score-label">g(n) Cost</span>
                  <span className="score-value">{currentStep.gScores.get(currentStep.currentNodeId)?.toFixed(1)}</span>
                </div>
                <div className="score-item h-score">
                  <span className="score-label">h(n) Est.</span>
                  <span className="score-value">{currentStep.hScores?.get(currentStep.currentNodeId)?.toFixed(1)}</span>
                </div>
                <div className="score-item f-score">
                  <span className="score-label">f(n) Total</span>
                  <span className="score-value">{currentStep.fScores?.get(currentStep.currentNodeId)?.toFixed(1)}</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Open List */}
      {(selectedAlgorithm === 'astar' || selectedAlgorithm === 'csp') && (
        <div className="debug-section">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="debug-section-title text-base font-semibold flex items-center gap-1">
              <List size={14} />
              Open List ({currentStep.openList.length})
            </h3>
            <InfoTooltip text="Frontier of nodes to explore next. Higher priority nodes evaluated first." size={14} />
          </div>
          <div className="debug-list">
            {currentStep.openList.slice(0, 8).map(id => {
              const node = nodeMap.get(id);
              const fScore = currentStep.fScores?.get(id);
              return (
                <motion.div key={id} className="debug-list-item open" layout>
                  <span>{node?.label || id}</span>
                  {fScore !== undefined && <span className="list-score">f={fScore.toFixed(1)}</span>}
                </motion.div>
              );
            })}
            {currentStep.openList.length > 8 && (
              <div className="debug-list-more">+{currentStep.openList.length - 8} more</div>
            )}
          </div>
        </div>
      )}

      {/* Closed List */}
      {currentStep.closedList.length > 0 && (selectedAlgorithm === 'astar' || selectedAlgorithm === 'csp') && (
        <div className="debug-section">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="debug-section-title text-base font-semibold">✓ Closed List ({currentStep.closedList.length})</h3>
            <InfoTooltip text="Nodes already explored. They won't be re-explored in this search." size={14} />
          </div>
          <div className="debug-list">
            {currentStep.closedList.slice(0, 6).map(id => {
              const node = nodeMap.get(id);
              return (
                <motion.div key={id} className="debug-list-item closed" layout>
                  <span>{node?.label || id}</span>
                </motion.div>
              );
            })}
            {currentStep.closedList.length > 6 && (
              <div className="debug-list-more">+{currentStep.closedList.length - 6} more</div>
            )}
          </div>
        </div>
      )}

      {/* CSP Constraints */}
      {selectedAlgorithm === 'csp' && currentStep.violations && currentStep.violations.length > 0 && (
        <div className="debug-section">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="debug-section-title text-base font-semibold violation-title flex items-center gap-1">
              <XCircle size={14} />
              Constraint Violations ({currentStep.violations.length})
            </h3>
            <InfoTooltip text="Prerequisites and dependencies that are not satisfied. Algorithm will backtrack." size={14} />
          </div>
          <div className="debug-list">
            {currentStep.violations.map((v, i) => (
              <div key={i} className="debug-list-item violation text-xs">{v}</div>
            ))}
          </div>
        </div>
      )}

      {selectedAlgorithm === 'csp' && currentStep.isBacktracking && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="backtrack-indicator"
        >
          Backtracking...
        </motion.div>
      )}

      {/* Hill Climbing */}
      {selectedAlgorithm === 'hillClimbing' && (
        <>
          {currentStep.currentScore !== undefined && (
            <div className="debug-section">
              <h3 className="debug-section-title">Current Score</h3>
              <div className="hill-score">{currentStep.currentScore.toFixed(1)}</div>
            </div>
          )}
          {currentStep.neighbors && currentStep.neighbors.length > 0 && (
            <div className="debug-section">
              <h3 className="debug-section-title">Top Neighbors</h3>
              <div className="debug-list">
                {currentStep.neighbors.map((n, i) => (
                  <div key={i} className="debug-list-item neighbor">
                    <span>{n.id}</span>
                    <span className="list-score">{n.score.toFixed(1)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {currentStep.isLocalMaximum && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="local-max-indicator">
              Local Maximum Reached
            </motion.div>
          )}
          {(currentStep.restartCount ?? 0) > 0 && (
            <div className="restart-count">Random Restarts: {currentStep.restartCount}</div>
          )}
        </>
      )}

      {/* Genetic Algorithm */}
      {selectedAlgorithm === 'genetic' && (
        <>
          {currentStep.generation !== undefined && (
            <div className="debug-section">
              <h3 className="debug-section-title">Generation {currentStep.generation}</h3>
            </div>
          )}
          {currentStep.population && (
            <div className="debug-section">
              <h3 className="debug-section-title">Population ({currentStep.population.length})</h3>
              <div className="debug-list">
                {currentStep.population.slice(0, 6).map((ind, i) => (
                  <div key={i} className="debug-list-item population">
                    <span>Individual {i + 1}</span>
                    <span className="list-score">fitness={ind.fitness.toFixed(1)}</span>
                    <span className="list-detail">{ind.path.length} topics</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {currentStep.mutationApplied && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mutation-indicator">
              Mutation Applied
            </motion.div>
          )}
        </>
      )}

      {/* Current Path */}
      {currentStep.currentPath.length > 0 && (
        <div className="debug-section">
          <h3 className="debug-section-title">Current Path ({currentStep.currentPath.length})</h3>
          <div className="path-flow">
            {currentStep.currentPath.map((id, i) => (
              <React.Fragment key={id}>
                {i > 0 && <span className="path-arrow">→</span>}
                <span className="path-node">{nodeMap.get(id)?.label || id}</span>
              </React.Fragment>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
