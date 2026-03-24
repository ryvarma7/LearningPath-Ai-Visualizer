'use client';

import React, { useMemo, useCallback, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  BackgroundVariant,
  MarkerType,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useStore } from '@/store/useStore';
import { tracks } from '@/data/courses';
import TopicNode from './nodes/TopicNode';
import type { NodeStatus } from '@/algorithms/types';

const nodeTypes = { topicNode: TopicNode };

const statusEdgeColors: Record<string, string> = {
  selected: '#16a34a',
  current: '#2563eb',
  exploring: '#d97706',
  rejected: '#dc2626',
  unexplored: 'rgba(45, 90, 123, 0.2)',
};

// Helper component to handle automatic zooming to active nodes
function CameraUpdater({ currentStep, isFinished, nodes }: { currentStep: any; isFinished: boolean; nodes: Node[] }) {
  const { setCenter, fitView } = useReactFlow();

  useEffect(() => {
    if (!currentStep) return;

    if (isFinished) {
      // Zoom out completely at the end when the process is done
      fitView({ duration: 1000, padding: 0.2 });
      return;
    }

    // Find nodes that are actively being evaluated right now
    const activeStates = ['current', 'exploring'];
    const focusNodes = nodes.filter((n) => {
      const status = currentStep.nodeStates.get(n.id)?.status;
      return status && activeStates.includes(status);
    });

    if (focusNodes.length > 0) {
      if (focusNodes.length === 1) {
        // Center on the single active node
        const nodeWidth = 260;
        const nodeHeight = 160;
        const x = focusNodes[0].position.x + nodeWidth / 2;
        const y = focusNodes[0].position.y + nodeHeight / 2;
        setCenter(x, y, { zoom: 1.1, duration: 800 });
      } else {
        // Fit view around multiple active nodes
        fitView({ nodes: focusNodes, duration: 800, padding: 0.5, maxZoom: 1.1 });
      }
    } else if (currentStep.stepNumber === 0) {
      // If at the very start, zoom to fit all to show initial state
      fitView({ duration: 800, padding: 0.3 });
    }
    // Otherwise, do nothing and keep the camera focused where it was.
  }, [currentStep, isFinished, nodes, setCenter, fitView]);

  return null;
}

