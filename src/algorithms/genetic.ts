// Genetic Algorithm for Learning Path Optimization
// Population of candidate paths evolve through selection, crossover, and mutation

import { CourseNode, CourseEdge } from '@/data/courses';
import {
  AlgorithmStep,
  AlgorithmResult,
  NodeState,
  UserPreferences,
  cloneNodeStates,
} from './types';

const POPULATION_SIZE = 8;
const MAX_GENERATIONS = 15;
const MUTATION_RATE = 0.3;
const CROSSOVER_RATE = 0.7;

/**
 * Fitness function: evaluate a candidate path
 */
function fitness(
  path: string[],
  nodeMap: Map<string, CourseNode>,
  preferences: UserPreferences,
  totalRelevant: number
): number {
  if (path.length === 0) return 0;

  let score = 0;

  // Coverage (0-35)
  score += (path.length / totalRelevant) * 35;

  // Prerequisite satisfaction (0-25)
  const seen = new Set<string>();
  let prereqViolations = 0;
  for (const id of path) {
    const node = nodeMap.get(id);
    if (node) {
      for (const p of node.prerequisites) {
        if (!seen.has(p) && path.includes(p)) prereqViolations++;
      }
      seen.add(id);
    }
  }
  score += Math.max(0, 25 - prereqViolations * 5);

  // Difficulty progression (0-20)
  let progression = 20;
  for (let i = 1; i < path.length; i++) {
    const prev = nodeMap.get(path[i - 1]);
    const curr = nodeMap.get(path[i]);
    if (prev && curr && curr.difficulty < prev.difficulty - 2) {
      progression -= 3;
    }
  }
  score += Math.max(0, progression);

  // Time fit (0-20)
  const totalHours = path.reduce((s, id) => s + (nodeMap.get(id)?.estimatedHours || 0), 0);
  const ratio = totalHours / preferences.timeAvailable;
  if (ratio > 1.2) score -= (ratio - 1) * 20;
  else if (ratio > 0.6) score += 20;
  else score += ratio * 20;

  return Math.max(0, score);
}

/**
 * Generate a random valid path
 */
function randomPath(nodes: CourseNode[], nodeMap: Map<string, CourseNode>, maxHours: number): string[] {
  const path: string[] = [];
  const pathSet = new Set<string>();
  let hours = 0;

  // Sort by difficulty, then randomize within tiers
  const shuffled = [...nodes].sort((a, b) => {
    const dDiff = a.difficulty - b.difficulty;
    if (Math.abs(dDiff) <= 1) return Math.random() - 0.5;
    return dDiff;
  });

  for (const node of shuffled) {
    if (pathSet.has(node.id)) continue;
    const prereqsMet = node.prerequisites.every(p => pathSet.has(p));
    if (!prereqsMet) continue;
    if (hours + node.estimatedHours > maxHours * 1.2) continue;

    path.push(node.id);
    pathSet.add(node.id);
    hours += node.estimatedHours;
  }

  return path;
}

/**
 * Tournament selection: pick 3 random, return the fittest
 */
function tournamentSelect(pop: Array<{ path: string[]; fitness: number }>): { path: string[]; fitness: number } {
  const tournament: typeof pop = [];
  for (let i = 0; i < 3; i++) {
    tournament.push(pop[Math.floor(Math.random() * pop.length)]);
  }
  tournament.sort((a, b) => b.fitness - a.fitness);
  return tournament[0];
}

/**
 * Order crossover (OX): combine two parent paths
 */
function crossover(
  parent1: string[],
  parent2: string[],
  nodeMap: Map<string, CourseNode>
): string[] {
  const allGenes = new Set([...parent1, ...parent2]);
  const child: string[] = [];
  const childSet = new Set<string>();

  // Take first half from parent1
  const cutPoint = Math.floor(parent1.length / 2);
  for (let i = 0; i < cutPoint && i < parent1.length; i++) {
    child.push(parent1[i]);
    childSet.add(parent1[i]);
  }

  // Fill remaining from parent2 in order
  for (const gene of parent2) {
    if (!childSet.has(gene)) {
      child.push(gene);
      childSet.add(gene);
    }
  }

  // Add any remaining from parent1
  for (const gene of parent1) {
    if (!childSet.has(gene)) {
      child.push(gene);
      childSet.add(gene);
    }
  }

  // Repair: ensure prerequisites come before dependents
  return repairPath(child, nodeMap);
}

