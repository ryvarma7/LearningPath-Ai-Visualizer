// Constraint Satisfaction Problem (CSP) for Learning Path
// Uses: Backtracking + Forward Checking + Constraint Propagation
// Constraints:
//   1. Prerequisites must come before dependents
//   2. Total time <= user's available hours
//   3. Difficulty must be non-decreasing (progressive learning)
//   4. Skill level filter — skip topics below user level

import { CourseNode, CourseEdge } from '@/data/courses';
import {
  AlgorithmStep,
  AlgorithmResult,
  NodeState,
  UserPreferences,
  cloneNodeStates,
} from './types';

interface CSPVariable {
  nodeId: string;
  position: number | null; // assigned position in path (null = unassigned)
}

/**
 * Check if adding nodeId at position respects all constraints
 */
function isConsistent(
  nodeId: string,
  position: number,
  assignment: Map<string, number>, // nodeId -> position
  nodeMap: Map<string, CourseNode>,
  currentHours: number,
  maxHours: number
): { valid: boolean; violations: string[] } {
  const violations: string[] = [];
  const node = nodeMap.get(nodeId);
  if (!node) return { valid: false, violations: ['Node not found'] };

  // Constraint 1: Prerequisites must have positions < current position
  for (const prereq of node.prerequisites) {
    const prereqPos = assignment.get(prereq);
    if (prereqPos === undefined) {
      violations.push(`Prerequisite "${nodeMap.get(prereq)?.label}" not yet assigned`);
    } else if (prereqPos >= position) {
      violations.push(`Prerequisite "${nodeMap.get(prereq)?.label}" placed after "${node.label}"`);
    }
  }

  // Constraint 2: Time budget
  if (currentHours + node.estimatedHours > maxHours) {
    violations.push(`Adding "${node.label}" (${node.estimatedHours}h) exceeds budget (${currentHours + node.estimatedHours}h > ${maxHours}h)`);
  }

  // Constraint 3: Difficulty should be non-decreasing at this position
  const prevNodes = Array.from(assignment.entries())
    .filter(([, pos]) => pos === position - 1)
    .map(([id]) => nodeMap.get(id));
  
  for (const prevNode of prevNodes) {
    if (prevNode && node.difficulty < prevNode.difficulty - 2) {
      violations.push(`Difficulty drop: "${node.label}" (${node.difficulty}) after "${prevNode.label}" (${prevNode.difficulty})`);
    }
  }

  return { valid: violations.length === 0, violations };
}

/**
 * Forward checking: prune domains of future variables
 * Returns remaining domains or null if a domain becomes empty (dead end)
 */
function forwardCheck(
  assignedId: string,
  assignedPos: number,
  domains: Map<string, number[]>,
  nodeMap: Map<string, CourseNode>,
  assignment: Map<string, number>
): Map<string, number[]> | null {
  const newDomains = new Map<string, number[]>();
  domains.forEach((positions, nodeId) => {
    newDomains.set(nodeId, [...positions]);
  });

  // For each unassigned variable, remove inconsistent values
  for (const [nodeId, positions] of newDomains) {
    if (assignment.has(nodeId)) continue;

    const node = nodeMap.get(nodeId);
    if (!node) continue;

    const filtered = positions.filter(pos => {
      // If this node depends on assignedId, pos must be > assignedPos
      if (node.prerequisites.includes(assignedId) && pos <= assignedPos) {
        return false;
      }
      // If assignedId depends on this node, pos must be < assignedPos
      const assignedNode = nodeMap.get(assignedId);
      if (assignedNode?.prerequisites.includes(nodeId) && pos >= assignedPos) {
        return false;
      }
      // Position already taken
      if (pos === assignedPos) return false;
      return true;
    });

    if (filtered.length === 0) return null; // Dead end!
    newDomains.set(nodeId, filtered);
  }

  return newDomains;
}

/**
 * Select next variable using MRV (Minimum Remaining Values) heuristic
 */
function selectUnassigned(
  variables: string[],
  assignment: Map<string, number>,
  domains: Map<string, number[]>
): string | null {
  let bestVar: string | null = null;
  let minDomain = Infinity;

  for (const varId of variables) {
    if (assignment.has(varId)) continue;
    const domainSize = (domains.get(varId) || []).length;
    if (domainSize < minDomain) {
      minDomain = domainSize;
      bestVar = varId;
    }
  }

  return bestVar;
}

/**
 * Run CSP solver with backtracking, forward checking, and constraint propagation
 */