export default function GraphVisualizer() {
  const { preferences, algorithmResult, currentStepIndex } = useStore();
  const track = useMemo(
    () => tracks.find((t) => t.id === preferences.goalTrack),
    [preferences.goalTrack]
  );
  
  const isFinished = algorithmResult ? currentStepIndex === algorithmResult.steps.length - 1 : false;

  // Get current step state
  const currentStep = useMemo(() => {
    if (!algorithmResult || currentStepIndex < 0) return null;
    return algorithmResult.steps[currentStepIndex] || null;
  }, [algorithmResult, currentStepIndex]);

  // Build React Flow nodes
  const rfNodes: Node[] = useMemo(() => {
    if (!track) return [];

    // Layered layout: group by difficulty tiers
    const tiers = new Map<number, typeof track.nodes>();
    for (const node of track.nodes) {
      const tier = Math.ceil(node.difficulty / 2);
      if (!tiers.has(tier)) tiers.set(tier, []);
      tiers.get(tier)!.push(node);
    }

    const nodes: Node[] = [];
    const sortedTiers = Array.from(tiers.entries()).sort((a, b) => a[0] - b[0]);

    sortedTiers.forEach(([tier, tierNodes], tierIdx) => {
      const tierWidth = tierNodes.length * 260;
      const startX = -tierWidth / 2 + 130;

      tierNodes.forEach((courseNode, nodeIdx) => {
        const status: NodeStatus = currentStep?.nodeStates.get(courseNode.id)?.status || 'unexplored';
        const nodeState = currentStep?.nodeStates.get(courseNode.id);

        nodes.push({
          id: courseNode.id,
          type: 'topicNode',
          position: { x: startX + nodeIdx * 260, y: tierIdx * 160 },
          data: {
            label: courseNode.label,
            difficulty: courseNode.difficulty,
            estimatedHours: courseNode.estimatedHours,
            status,
            category: courseNode.category,
            description: courseNode.description,
            coursePlatform: courseNode.coursePlatform,
            gScore: nodeState?.gScore,
            hScore: nodeState?.hScore,
            fScore: nodeState?.fScore,
            cspViolations: nodeState?.cspViolations,
          },
        });
      });
    });

    return nodes;
  }, [track, currentStep]);

  // Build React Flow edges
  const rfEdges: Edge[] = useMemo(() => {
    if (!track) return [];

    return track.edges.map((edge) => {
      const sourceStatus = currentStep?.nodeStates.get(edge.source)?.status || 'unexplored';
      const targetStatus = currentStep?.nodeStates.get(edge.target)?.status || 'unexplored';

      // Edge is "selected" if both endpoints are selected
      let edgeStatus = 'unexplored';
      if (sourceStatus === 'selected' && targetStatus === 'selected') {
        edgeStatus = 'selected';
      } else if (sourceStatus === 'selected' && targetStatus === 'current') {
        edgeStatus = 'current';
      } else if (targetStatus === 'exploring' || sourceStatus === 'exploring') {
        edgeStatus = 'exploring';
      } else if (targetStatus === 'rejected') {
        edgeStatus = 'rejected';
      }

      return {
        id: `${edge.source}-${edge.target}`,
        source: edge.source,
        target: edge.target,
        type: 'default',
        animated: edgeStatus === 'current' || edgeStatus === 'exploring',
        style: {
          stroke: statusEdgeColors[edgeStatus],
          strokeWidth: edgeStatus === 'selected' ? 4 : edgeStatus === 'unexplored' ? 2 : 3,
          opacity: edgeStatus === 'unexplored' ? 0.5 : 1,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: edgeStatus === 'selected' ? 20 : edgeStatus === 'unexplored' ? 14 : 18,
          height: edgeStatus === 'selected' ? 20 : edgeStatus === 'unexplored' ? 14 : 18,
          color: statusEdgeColors[edgeStatus],
        },
      };
    });
  }, [track, currentStep]);

  const [nodes, setNodes, onNodesChange] = useNodesState(rfNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(rfEdges);

  // Update nodes/edges when algorithm state changes
  useEffect(() => {
    setNodes(rfNodes);
    setEdges(rfEdges);
  }, [rfNodes, rfEdges, setNodes, setEdges]);

  return (
    <div className="graph-container">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        minZoom={0.3}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 0.7 }}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="rgba(45, 90, 123, 0.08)"
        />
        <CameraUpdater currentStep={currentStep} isFinished={isFinished} nodes={rfNodes} />
        <Controls
          style={{
            background: 'rgba(255, 255, 255, 0.9)',
            border: '1px solid rgba(45, 90, 123, 0.1)',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
          }}
        />
        <MiniMap
          nodeColor={(node) => {
            const status = (node.data as Record<string, unknown>)?.status as string;
            if (status === 'selected') return '#16a34a';
            if (status === 'current') return '#2563eb';
            if (status === 'exploring') return '#d97706';
            if (status === 'rejected') return '#dc2626';
            return '#cbd5e1';
          }}
          style={{
            background: 'rgba(255, 255, 255, 0.9)',
            border: '1px solid rgba(45, 90, 123, 0.1)',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
          }}
          maskColor="rgba(45, 90, 123, 0.08)"
        />
      </ReactFlow>

      {/* Legend */}
      <div className="graph-legend">
        <div className="legend-item"><span className="legend-dot" style={{ background: '#2563eb' }} /> 👉 Active Now</div>
        <div className="legend-item"><span className="legend-dot" style={{ background: '#d97706' }} /> 🔍 Being Evaluated</div>
        <div className="legend-item"><span className="legend-dot" style={{ background: '#16a34a' }} /> ✅ Selected</div>
        <div className="legend-item"><span className="legend-dot" style={{ background: '#dc2626' }} /> ❌ Rejected</div>
        <div className="legend-item"><span className="legend-dot" style={{ background: '#cbd5e1' }} /> ⏳ Waiting</div>
      </div>
    </div>
  );
}