/**
 * Mutation: swap two random positions, or add/remove a node
 */
function mutate(path: string[], allNodes: CourseNode[], nodeMap: Map<string, CourseNode>): string[] {
  const mutated = [...path];
  const r = Math.random();

  if (r < 0.4 && mutated.length > 1) {
    // Swap two positions
    const i = Math.floor(Math.random() * mutated.length);
    const j = Math.floor(Math.random() * mutated.length);
    [mutated[i], mutated[j]] = [mutated[j], mutated[i]];
  } else if (r < 0.7) {
    // Add a random node
    const pathSet = new Set(mutated);
    const candidates = allNodes.filter(n => !pathSet.has(n.id));
    if (candidates.length > 0) {
      const toAdd = candidates[Math.floor(Math.random() * candidates.length)];
      mutated.push(toAdd.id);
    }
  } else if (mutated.length > 2) {
    // Remove a random node from the end
    const idx = Math.floor(Math.random() * Math.floor(mutated.length / 2)) + Math.floor(mutated.length / 2);
    if (idx < mutated.length) mutated.splice(idx, 1);
  }

  return repairPath(mutated, nodeMap);
}

/**
 * Repair path: ensure topological order (prerequisites before dependents)
 */
function repairPath(path: string[], nodeMap: Map<string, CourseNode>): string[] {
  const result: string[] = [];
  const resultSet = new Set<string>();
  const remaining = [...path];
  let maxIter = remaining.length * 2;

  while (remaining.length > 0 && maxIter-- > 0) {
    for (let i = 0; i < remaining.length; i++) {
      const node = nodeMap.get(remaining[i]);
      if (!node) {
        remaining.splice(i, 1);
        i--;
        continue;
      }
      const prereqsMet = node.prerequisites.every(p => resultSet.has(p) || !path.includes(p));
      if (prereqsMet) {
        result.push(remaining[i]);
        resultSet.add(remaining[i]);
        remaining.splice(i, 1);
        i--;
      }
    }
  }

  return result;
}

/**
 * Run Genetic Algorithm for learning path optimization
 */
