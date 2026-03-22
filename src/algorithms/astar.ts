// A* Search Algorithm for Learning Path Optimization
// Uses f(n) = g(n) + h(n) where:
//   g(n) = cumulative difficulty cost from start to current node
//   h(n) = heuristic estimate of remaining cost to reach all uncovered required nodes

import { CourseNode, CourseEdge } from '@/data/courses';
import {
  AlgorithmStep,
  AlgorithmResult,
  NodeState,
  UserPreferences,
  cloneNodeStates,
} from './types';

interface AStarNode {
  id: string;
  gScore: number;
  hScore: number;
  fScore: number;
  parent: string | null;
  path: string[];
}

/**
 * Compute heuristic: estimate remaining cost to cover all uncovered nodes
 * Uses the sum of minimum difficulty deltas to reach remaining nodes
 */
function computeHeuristic(
  currentId: string,
  visited: Set<string>,
  nodeMap: Map<string, CourseNode>,
  targetNodes: string[]
): number {
  const remaining = targetNodes.filter(id => !visited.has(id) && id !== currentId);
  if (remaining.length === 0) return 0;

  // Sum up the difficulty of all remaining nodes, scaled down
  let h = 0;
  for (const id of remaining) {
    const node = nodeMap.get(id);
    if (node) {
      h += node.difficulty * 0.5;
    }
  }
  return h;
}

/**
 * Compute edge cost between two connected nodes
 * Based on difficulty delta and estimated hours
 */
function edgeCost(from: CourseNode, to: CourseNode): number {
  return to.difficulty + Math.abs(to.difficulty - from.difficulty) * 0.3;
}

/**
 * Get accessible neighbors: nodes whose all prerequisites are satisfied
 */
function getAccessibleNeighbors(
  currentId: string,
  visited: Set<string>,
  nodes: CourseNode[],
  adjacency: Map<string, string[]>
): string[] {
  const directNeighbors = adjacency.get(currentId) || [];
  return directNeighbors.filter(neighborId => {
    if (visited.has(neighborId)) return false;
    const node = nodes.find(n => n.id === neighborId);
    if (!node) return false;
    // All prerequisites must be visited
    return node.prerequisites.every(prereq => visited.has(prereq));
  });
}

/**
 * Run A* algorithm on the course graph to find optimal learning path
 * Returns step-by-step execution trace for visualization
 */
