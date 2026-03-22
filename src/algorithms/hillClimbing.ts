// Hill Climbing Algorithm for Learning Path Optimization
// Evaluates neighbor states and moves toward better solutions
// Detects local maxima and performs random restarts

import { CourseNode, CourseEdge } from '@/data/courses';
import {
  AlgorithmStep,
  AlgorithmResult,
  NodeState,
  UserPreferences,
  cloneNodeStates,
} from './types';

/**
 * Score a learning path based on multiple factors:
 * - Coverage: how many relevant topics are included
 * - Difficulty progression: smooth increase is better
 * - Time fit: closer to budget is better (without exceeding)
 * - Prerequisite satisfaction: all prereqs met
 */
function scorePath(
  path: string[],
  nodeMap: Map<string, CourseNode>,
  preferences: UserPreferences,
  totalNodes: number
): number {
  if (path.length === 0) return 0;

  let score = 0;

  // Coverage score (0-40)
  const coverage = path.length / totalNodes;
  score += coverage * 40;

  // Difficulty progression score (0-25)
  let progressionScore = 25;
  for (let i = 1; i < path.length; i++) {
    const prev = nodeMap.get(path[i - 1]);
    const curr = nodeMap.get(path[i]);
    if (prev && curr) {
      const diff = curr.difficulty - prev.difficulty;
      if (diff < -2) progressionScore -= 5; // Penalty for big difficulty drops
      else if (diff >= 0 && diff <= 2) progressionScore += 0; // Good progression
    }
  }
  score += Math.max(0, progressionScore);

  // Time fit score (0-20)
  const totalHours = path.reduce((sum, id) => sum + (nodeMap.get(id)?.estimatedHours || 0), 0);
  const timeRatio = totalHours / preferences.timeAvailable;
  if (timeRatio > 1) {
    score -= (timeRatio - 1) * 30; // Penalty for exceeding budget
  } else {
    score += timeRatio * 20; // Reward for using available time
  }

  // Prerequisite satisfaction (0-15)
  const completed = new Set<string>();
  let prereqScore = 15;
  for (const id of path) {
    const node = nodeMap.get(id);
    if (node) {
      for (const prereq of node.prerequisites) {
        if (!completed.has(prereq)) {
          prereqScore -= 3;
        }
      }
      completed.add(id);
    }
  }
  score += Math.max(0, prereqScore);

  return Math.max(0, score);
}

/**
 * Generate neighbor states by applying small modifications to current path
 */
function getNeighbors(
  currentPath: string[],
  allNodes: CourseNode[],
  nodeMap: Map<string, CourseNode>
): string[][] {
  const neighbors: string[][] = [];
  const pathSet = new Set(currentPath);

  // Move 1: Add an accessible node
  for (const node of allNodes) {
    if (pathSet.has(node.id)) continue;
    const prereqsMet = node.prerequisites.every(p => pathSet.has(p));
    if (prereqsMet) {
      // Find correct insertion point
      const newPath = [...currentPath];
      let insertIdx = newPath.length;
      for (let i = 0; i < newPath.length; i++) {
        if ((nodeMap.get(newPath[i])?.difficulty || 0) > node.difficulty) {
          insertIdx = i;
          break;
        }
      }
      newPath.splice(insertIdx, 0, node.id);
      neighbors.push(newPath);
    }
  }

  // Move 2: Remove a non-prerequisite node (from the end)
  if (currentPath.length > 1) {
    for (let i = currentPath.length - 1; i >= 0; i--) {
      const nodeId = currentPath[i];
      // Check if any later node depends on this one
      const isDependency = currentPath.slice(i + 1).some(laterId => {
        const laterNode = nodeMap.get(laterId);
        return laterNode?.prerequisites.includes(nodeId);
      });
      if (!isDependency) {
        const newPath = currentPath.filter((_, idx) => idx !== i);
        neighbors.push(newPath);
      }
    }
  }

  // Move 3: Swap adjacent nodes (if prerequisites allow)
  for (let i = 0; i < currentPath.length - 1; i++) {
    const newPath = [...currentPath];
    const a = newPath[i];
    const b = newPath[i + 1];
    // Can swap only if b doesn't depend on a
    const bNode = nodeMap.get(b);
    if (bNode && !bNode.prerequisites.includes(a)) {
      const aNode = nodeMap.get(a);
      if (aNode && !aNode.prerequisites.includes(b)) {
        newPath[i] = b;
        newPath[i + 1] = a;
        neighbors.push(newPath);
      }
    }
  }

  return neighbors;
}

/**
 * Run Hill Climbing algorithm with random restarts
 */
