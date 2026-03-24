'use client';

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { tracks } from '@/data/courses';
import {
  Lightbulb,
  Brain,
  Target,
  ChevronDown,
  ChevronUp,
  Search,
  XCircle,
  Mountain,
  Dna,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Zap,
  BookOpen,
  HelpCircle,
} from 'lucide-react';

// Beginner-friendly definitions for algorithm concepts
const glossary: Record<string, string> = {
  'open list': 'A waiting list of nodes the algorithm hasn\'t checked yet. Think of it like a to-do list — the algorithm picks the best one to check next.',
  'closed list': 'Nodes the algorithm has already fully checked. They won\'t be checked again to avoid going in circles.',
  'heuristic': 'An educated guess about how far we are from the goal. It helps the algorithm make smart choices about which path to try first.',
  'f-score': 'The total estimated cost: how much it cost to get here (g) plus how far we think we still need to go (h). Lower is better!',
  'g-score': 'The actual cost to reach this node from the starting point. It measures how much "effort" we\'ve spent so far.',
  'h-score': 'The estimated cost from this node to the goal. It\'s a prediction — the algorithm uses it to prioritize promising paths.',
  'backtracking': 'Going back to a previous decision because the current path hit a dead end. Like retracing your steps in a maze.',
  'constraint': 'A rule that must be satisfied. For example: "You must learn Python before Machine Learning."',
  'fitness': 'A score measuring how good a solution is. Higher fitness means a better learning path.',
  'mutation': 'A random small change to a solution, like swapping two courses. It helps explore new possibilities.',
  'crossover': 'Combining two good solutions to create a new one, hoping the child inherits the best parts of both parents.',
  'local maximum': 'A point where all nearby solutions are worse, but it\'s not the best overall. The algorithm might be "stuck on a hill" that isn\'t the highest.',
  'population': 'A group of candidate solutions that evolve together. Each individual represents a different possible learning path.',
  'generation': 'One round of evolution in the genetic algorithm. Each generation produces better solutions through selection, crossover, and mutation.',
};

// Algorithm-specific teaching content
const algorithmTeaching: Record<string, { name: string; icon: React.ReactNode; color: string; keyIdea: string; howItWorks: string[] }> = {
  astar: {
    name: 'A* Search',
    icon: <Search size={16} />,
    color: '#2563eb',
    keyIdea: 'A* finds the optimal path by always expanding the most promising node first, using f(n) = g(n) + h(n).',
    howItWorks: [
      'Calculate cost from start (g) and estimate to goal (h) for each node',
      'Always pick the node with the lowest total score f = g + h',
      'Expand that node and discover its neighbors',
      'Repeat until we\'ve built the optimal path',
    ],
  },
  csp: {
    name: 'Constraint Satisfaction',
    icon: <XCircle size={16} />,
    color: '#dc2626',
    keyIdea: 'CSP finds a valid assignment by checking constraints and backtracking when rules are violated.',
    howItWorks: [
      'Try assigning a value to the next variable (course)',
      'Check if all constraints (prerequisites, time limits) are satisfied',
      'If a constraint is violated, undo the last choice (backtrack)',
      'Continue until all courses are assigned valid positions',
    ],
  },
  hillClimbing: {
    name: 'Hill Climbing',
    icon: <Mountain size={16} />,
    color: '#d97706',
    keyIdea: 'Hill Climbing greedily moves to the best neighbor, like climbing a hill by always stepping upward.',
    howItWorks: [
      'Start with a random solution (learning path)',
      'Look at all neighboring solutions (small changes)',
      'Move to the neighbor with the best fitness score',
      'If no neighbor is better, we\'re at a local maximum — restart!',
    ],
  },
  genetic: {
    name: 'Genetic Algorithm',
    icon: <Dna size={16} />,
    color: '#7c3aed',
    keyIdea: 'Genetic Algorithm evolves a population of solutions using natural selection, crossover, and mutation.',
    howItWorks: [
      'Create a population of random learning paths',
      'Evaluate each path\'s fitness (quality score)',
      'Select the best paths as parents',
      'Create children via crossover + mutation, repeat for many generations',
    ],
  },
};