export function runGenetic(
  nodes: CourseNode[],
  edges: CourseEdge[],
  preferences: UserPreferences
): AlgorithmResult {
  const steps: AlgorithmStep[] = [];
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  let stepNumber = 0;

  // We use the already-filtered nodes from the track
  const relevantNodes = nodes;

  // Initialize node states
  const nodeStates = new Map<string, NodeState>();
  for (const node of nodes) {
    nodeStates.set(node.id, { id: node.id, status: 'unexplored' });
  }

  // Generate initial population
  let population: Array<{ path: string[]; fitness: number }> = [];
  for (let i = 0; i < POPULATION_SIZE; i++) {
    const path = randomPath(relevantNodes, nodeMap, preferences.timeAvailable);
    const f = fitness(path, nodeMap, preferences, relevantNodes.length);
    population.push({ path, fitness: f });
  }
  population.sort((a, b) => b.fitness - a.fitness);

  // Mark best individual's nodes
  if (population[0]) {
    for (const id of population[0].path) {
      nodeStates.set(id, { id, status: 'selected' });
    }
  }

  steps.push({
    stepNumber: stepNumber++,
    algorithmType: 'genetic',
    description: `Initialize population: ${POPULATION_SIZE} individuals. Best fitness: ${population[0]?.fitness.toFixed(1)}`,
    decisionDetails: `The Genetic Algorithm begins by randomly generating an initial "population" of ${POPULATION_SIZE} different valid learning paths. It calculates a "fitness" score for each path based on how well it meets your goals and constraints.`,
    currentNodeId: null,
    nodeStates: cloneNodeStates(nodeStates),
    openList: relevantNodes.map(n => n.id),
    closedList: [],
    currentPath: population[0]?.path || [],
    population: population.map(p => ({ path: [...p.path], fitness: p.fitness })),
    generation: 0,
  });

  // Evolution loop
  for (let gen = 1; gen <= MAX_GENERATIONS; gen++) {
    const newPopulation: typeof population = [];

    // Elitism: keep best individual
    newPopulation.push({ path: [...population[0].path], fitness: population[0].fitness });

    // Generate rest of new population
    while (newPopulation.length < POPULATION_SIZE) {
      const parent1 = tournamentSelect(population);
      const parent2 = tournamentSelect(population);

      let childPath: string[];
      let crossoverApplied = false;

      if (Math.random() < CROSSOVER_RATE) {
        childPath = crossover(parent1.path, parent2.path, nodeMap);
        crossoverApplied = true;
      } else {
        childPath = [...parent1.path];
      }

      let mutationApplied = false;
      if (Math.random() < MUTATION_RATE) {
        childPath = mutate(childPath, relevantNodes, nodeMap);
        mutationApplied = true;
      }

      const f = fitness(childPath, nodeMap, preferences, relevantNodes.length);
      newPopulation.push({ path: childPath, fitness: f });

      // Record crossover/mutation step (only for first child per generation to keep steps manageable)
      if (newPopulation.length === 2) {
        steps.push({
          stepNumber: stepNumber++,
          algorithmType: 'genetic',
          description: `Gen ${gen}: ${crossoverApplied ? 'Crossover' : 'Copy'} parents (fitness ${parent1.fitness.toFixed(1)} × ${parent2.fitness.toFixed(1)})${mutationApplied ? ' + Mutation' : ''}. Child fitness: ${f.toFixed(1)}`,
          decisionDetails: `Evolution in action! The algorithm selected two highly successful "parent" paths (Fitness: ${parent1.fitness.toFixed(1)} & ${parent2.fitness.toFixed(1)}) and combined their best characteristics (${crossoverApplied ? 'Crossover' : 'Copying'}). ${mutationApplied ? 'It also applied random tweaks (Mutation) to introduce fresh variety.' : 'No random mutations occurred this time.'} This produced a new "child" path with a fitness score of ${f.toFixed(1)}.`,
          currentNodeId: null,
          nodeStates: cloneNodeStates(nodeStates),
          openList: relevantNodes.map(n => n.id),
          closedList: [],
          currentPath: childPath,
          population: population.map(p => ({ path: [...p.path], fitness: p.fitness })),
          generation: gen,
          selectedParents: [parent1.path, parent2.path],
          crossoverResult: childPath,
          mutationApplied,
        });
      }
    }

    population = newPopulation;
    population.sort((a, b) => b.fitness - a.fitness);

    // Update node states for best individual
    for (const node of nodes) {
      nodeStates.set(node.id, { id: node.id, status: 'unexplored' });
    }
    for (const id of population[0].path) {
      nodeStates.set(id, { id, status: 'selected' });
    }

    steps.push({
      stepNumber: stepNumber++,
      algorithmType: 'genetic',
      description: `Generation ${gen} complete. Best fitness: ${population[0].fitness.toFixed(1)}, Avg: ${(population.reduce((s, p) => s + p.fitness, 0) / population.length).toFixed(1)}`,
      decisionDetails: `Generation ${gen} is finished! The fittest paths survived and successfully reproduced. The overall average quality of the learning paths continues to evolve upwards.`,
      currentNodeId: null,
      nodeStates: cloneNodeStates(nodeStates),
      openList: relevantNodes.map(n => n.id),
      closedList: [],
      currentPath: [...population[0].path],
      population: population.map(p => ({ path: [...p.path], fitness: p.fitness })),
      generation: gen,
    });
  }

  const bestPath = population[0].path;
  const totalHours = bestPath.reduce((s, id) => s + (nodeMap.get(id)?.estimatedHours || 0), 0);

  // Final step
  steps.push({
    stepNumber: stepNumber++,
    algorithmType: 'genetic',
    description: `GA Complete! Best fitness: ${population[0].fitness.toFixed(1)}, ${bestPath.length} topics, ${totalHours}h total`,
    decisionDetails: `Evolution is complete! Across ${MAX_GENERATIONS} generations, the algorithm continuously combined the best traits of different paths to breed this highly optimized syllabus for you. Survival of the fittest!`,
    currentNodeId: null,
    nodeStates: cloneNodeStates(nodeStates),
    openList: [],
    closedList: [],
    currentPath: bestPath,
    population: population.map(p => ({ path: [...p.path], fitness: p.fitness })),
    generation: MAX_GENERATIONS,
  });

  return {
    steps,
    finalPath: bestPath,
    totalCost: bestPath.reduce((s, id) => s + (nodeMap.get(id)?.difficulty || 0), 0),
    totalHours,
    algorithmType: 'Genetic Algorithm',
  };
}