export function runHillClimbing(
  nodes: CourseNode[],
  edges: CourseEdge[],
  preferences: UserPreferences
): AlgorithmResult {
  const steps: AlgorithmStep[] = [];
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  let stepNumber = 0;
  const maxRestarts = 3;
  let restartCount = 0;

  // Filter relevant nodes
  const minDifficulty = Math.max(1, (preferences.skillLevel - 1) * 2);
  const relevantNodes = nodes.filter(n => 
    n.difficulty >= minDifficulty || n.prerequisites.length === 0
  );

  // Initialize node states
  const nodeStates = new Map<string, NodeState>();
  for (const node of nodes) {
    nodeStates.set(node.id, { id: node.id, status: 'unexplored' });
  }

  // Start with root nodes (no prerequisites)
  let currentPath = relevantNodes
    .filter(n => n.prerequisites.length === 0)
    .map(n => n.id);
  let currentScore = scorePath(currentPath, nodeMap, preferences, relevantNodes.length);

  // Mark initial nodes
  for (const id of currentPath) {
    nodeStates.set(id, { id, status: 'selected' });
  }

  steps.push({
    stepNumber: stepNumber++,
    algorithmType: 'hillClimbing',
    description: `Initialize with ${currentPath.length} root node(s), score: ${currentScore.toFixed(1)}`,
    decisionDetails: `Hill Climbing immediately builds a basic, valid learning path using root courses. It scores this initial path based on coverage, smooth difficulty progression, and time limit adherence. This creates our "basecamp" to climb from.`,
    currentNodeId: currentPath[0] || null,
    nodeStates: cloneNodeStates(nodeStates),
    openList: relevantNodes.filter(n => !currentPath.includes(n.id)).map(n => n.id),
    closedList: [],
    currentPath: [...currentPath],
    currentScore,
    neighbors: [],
    isLocalMaximum: false,
    restartCount: 0,
  });

  let bestPath = [...currentPath];
  let bestScore = currentScore;

  const maxIterations = 50; // safety limit
  let iteration = 0;

  while (iteration < maxIterations) {
    iteration++;

    // Generate neighbors
    const neighborPaths = getNeighbors(currentPath, relevantNodes, nodeMap);
    const scoredNeighbors = neighborPaths.map(path => ({
      path,
      score: scorePath(path, nodeMap, preferences, relevantNodes.length),
    }));

    // Sort by score descending
    scoredNeighbors.sort((a, b) => b.score - a.score);

    // Build neighbor info for visualization
    const neighborInfo = scoredNeighbors.slice(0, 5).map(n => {
      const lastNode = n.path[n.path.length - 1];
      const addedNodes = n.path.filter(id => !currentPath.includes(id));
      const removedNodes = currentPath.filter(id => !n.path.includes(id));
      let label = '';
      if (addedNodes.length > 0) label = `+${nodeMap.get(addedNodes[0])?.label}`;
      else if (removedNodes.length > 0) label = `-${nodeMap.get(removedNodes[0])?.label}`;
      else label = 'swap';
      return {
        id: label,
        score: n.score,
      };
    });

    // Update node states for exploring
    for (const node of relevantNodes) {
      if (!currentPath.includes(node.id)) {
        nodeStates.set(node.id, { id: node.id, status: 'unexplored' });
      }
    }
    // Mark top neighbor's new nodes as exploring
    if (scoredNeighbors.length > 0) {
      const topNeighbor = scoredNeighbors[0];
      for (const id of topNeighbor.path) {
        if (!currentPath.includes(id)) {
          nodeStates.set(id, { id, status: 'exploring' });
        }
      }
    }

    steps.push({
      stepNumber: stepNumber++,
      algorithmType: 'hillClimbing',
      description: `Evaluate ${scoredNeighbors.length} neighbors. Best neighbor score: ${scoredNeighbors[0]?.score.toFixed(1) || 'N/A'}`,
      decisionDetails: `The algorithm looks at "neighboring" paths by making tiny tweaks: adding a course, removing one, or swapping two. It scores all these variations to see if any point "uphill" to a better learning path.`,
      currentNodeId: currentPath[currentPath.length - 1] || null,
      nodeStates: cloneNodeStates(nodeStates),
      openList: relevantNodes.filter(n => !currentPath.includes(n.id)).map(n => n.id),
      closedList: [],
      currentPath: [...currentPath],
      currentScore,
      neighbors: neighborInfo,
      isLocalMaximum: false,
      restartCount,
    });

    // Check if best neighbor is better
    if (scoredNeighbors.length === 0 || scoredNeighbors[0].score <= currentScore) {
      // Local maximum!
      steps.push({
        stepNumber: stepNumber++,
        algorithmType: 'hillClimbing',
        description: `Local Maximum Reached! Restarting... Score: ${currentScore.toFixed(1)}. No better neighbor found.`,
        decisionDetails: `We reached a "peak" (a Local Maximum) where any small tweak makes the path strictly worse. However, there might be a higher peak elsewhere!`,
        currentNodeId: currentPath[currentPath.length - 1] || null,
        nodeStates: cloneNodeStates(nodeStates),
        openList: [],
        closedList: [],
        currentPath: [...currentPath],
        currentScore,
        neighbors: neighborInfo,
        isLocalMaximum: true,
        restartCount,
      });

      if (currentScore > bestScore) {
        bestScore = currentScore;
        bestPath = [...currentPath];
      }

      // Random restart
      if (restartCount < maxRestarts) {
        restartCount++;
        // Generate a different starting point
        const shuffled = [...relevantNodes].sort(() => Math.random() - 0.5);
        currentPath = [];
        const pathSet = new Set<string>();

        for (const node of shuffled) {
          const prereqsMet = node.prerequisites.every(p => pathSet.has(p));
          if (prereqsMet) {
            currentPath.push(node.id);
            pathSet.add(node.id);
          }
          if (currentPath.length >= 3) break;
        }

        currentScore = scorePath(currentPath, nodeMap, preferences, relevantNodes.length);

        // Reset node states
        for (const node of nodes) {
          nodeStates.set(node.id, { id: node.id, status: 'unexplored' });
        }
        for (const id of currentPath) {
          nodeStates.set(id, { id, status: 'selected' });
        }

        steps.push({
          stepNumber: stepNumber++,
          algorithmType: 'hillClimbing',
          description: `🔄 Random restart #${restartCount}. New starting score: ${currentScore.toFixed(1)}`,
          decisionDetails: `To escape the local maximum, the algorithm completely scrambles the starting point and drops us somewhere totally new. Let's see if climbing from here leads to a better overall path.`,
          currentNodeId: currentPath[0] || null,
          nodeStates: cloneNodeStates(nodeStates),
          openList: relevantNodes.filter(n => !currentPath.includes(n.id)).map(n => n.id),
          closedList: [],
          currentPath: [...currentPath],
          currentScore,
          neighbors: [],
          isLocalMaximum: false,
          restartCount,
        });
      } else {
        break; // No more restarts
      }
    } else {
      // Move to best neighbor
      const best = scoredNeighbors[0];
      currentPath = best.path;
      currentScore = best.score;

      // Update node states
      for (const node of nodes) {
        nodeStates.set(node.id, { id: node.id, status: 'unexplored' });
      }
      for (const id of currentPath) {
        nodeStates.set(id, { id, status: 'selected' });
      }

      if (currentScore > bestScore) {
        bestScore = currentScore;
        bestPath = [...currentPath];
      }

      steps.push({
        stepNumber: stepNumber++,
        algorithmType: 'hillClimbing',
        description: `Move to better state. New score: ${currentScore.toFixed(1)} (+${(currentScore - (scoredNeighbors[1]?.score || 0)).toFixed(1)})`,
        decisionDetails: `A neighboring path had a higher score! The algorithm discards the old path and "steps up" to this new variation. It will now repeat the process to see if it can climb even higher.`,
        currentNodeId: currentPath[currentPath.length - 1] || null,
        nodeStates: cloneNodeStates(nodeStates),
        openList: relevantNodes.filter(n => !currentPath.includes(n.id)).map(n => n.id),
        closedList: [],
        currentPath: [...currentPath],
        currentScore,
        neighbors: [],
        isLocalMaximum: false,
        restartCount,
      });
    }
  }

  // Use best path found across all restarts
  for (const node of nodes) {
    nodeStates.set(node.id, { id: node.id, status: bestPath.includes(node.id) ? 'selected' : 'unexplored' });
  }

  const totalHours = bestPath.reduce((sum, id) => sum + (nodeMap.get(id)?.estimatedHours || 0), 0);

  steps.push({
    stepNumber: stepNumber++,
    algorithmType: 'hillClimbing',
    description: `Hill Climbing Complete! Best score: ${bestScore.toFixed(1)}, ${bestPath.length} topics, ${totalHours}h total`,
    decisionDetails: `The algorithm finished climbing! It explored several different "hills" of the solution space and returned the single best learning path it could find within the time limit.`,
    currentNodeId: null,
    nodeStates: cloneNodeStates(nodeStates),
    openList: [],
    closedList: [],
    currentPath: bestPath,
    currentScore: bestScore,
    neighbors: [],
    isLocalMaximum: false,
    restartCount,
  });

  return {
    steps,
    finalPath: bestPath,
    totalCost: bestPath.reduce((sum, id) => sum + (nodeMap.get(id)?.difficulty || 0), 0),
    totalHours,
    algorithmType: 'Hill Climbing',
  };
}
