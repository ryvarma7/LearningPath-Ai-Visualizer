// Shared types for all algorithm implementations

import { CourseNode } from '@/data/courses';

export type NodeStatus = 'unexplored' | 'exploring' | 'current' | 'selected' | 'rejected';

export interface NodeState {
  id: string;
  status: NodeStatus;
  gScore?: number;   // cost from start
  hScore?: number;   // heuristic to goal
  fScore?: number;   // g + h
  fitness?: number;  // for genetic algorithm
  cspViolations?: string[]; // for CSP
}

export interface AlgorithmStep {
  stepNumber: number;
  algorithmType: 'astar' | 'csp' | 'hillClimbing' | 'genetic';
  description: string;
  decisionDetails?: string; // Clear human-readable explanation of why this step happened
  currentNodeId: string | null;
  nodeStates: Map<string, NodeState>;
  openList: string[];
  closedList: string[];
  currentPath: string[];
  // A* specific
  gScores?: Map<string, number>;
  hScores?: Map<string, number>;
  fScores?: Map<string, number>;
  // CSP specific
  domains?: Map<string, string[]>;
  constraints?: string[];
  violations?: string[];
  assignment?: Map<string, number>;
  isBacktracking?: boolean;
  // Hill Climbing specific
  neighbors?: Array<{ id: string; score: number }>;
  currentScore?: number;
  isLocalMaximum?: boolean;
  restartCount?: number;
  // Genetic Algorithm specific
  population?: Array<{ path: string[]; fitness: number }>;
  generation?: number;
  selectedParents?: [string[], string[]];
  crossoverResult?: string[];
  mutationApplied?: boolean;
}

export interface AlgorithmResult {
  steps: AlgorithmStep[];
  finalPath: string[];
  totalCost: number;
  totalHours: number;
  algorithmType: string;
}

export interface UserPreferences {
  skillLevel: number; // 1-5 (beginner to advanced)
  goalTrack: string;
  timeAvailable: number; // total hours
  learningStyle: 'visual' | 'hands-on' | 'theoretical' | 'balanced' | 'mixed';
  selectedCourse?: string; // optional: filter to a specific course
}

// Utility: convert Map to serializable object
export function mapToObj<V>(map: Map<string, V>): Record<string, V> {
  const obj: Record<string, V> = {};
  map.forEach((v, k) => { obj[k] = v; });
  return obj;
}

// Utility: clone a Map
export function cloneMap<V>(map: Map<string, V>): Map<string, V> {
  return new Map(map);
}

// Utility: clone NodeState map
export function cloneNodeStates(states: Map<string, NodeState>): Map<string, NodeState> {
  const cloned = new Map<string, NodeState>();
  states.forEach((state, id) => {
    cloned.set(id, { ...state });
  });
  return cloned;
}