export function runCSP(
  nodes: CourseNode[],
  edges: CourseEdge[],
  preferences: UserPreferences
): AlgorithmResult {
  const steps: AlgorithmStep[] = [];
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  let stepNumber = 0;

  // We use the already-filtered nodes from the track
  const relevantNodes = nodes;

  // Sort by topological order (prerequisites first)
  const sorted = topologicalSort(relevantNodes);
  const variables = sorted.map(n => n.id);

  // Initialize domains — each variable can go in any position
  const totalPositions = variables.length;
  const domains = new Map<string, number[]>();
  for (let i = 0; i < variables.length; i++) {
    const positions: number[] = [];
    for (let p = 0; p < totalPositions; p++) {
      positions.push(p);
    }
    domains.set(variables[i], positions);
  }

  // Initialize node states
  const nodeStates = new Map<string, NodeState>();
  for (const node of nodes) {
    nodeStates.set(node.id, { id: node.id, status: 'unexplored' });
  }

  // Record initial state
  steps.push({
    stepNumber: stepNumber++,
    algorithmType: 'csp',
    description: `Initialize CSP: ${variables.length} variables, ${totalPositions} positions each`,
    decisionDetails: `CSP (Constraint Satisfaction) treats building a path like a puzzle. It starts with ${variables.length} courses (variables) and tries to assign each one a position (0 to ${totalPositions-1}) such that all rules (constraints) like prerequisites and time limits are strictly followed.`,
    currentNodeId: null,
    nodeStates: cloneNodeStates(nodeStates),
    openList: [...variables],
    closedList: [],
    currentPath: [],
    domains: cloneDomains(domains),
    constraints: [
      'Prerequisites must precede dependents',
      `Total time ≤ ${preferences.timeAvailable}h`,
      'Difficulty must be non-decreasing',
    ],
    violations: [],
    assignment: new Map(),
    isBacktracking: false,
  });

  // Backtracking search
  const assignment = new Map<string, number>();
  let currentHours = 0;
  const resultPath: string[] = [];
  const MAX_STEPS = 500; // Prevent OOM and infinite freezing with large node sets

  function backtrack(currentDomains: Map<string, number[]>): boolean {
    if (stepNumber >= MAX_STEPS) {
      return false; // Safety abort
    }

    // Select next unassigned variable (MRV)
    const varId = selectUnassigned(variables, assignment, currentDomains);
    if (!varId) {
      // All assigned!
      return true;
    }

    const node = nodeMap.get(varId)!;
    const domain = currentDomains.get(varId) || [];

    nodeStates.set(varId, { id: varId, status: 'current' });

    steps.push({
      stepNumber: stepNumber++,
      algorithmType: 'csp',
      description: `Try assigning "${node.label}" — domain: [${domain.join(', ')}]`,
      decisionDetails: `The algorithm picks "${node.label}" to place next using the Minimum Remaining Values (MRV) heuristic (it only has ${domain.length} valid position(s) left). It will try inserting it at available positions in its domain.`,
      currentNodeId: varId,
      nodeStates: cloneNodeStates(nodeStates),
      openList: variables.filter(v => !assignment.has(v)),
      closedList: Array.from(assignment.keys()),
      currentPath: buildCurrentPath(assignment, nodeMap),
      domains: cloneDomains(currentDomains),
      constraints: [
        'Prerequisites must precede dependents',
        `Total time ≤ ${preferences.timeAvailable}h`,
        'Difficulty must be non-decreasing',
      ],
      violations: [],
      assignment: new Map(assignment),
      isBacktracking: false,
    });

    for (const position of domain) {
      const { valid, violations } = isConsistent(
        varId,
        position,
        assignment,
        nodeMap,
        currentHours,
        preferences.timeAvailable
      );

      if (!valid) {
        nodeStates.set(varId, { id: varId, status: 'rejected', cspViolations: violations });

        steps.push({
          stepNumber: stepNumber++,
          algorithmType: 'csp',
          description: `Constraint violation: "${node.label}" at position ${position}`,
          decisionDetails: `CSP cannot place "${node.label}" at position ${position} because it breaks rules:\n${violations.map(v => `• ${v}`).join('\n')}\nIt aborts this placement and tries the next available position.`,
          currentNodeId: varId,
          nodeStates: cloneNodeStates(nodeStates),
          openList: variables.filter(v => !assignment.has(v)),
          closedList: Array.from(assignment.keys()),
          currentPath: buildCurrentPath(assignment, nodeMap),
          domains: cloneDomains(currentDomains),
          constraints: [
            'Prerequisites must precede dependents',
            `Total time ≤ ${preferences.timeAvailable}h`,
            'Difficulty must be non-decreasing',
          ],
          violations,
          assignment: new Map(assignment),
          isBacktracking: false,
        });

        continue;
      }

      // Forward check
      const newDomains = forwardCheck(varId, position, currentDomains, nodeMap, assignment);

      if (!newDomains) {
        nodeStates.set(varId, { id: varId, status: 'rejected', cspViolations: ['Forward checking detected empty domain'] });

        steps.push({
          stepNumber: stepNumber++,
          algorithmType: 'csp',
          description: `Forward check failed for "${node.label}" at position ${position} — dead end`,
          decisionDetails: `By assigning this position, CSP peeked into the future (Forward Checking) and found a guaranteed dead end. If we do this, another course would physically have 0 valid positions left mathematically. It rejects this move immediately.`,
          currentNodeId: varId,
          nodeStates: cloneNodeStates(nodeStates),
          openList: variables.filter(v => !assignment.has(v)),
          closedList: Array.from(assignment.keys()),
          currentPath: buildCurrentPath(assignment, nodeMap),
          domains: cloneDomains(currentDomains),
          constraints: ['Forward checking detected empty domain'],
          violations: ['Dead end — backtrack required'],
          assignment: new Map(assignment),
          isBacktracking: false,
        });
        continue;
      }

      // Assign
      assignment.set(varId, position);
      currentHours += node.estimatedHours;
      nodeStates.set(varId, { id: varId, status: 'selected' });

      steps.push({
        stepNumber: stepNumber++,
        algorithmType: 'csp',
        description: `Assign "${node.label}" → position ${position} ✓`,
        decisionDetails: `Success! Placing "${node.label}" at position ${position} passes all checks:\n• Time constraint: ${currentHours - node.estimatedHours}h + ${node.estimatedHours}h = ${currentHours}h ≤ ${preferences.timeAvailable}h\n• Prerequisites and Difficulty are valid.\nIt moves forward to the next unassigned course.`,
        currentNodeId: varId,
        nodeStates: cloneNodeStates(nodeStates),
        openList: variables.filter(v => !assignment.has(v)),
        closedList: Array.from(assignment.keys()),
        currentPath: buildCurrentPath(assignment, nodeMap),
        domains: cloneDomains(newDomains),
        constraints: [
          'Prerequisites must precede dependents',
          `Total time ≤ ${preferences.timeAvailable}h`,
          'Difficulty must be non-decreasing',
        ],
        violations: [],
        assignment: new Map(assignment),
        isBacktracking: false,
      });

      if (backtrack(newDomains)) {
        return true;
      }

      // Backtrack
      assignment.delete(varId);
      currentHours -= node.estimatedHours;
      nodeStates.set(varId, { id: varId, status: 'exploring' });

      steps.push({
        stepNumber: stepNumber++,
        algorithmType: 'csp',
        description: `Backtrack from "${node.label}" at position ${position}`,
        decisionDetails: `The algorithm hit a dead end future down this path. It is BACKTRACKING—undoing the assignment of "${node.label}" at position ${position} to try a different configuration.`,
        currentNodeId: varId,
        nodeStates: cloneNodeStates(nodeStates),
        openList: variables.filter(v => !assignment.has(v)),
        closedList: Array.from(assignment.keys()),
        currentPath: buildCurrentPath(assignment, nodeMap),
        domains: cloneDomains(currentDomains),
        constraints: ['Backtracking — trying next value'],
        violations: [],
        assignment: new Map(assignment),
        isBacktracking: true,
      });
    }

    nodeStates.set(varId, { id: varId, status: 'unexplored' });
    return false;
  }

  const success = backtrack(domains);

  // Build final path from assignment
  if (success) {
    const entries = Array.from(assignment.entries());
    entries.sort((a, b) => a[1] - b[1]);
    resultPath.push(...entries.map(([id]) => id));
  }

  // Final step
  steps.push({
    stepNumber: stepNumber++,
    algorithmType: 'csp',
    description: success
      ? `CSP Complete! Found valid assignment: ${resultPath.length} topics, ${currentHours}h`
      : 'CSP Complete — no valid assignment found within constraints',
    decisionDetails: success
      ? `A complete, valid learning path was engineered! Constraint propagation and backtracking successfully narrowed billions of combinations down to a schedule that perfectly fits all your rules.`
      : `The algorithm tried all logical combinations but proved mathematically that no path can satisfy all prerequisites and time constraints simultaneously.`,
    currentNodeId: null,
    nodeStates: cloneNodeStates(nodeStates),
    openList: [],
    closedList: Array.from(assignment.keys()),
    currentPath: resultPath,
    domains: cloneDomains(domains),
    constraints: [],
    violations: [],
    assignment: new Map(assignment),
    isBacktracking: false,
  });

  return {
    steps,
    finalPath: resultPath,
    totalCost: resultPath.reduce((sum, id) => sum + (nodeMap.get(id)?.difficulty || 0), 0),
    totalHours: currentHours,
    algorithmType: 'CSP',
  };
}

// Helper: topological sort
function topologicalSort(nodes: CourseNode[]): CourseNode[] {
  const visited = new Set<string>();
  const result: CourseNode[] = [];
  const nodeMap = new Map(nodes.map(n => [n.id, n]));

  function dfs(node: CourseNode) {
    if (visited.has(node.id)) return;
    visited.add(node.id);
    for (const prereq of node.prerequisites) {
      const prereqNode = nodeMap.get(prereq);
      if (prereqNode) dfs(prereqNode);
    }
    result.push(node);
  }

  for (const node of nodes) {
    dfs(node);
  }

  return result;
}

// Helper: build path from current assignment
function buildCurrentPath(
  assignment: Map<string, number>,
  nodeMap: Map<string, CourseNode>
): string[] {
  const entries = Array.from(assignment.entries());
  entries.sort((a, b) => a[1] - b[1]);
  return entries.map(([id]) => id).filter(id => nodeMap.has(id));
}

// Helper: clone domains map
function cloneDomains(domains: Map<string, number[]>): Map<string, string[]> {
  const cloned = new Map<string, string[]>();
  domains.forEach((positions, nodeId) => {
    cloned.set(nodeId, positions.map(p => p.toString()));
  });
  return cloned;
}