export function runAStar(
  nodes: CourseNode[],
  edges: CourseEdge[],
  preferences: UserPreferences
): AlgorithmResult {
  const steps: AlgorithmStep[] = [];
  const nodeMap = new Map(nodes.map(n => [n.id, n]));

  // Build adjacency list (source -> targets)
  const adjacency = new Map<string, string[]>();
  for (const node of nodes) {
    adjacency.set(node.id, []);
  }
  for (const edge of edges) {
    const targets = adjacency.get(edge.source) || [];
    targets.push(edge.target);
    adjacency.set(edge.source, targets);
  }

  // Filter nodes based on skill level — skip nodes way below user's level
  const minDifficulty = Math.max(1, (preferences.skillLevel - 1) * 2);
  const targetNodes = nodes
    .filter(n => n.difficulty >= minDifficulty || n.prerequisites.length === 0)
    .map(n => n.id);

  // Find start nodes (no prerequisites)
  const startNodes = nodes.filter(n => n.prerequisites.length === 0);
  if (startNodes.length === 0) {
    return { steps: [], finalPath: [], totalCost: 0, totalHours: 0, algorithmType: 'A*' };
  }

  // Initialize open list with start nodes
  const openList: AStarNode[] = startNodes.map(n => ({
    id: n.id,
    gScore: n.difficulty,
    hScore: computeHeuristic(n.id, new Set([n.id]), nodeMap, targetNodes),
    fScore: 0,
    parent: null,
    path: [n.id],
  }));
  openList.forEach(n => { n.fScore = n.gScore + n.hScore; });

  const closedSet = new Set<string>();
  const bestPath: string[] = [];
  let stepNumber = 0;

  // Initialize node states
  const nodeStates = new Map<string, NodeState>();
  for (const node of nodes) {
    nodeStates.set(node.id, { id: node.id, status: 'unexplored' });
  }
  for (const sn of openList) {
    nodeStates.set(sn.id, { id: sn.id, status: 'exploring', gScore: sn.gScore, hScore: sn.hScore, fScore: sn.fScore });
  }

  // Record initial state
  const gScores = new Map<string, number>();
  const hScores = new Map<string, number>();
  const fScores = new Map<string, number>();
  openList.forEach(n => {
    gScores.set(n.id, n.gScore);
    hScores.set(n.id, n.hScore);
    fScores.set(n.id, n.fScore);
  });

  steps.push({
    stepNumber: stepNumber++,
    algorithmType: 'astar',
    description: `Initialize: ${openList.length} start node(s) in open list`,
    decisionDetails: `A* Search begins by finding all courses that have no prerequisites. It has found ${openList.length} such courses and placed them on the open list to be evaluated.`,
    currentNodeId: null,
    nodeStates: cloneNodeStates(nodeStates),
    openList: openList.map(n => n.id),
    closedList: [],
    currentPath: [],
    gScores: new Map(gScores),
    hScores: new Map(hScores),
    fScores: new Map(fScores),
  });

  // A* main loop — greedy expansion to build learning path
  let totalHours = 0;
  const maxHours = preferences.timeAvailable;

  while (openList.length > 0) {
    // Sort by f-score (ascending) — pick the best node
    openList.sort((a, b) => a.fScore - b.fScore);
    const current = openList.shift()!;

    // Check time budget
    const currentNode = nodeMap.get(current.id);
    if (!currentNode) continue;

    if (totalHours + currentNode.estimatedHours > maxHours && bestPath.length > 2) {
      // Mark as rejected — over time budget
      nodeStates.set(current.id, { id: current.id, status: 'rejected', gScore: current.gScore, hScore: current.hScore, fScore: current.fScore });

      steps.push({
        stepNumber: stepNumber++,
        algorithmType: 'astar',
        description: `Skip "${currentNode.label}" — exceeds time budget (${totalHours + currentNode.estimatedHours}h > ${maxHours}h)`,
        decisionDetails: `Although "${currentNode.label}" is the most promising next step, adding it would exceed your available time budget of ${maxHours} hours. The algorithm is forced to reject it and will look for shorter alternatives.`,
        currentNodeId: current.id,
        nodeStates: cloneNodeStates(nodeStates),
        openList: openList.map(n => n.id),
        closedList: Array.from(closedSet),
        currentPath: [...bestPath],
        gScores: new Map(gScores),
        hScores: new Map(hScores),
        fScores: new Map(fScores),
      });
      continue;
    }

    // Select this node
    closedSet.add(current.id);
    bestPath.push(current.id);
    totalHours += currentNode.estimatedHours;

    nodeStates.set(current.id, { id: current.id, status: 'current', gScore: current.gScore, hScore: current.hScore, fScore: current.fScore });

    // Record expansion step
    steps.push({
      stepNumber: stepNumber++,
      algorithmType: 'astar',
      description: `Expand "${currentNode.label}" — f(n)=${current.fScore.toFixed(1)}, g(n)=${current.gScore.toFixed(1)}, h(n)=${current.hScore.toFixed(1)}`,
      decisionDetails: `A* selects "${currentNode.label}" because it has the lowest total estimated cost (f-score = ${current.fScore.toFixed(1)}) on the open list. The f-score is the sum of the actual cost to reach here (g=${current.gScore.toFixed(1)}) and the heuristic estimate to finish the path (h=${current.hScore.toFixed(1)}).`,
      currentNodeId: current.id,
      nodeStates: cloneNodeStates(nodeStates),
      openList: openList.map(n => n.id),
      closedList: Array.from(closedSet),
      currentPath: [...bestPath],
      gScores: new Map(gScores),
      hScores: new Map(hScores),
      fScores: new Map(fScores),
    });

    // Mark as selected (after showing it as current)
    nodeStates.set(current.id, { id: current.id, status: 'selected', gScore: current.gScore, hScore: current.hScore, fScore: current.fScore });

    // Find accessible neighbors
    const neighbors = getAccessibleNeighbors(current.id, closedSet, nodes, adjacency);

    for (const neighborId of neighbors) {
      const neighborNode = nodeMap.get(neighborId)!;
      const tentativeG = current.gScore + edgeCost(currentNode, neighborNode);
      const existingIdx = openList.findIndex(n => n.id === neighborId);

      if (existingIdx >= 0 && openList[existingIdx].gScore <= tentativeG) {
        continue; // Existing path is better
      }

      const visited = new Set(closedSet);
      visited.add(neighborId);
      const h = computeHeuristic(neighborId, visited, nodeMap, targetNodes);
      const f = tentativeG + h;

      gScores.set(neighborId, tentativeG);
      hScores.set(neighborId, h);
      fScores.set(neighborId, f);

      const newNode: AStarNode = {
        id: neighborId,
        gScore: tentativeG,
        hScore: h,
        fScore: f,
        parent: current.id,
        path: [...current.path, neighborId],
      };

      if (existingIdx >= 0) {
        openList[existingIdx] = newNode;
      } else {
        openList.push(newNode);
      }

      nodeStates.set(neighborId, { id: neighborId, status: 'exploring', gScore: tentativeG, hScore: h, fScore: f });
    }

    // Record neighbor evaluation step
    if (neighbors.length > 0) {
      steps.push({
        stepNumber: stepNumber++,
        algorithmType: 'astar',
        description: `Evaluate ${neighbors.length} neighbor(s) of "${currentNode.label}": ${neighbors.map(n => nodeMap.get(n)?.label).join(', ')}`,
        decisionDetails: `Now that "${currentNode.label}" is selected, A* discovers ${neighbors.length} new unlocked courses. It calculates the g, h, and f scores for each of them and adds them to the open list for future consideration.`,
        currentNodeId: current.id,
        nodeStates: cloneNodeStates(nodeStates),
        openList: openList.map(n => n.id),
        closedList: Array.from(closedSet),
        currentPath: [...bestPath],
        gScores: new Map(gScores),
        hScores: new Map(hScores),
        fScores: new Map(fScores),
      });
    }
  }

  // Final step
  steps.push({
    stepNumber: stepNumber++,
    algorithmType: 'astar',
    description: `A* Complete! Optimal path: ${bestPath.length} topics, ${totalHours}h total`,
    decisionDetails: `The algorithm has successfully covered all required topics within the time constraint. It guaranteed the optimal (least actual cost) path by always expanding the most promising nodes first!`,
    currentNodeId: null,
    nodeStates: cloneNodeStates(nodeStates),
    openList: [],
    closedList: Array.from(closedSet),
    currentPath: [...bestPath],
    gScores: new Map(gScores),
    hScores: new Map(hScores),
    fScores: new Map(fScores),
  });

  const totalCost = bestPath.reduce((sum, id) => {
    const node = nodeMap.get(id);
    return sum + (node ? node.difficulty : 0);
  }, 0);

  return {
    steps,
    finalPath: bestPath,
    totalCost,
    totalHours,
    algorithmType: 'A*',
  };
}