function GlossaryTerm({ term }: { term: string }) {
  const [show, setShow] = useState(false);
  const definition = glossary[term.toLowerCase()];
  if (!definition) return <span>{term}</span>;

  return (
    <span
      className="glossary-term"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {term}
      <HelpCircle size={11} className="glossary-icon" />
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="glossary-tooltip"
          >
            <strong>{term}</strong>
            <p>{definition}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
}

export default function StepExplainer() {
  const { algorithmResult, currentStepIndex, preferences, selectedAlgorithm, goToStep } = useStore();
  const [showConcept, setShowConcept] = useState(true);

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

  const totalSteps = algorithmResult?.steps.length || 0;
  const teaching = algorithmTeaching[selectedAlgorithm];

  if (!currentStep) {
    return (
      <div className="step-explainer">
        <div className="step-explainer-empty">
          <BookOpen size={32} className="text-slate-300" />
          <p>Generate a learning path to see the algorithm in action!</p>
          <p className="text-xs text-slate-400 mt-1">Each step will be explained in simple terms</p>
        </div>
      </div>
    );
  }

  const currentNode = currentStep.currentNodeId ? nodeMap.get(currentStep.currentNodeId) : null;
  const progress = totalSteps > 0 ? ((currentStepIndex + 1) / totalSteps) * 100 : 0;
  const isLastStep = currentStepIndex === totalSteps - 1;

  // Determine step type for visual styling
  const getStepType = () => {
    const desc = currentStep.description.toLowerCase();
    if (desc.includes('initialize') || desc.includes('start')) return 'init';
    if (desc.includes('complete') || desc.includes('optimal') || desc.includes('done')) return 'complete';
    if (desc.includes('skip') || desc.includes('reject') || desc.includes('backtrack')) return 'reject';
    if (desc.includes('expand') || desc.includes('select') || desc.includes('assign')) return 'select';
    if (desc.includes('evaluate') || desc.includes('neighbor') || desc.includes('discover')) return 'explore';
    if (desc.includes('mutation') || desc.includes('crossover')) return 'evolve';
    if (desc.includes('generation') || desc.includes('population')) return 'evolve';
    return 'default';
  };

  const stepType = getStepType();
  const stepTypeConfig: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
    init: { icon: <Zap size={16} />, label: 'Initialization', color: '#2563eb' },
    complete: { icon: <CheckCircle2 size={16} />, label: 'Complete!', color: '#16a34a' },
    reject: { icon: <AlertTriangle size={16} />, label: 'Rejected / Backtrack', color: '#dc2626' },
    select: { icon: <Target size={16} />, label: 'Node Selected', color: '#16a34a' },
    explore: { icon: <Search size={16} />, label: 'Exploring', color: '#d97706' },
    evolve: { icon: <Dna size={16} />, label: 'Evolution', color: '#7c3aed' },
    default: { icon: <Brain size={16} />, label: 'Processing', color: '#64748b' },
  };

  const typeInfo = stepTypeConfig[stepType] || stepTypeConfig.default;

  return (
    <div className="step-explainer">
      {/* Step Timeline (left rail) + Content (right) */}
      <div className="step-explainer-layout">
        {/* Mini step timeline */}
        <div className="step-timeline-rail">
          <div className="step-timeline-track">
            {algorithmResult?.steps.map((step, idx) => {
              const isActive = idx === currentStepIndex;
              const isPast = idx < currentStepIndex;
              return (
                <button
                  key={idx}
                  className={`step-timeline-dot ${isActive ? 'active' : ''} ${isPast ? 'past' : ''}`}
                  onClick={() => goToStep(idx)}
                  title={`Step ${step.stepNumber}: ${step.description}`}
                >
                  {isActive && (
                    <motion.div
                      className="step-dot-pulse"
                      animate={{ scale: [1, 1.5, 1], opacity: [1, 0.3, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  )}
                </button>
              );
            })}
          </div>
          <div className="step-timeline-progress" style={{ height: `${progress}%` }} />
        </div>

        {/* Main content area */}
        <div className="step-explainer-content">
          {/* Step header */}
          <div className="step-header">
            <div className="step-badge" style={{ background: `${typeInfo.color}15`, color: typeInfo.color, borderColor: `${typeInfo.color}30` }}>
              {typeInfo.icon}
              <span>{typeInfo.label}</span>
            </div>
            <div className="step-counter">
              Step {currentStepIndex + 1} of {totalSteps}
            </div>
          </div>

          {/* What's Happening */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`what-${currentStep.stepNumber}`}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="step-section"
            >
              <div className="step-section-header">
                <Lightbulb size={14} className="step-section-icon" />
                <span>What&apos;s Happening</span>
              </div>
              <p className="step-what-text">{currentStep.description}</p>

              {/* Current node info */}
              {currentNode && (
                <div className="step-current-node">
                  <div className="step-node-name">
                    <Target size={13} style={{ color: typeInfo.color }} />
                    {currentNode.label}
                  </div>
                  <div className="step-node-meta">
                    <span>Level {currentNode.difficulty}/10</span>
                    <span>•</span>
                    <span>{currentNode.estimatedHours}h</span>
                    <span>•</span>
                    <span>{currentNode.category}</span>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Why This Decision */}
          {currentStep.decisionDetails && (
            <AnimatePresence mode="wait">
              <motion.div
                key={`why-${currentStep.stepNumber}`}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2, delay: 0.05 }}
                className="step-section step-why"
              >
                <div className="step-section-header">
                  <Brain size={14} className="step-section-icon" />
                  <span>Why This Decision</span>
                </div>
                <p className="step-why-text">{currentStep.decisionDetails}</p>
              </motion.div>
            </AnimatePresence>
          )}

          {/* Algorithm-specific visual data */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`data-${currentStep.stepNumber}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              {/* A* Score Bars */}
              {selectedAlgorithm === 'astar' && currentStep.currentNodeId && currentStep.gScores?.get(currentStep.currentNodeId) !== undefined && (
                <div className="step-scores-visual">
                  <div className="step-score-bar-item">
                    <div className="step-score-bar-header">
                      <span className="step-score-bar-label" style={{ color: '#2563eb' }}>
                        <GlossaryTerm term="g-score" /> (cost so far)
                      </span>
                      <span className="step-score-bar-value" style={{ color: '#2563eb' }}>
                        {currentStep.gScores.get(currentStep.currentNodeId)?.toFixed(1)}
                      </span>
                    </div>
                    <div className="step-score-bar-track">
                      <motion.div
                        className="step-score-bar-fill"
                        style={{ background: '#2563eb' }}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, (currentStep.gScores.get(currentStep.currentNodeId)! / 20) * 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="step-score-bar-item">
                    <div className="step-score-bar-header">
                      <span className="step-score-bar-label" style={{ color: '#7c3aed' }}>
                        <GlossaryTerm term="h-score" /> (estimated remaining)
                      </span>
                      <span className="step-score-bar-value" style={{ color: '#7c3aed' }}>
                        {currentStep.hScores?.get(currentStep.currentNodeId)?.toFixed(1)}
                      </span>
                    </div>
                    <div className="step-score-bar-track">
                      <motion.div
                        className="step-score-bar-fill"
                        style={{ background: '#7c3aed' }}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, ((currentStep.hScores?.get(currentStep.currentNodeId) || 0) / 20) * 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="step-score-bar-item">
                    <div className="step-score-bar-header">
                      <span className="step-score-bar-label" style={{ color: '#d97706' }}>
                        <GlossaryTerm term="f-score" /> (total estimate)
                      </span>
                      <span className="step-score-bar-value" style={{ color: '#d97706' }}>
                        {currentStep.fScores?.get(currentStep.currentNodeId)?.toFixed(1)}
                      </span>
                    </div>
                    <div className="step-score-bar-track">
                      <motion.div
                        className="step-score-bar-fill"
                        style={{ background: '#d97706' }}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, ((currentStep.fScores?.get(currentStep.currentNodeId) || 0) / 30) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* A* Open List visual */}
              {selectedAlgorithm === 'astar' && currentStep.openList.length > 0 && (
                <div className="step-list-visual">
                  <div className="step-list-header">
                    <GlossaryTerm term="Open List" />
                    <span className="step-list-count">{currentStep.openList.length} candidates</span>
                  </div>
                  <div className="step-list-items">
                    {currentStep.openList.slice(0, 5).map((id, i) => {
                      const node = nodeMap.get(id);
                      const fScore = currentStep.fScores?.get(id);
                      return (
                        <div key={id} className="step-list-chip">
                          <span className="step-list-chip-rank">#{i + 1}</span>
                          <span className="step-list-chip-name">{node?.label || id}</span>
                          {fScore !== undefined && <span className="step-list-chip-score">f={fScore.toFixed(1)}</span>}
                        </div>
                      );
                    })}
                    {currentStep.openList.length > 5 && (
                      <div className="step-list-chip step-list-more">+{currentStep.openList.length - 5} more</div>
                    )}
                  </div>
                </div>
              )}

              {/* CSP Violations */}
              {selectedAlgorithm === 'csp' && currentStep.violations && currentStep.violations.length > 0 && (
                <div className="step-violations">
                  <div className="step-violations-header">
                    <AlertTriangle size={14} />
                    <span><GlossaryTerm term="Constraint" /> Violations ({currentStep.violations.length})</span>
                  </div>
                  {currentStep.violations.map((v, i) => (
                    <div key={i} className="step-violation-item">{v}</div>
                  ))}
                </div>
              )}

              {selectedAlgorithm === 'csp' && currentStep.isBacktracking && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="step-backtrack-alert"
                >
                  <AlertTriangle size={16} />
                  <div>
                    <strong><GlossaryTerm term="Backtracking" /></strong>
                    <p>The current path violates a constraint. Going back to try a different choice.</p>
                  </div>
                </motion.div>
              )}

              {/* Hill Climbing */}
              {selectedAlgorithm === 'hillClimbing' && (
                <>
                  {currentStep.currentScore !== undefined && (
                    <div className="step-hill-score">
                      <span className="step-hill-label"><GlossaryTerm term="Fitness" /> Score</span>
                      <div className="step-hill-bar-track">
                        <motion.div
                          className="step-hill-bar-fill"
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, (currentStep.currentScore / 50) * 100)}%` }}
                        />
                      </div>
                      <span className="step-hill-value">{currentStep.currentScore.toFixed(1)}</span>
                    </div>
                  )}
                  {currentStep.neighbors && currentStep.neighbors.length > 0 && (
                    <div className="step-list-visual">
                      <div className="step-list-header">
                        Neighbor Solutions
                        <span className="step-list-count">{currentStep.neighbors.length} options</span>
                      </div>
                      <div className="step-list-items">
                        {currentStep.neighbors.slice(0, 4).map((n, i) => (
                          <div key={i} className="step-list-chip">
                            <span className="step-list-chip-name">{nodeMap.get(n.id)?.label || n.id}</span>
                            <span className="step-list-chip-score">score={n.score.toFixed(1)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {currentStep.isLocalMaximum && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="step-local-max-alert"
                    >
                      <Mountain size={16} />
                      <div>
                        <strong><GlossaryTerm term="Local Maximum" /> Reached!</strong>
                        <p>No neighboring solution is better. The algorithm will restart from a random point.</p>
                      </div>
                    </motion.div>
                  )}
                </>
              )}

              {/* Genetic Algorithm */}
              {selectedAlgorithm === 'genetic' && (
                <>
                  {currentStep.generation !== undefined && (
                    <div className="step-generation-badge">
                      <Dna size={14} />
                      <GlossaryTerm term="Generation" /> {currentStep.generation}
                    </div>
                  )}
                  {currentStep.population && (
                    <div className="step-list-visual">
                      <div className="step-list-header">
                        <GlossaryTerm term="Population" />
                        <span className="step-list-count">{currentStep.population.length} individuals</span>
                      </div>
                      <div className="step-list-items">
                        {currentStep.population.slice(0, 4).map((ind, i) => (
                          <div key={i} className="step-list-chip">
                            <span className="step-list-chip-rank">#{i + 1}</span>
                            <span className="step-list-chip-name">{ind.path.length} topics</span>
                            <span className="step-list-chip-score">
                              <GlossaryTerm term="fitness" />={ind.fitness.toFixed(1)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {currentStep.mutationApplied && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="step-mutation-alert"
                    >
                      <Zap size={16} />
                      <div>
                        <strong><GlossaryTerm term="Mutation" /> Applied!</strong>
                        <p>A random change was made to introduce diversity and explore new solutions.</p>
                      </div>
                    </motion.div>
                  )}
                </>
              )}

              {/* Current Path */}
              {currentStep.currentPath.length > 0 && (
                <div className="step-path-visual">
                  <div className="step-path-label">Current Learning Path</div>
                  <div className="step-path-flow">
                    {currentStep.currentPath.map((id, i) => (
                      <React.Fragment key={id}>
                        {i > 0 && <ArrowRight size={12} className="step-path-arrow" />}
                        <span className={`step-path-chip ${id === currentStep.currentNodeId ? 'active' : ''}`}>
                          {nodeMap.get(id)?.label || id}
                        </span>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Algorithm concept card (collapsible) */}
          <div className="step-concept-card">
            <button
              className="step-concept-toggle"
              onClick={() => setShowConcept(!showConcept)}
              style={{ borderColor: `${teaching.color}20` }}
            >
              <div className="step-concept-toggle-left" style={{ color: teaching.color }}>
                {teaching.icon}
                <span>Learn: How {teaching.name} Works</span>
              </div>
              {showConcept ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            <AnimatePresence>
              {showConcept && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="step-concept-body"
                >
                  <p className="step-concept-idea">{teaching.keyIdea}</p>
                  <div className="step-concept-steps">
                    {teaching.howItWorks.map((step, i) => (
                      <div key={i} className="step-concept-step">
                        <div className="step-concept-step-num" style={{ background: `${teaching.color}15`, color: teaching.color }}>
                          {i + 1}
                        </div>
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
