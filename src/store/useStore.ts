'use client';

import { create } from 'zustand';
import { AlgorithmStep, AlgorithmResult, UserPreferences } from '@/algorithms/types';
import { CourseNode } from '@/data/courses';
import { tracks } from '@/data/courses';
import { runAStar } from '@/algorithms/astar';
import { runCSP } from '@/algorithms/csp';
import { runHillClimbing } from '@/algorithms/hillClimbing';
import { runGenetic } from '@/algorithms/genetic';

export type AlgorithmType = 'astar' | 'csp' | 'hillClimbing' | 'genetic';

interface StoreState {
  // User Input
  preferences: UserPreferences;
  setPreferences: (prefs: Partial<UserPreferences>) => void;

  // Algorithm
  selectedAlgorithm: AlgorithmType;
  setSelectedAlgorithm: (algo: AlgorithmType) => void;
  algorithmResult: AlgorithmResult | null;
  currentStepIndex: number;

  // Playback controls
  isPlaying: boolean;
  speed: number; // 0.5 to 5
  setSpeed: (speed: number) => void;

  // Actions
  generatePath: () => void;
  play: () => void;
  pause: () => void;
  stepForward: () => void;
  stepBackward: () => void;
  reset: () => void;
  goToStep: (index: number) => void;

  // Computed
  currentStep: AlgorithmStep | null;
  totalSteps: number;
  isComplete: boolean;

  // Comparison mode
  comparisonMode: boolean;
  toggleComparisonMode: () => void;
  comparisonResult: AlgorithmResult | null;

  // Fullscreen modal
  isFullscreenMode: boolean;
  setFullscreenMode: (isOpen: boolean) => void;
}

export const useStore = create<StoreState>((set, get) => ({
  // User Input defaults
  preferences: {
    skillLevel: 1,
    goalTrack: 'aiml',
    timeAvailable: 200,
    learningStyle: 'mixed',
    selectedCourse: undefined,
  },
  setPreferences: (prefs) =>
    set((state) => ({
      preferences: { ...state.preferences, ...prefs },
    })),

  // Algorithm defaults
  selectedAlgorithm: 'astar',
  setSelectedAlgorithm: (algo) => set({ selectedAlgorithm: algo }),
  algorithmResult: null,
  currentStepIndex: -1,

  // Playback defaults
  isPlaying: false,
  speed: 1,
  setSpeed: (speed) => set({ speed }),

  // Generate learning path
  generatePath: () => {
    const { preferences, selectedAlgorithm } = get();
    const track = tracks.find((t) => t.id === preferences.goalTrack);
    if (!track) return;

    let result: AlgorithmResult;

    switch (selectedAlgorithm) {
      case 'astar':
        result = runAStar(track.nodes, track.edges, preferences);
        break;
      case 'csp':
        result = runCSP(track.nodes, track.edges, preferences);
        break;
      case 'hillClimbing':
        result = runHillClimbing(track.nodes, track.edges, preferences);
        break;
      case 'genetic':
        result = runGenetic(track.nodes, track.edges, preferences);
        break;
      default:
        result = runAStar(track.nodes, track.edges, preferences);
    }

    // For comparison mode, also run the comparison algorithm
    let comparisonResult: AlgorithmResult | null = null;
    if (get().comparisonMode) {
      comparisonResult = runHillClimbing(track.nodes, track.edges, preferences);
    }

    set({
      algorithmResult: result,
      comparisonResult,
      currentStepIndex: 0,
      isPlaying: false,
      isFullscreenMode: true,
    });
  },

  // Playback controls
  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),

  stepForward: () => {
    const { algorithmResult, currentStepIndex } = get();
    if (!algorithmResult) return;
    if (currentStepIndex < algorithmResult.steps.length - 1) {
      set({ currentStepIndex: currentStepIndex + 1 });
    } else {
      set({ isPlaying: false });
    }
  },

  stepBackward: () => {
    const { currentStepIndex } = get();
    if (currentStepIndex > 0) {
      set({ currentStepIndex: currentStepIndex - 1 });
    }
  },

  reset: () => set({ currentStepIndex: 0, isPlaying: false }),

  goToStep: (index) => {
    const { algorithmResult } = get();
    if (algorithmResult && index >= 0 && index < algorithmResult.steps.length) {
      set({ currentStepIndex: index });
    }
  },

  // Computed getters
  get currentStep() {
    const { algorithmResult, currentStepIndex } = get();
    if (!algorithmResult || currentStepIndex < 0) return null;
    return algorithmResult.steps[currentStepIndex] || null;
  },

  get totalSteps() {
    const { algorithmResult } = get();
    return algorithmResult?.steps.length || 0;
  },

  get isComplete() {
    const { algorithmResult, currentStepIndex } = get();
    if (!algorithmResult) return false;
    return currentStepIndex >= algorithmResult.steps.length - 1;
  },

  // Comparison mode
  comparisonMode: false,
  toggleComparisonMode: () => set((state) => ({ comparisonMode: !state.comparisonMode })),
  comparisonResult: null,

  // Fullscreen modal
  isFullscreenMode: false,
  setFullscreenMode: (isOpen) => set({ isFullscreenMode: isOpen }),
}));
