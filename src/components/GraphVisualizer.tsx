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
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useStore } from '@/store/useStore';
import { tracks } from '@/data/courses';
import TopicNode from './nodes/TopicNode';
import type { NodeStatus } from '@/algorithms/types';

const nodeTypes = { topicNode: TopicNode };

const statusEdgeColors: Record<string, string> = {
  selected: '#22c55e',
  current: '#3b82f6',
  exploring: '#eab308',
  rejected: '#ef4444',
  unexplored: 'rgba(100, 100, 140, 0.3)',
};

export default function GraphVisualizer() {
  const { preferences, algorithmResult, currentStepIndex } = useStore();
  const track = useMemo(
    () => tracks.find((t) => t.id === preferences.goalTrack),
    [preferences.goalTrack]
  );

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
          strokeWidth: edgeStatus === 'selected' ? 2.5 : edgeStatus === 'unexplored' ? 1 : 2,
          opacity: edgeStatus === 'unexplored' ? 0.3 : 1,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 15,
          height: 15,
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
          color="rgba(100, 100, 140, 0.15)"
        />
        <Controls
          style={{
            background: 'rgba(15, 15, 30, 0.8)',
            border: '1px solid rgba(100, 100, 140, 0.3)',
            borderRadius: '8px',
          }}
        />
        <MiniMap
          nodeColor={(node) => {
            const status = (node.data as Record<string, unknown>)?.status as string;
            if (status === 'selected') return '#22c55e';
            if (status === 'current') return '#3b82f6';
            if (status === 'exploring') return '#eab308';
            if (status === 'rejected') return '#ef4444';
            return '#333355';
          }}
          style={{
            background: 'rgba(10, 10, 25, 0.9)',
            border: '1px solid rgba(100, 100, 140, 0.2)',
            borderRadius: '8px',
          }}
          maskColor="rgba(10, 10, 25, 0.7)"
        />
      </ReactFlow>

      {/* Legend */}
      <div className="graph-legend">
        <div className="legend-item"><span className="legend-dot" style={{ background: '#3b82f6' }} /> Current</div>
        <div className="legend-item"><span className="legend-dot" style={{ background: '#eab308' }} /> Exploring</div>
        <div className="legend-item"><span className="legend-dot" style={{ background: '#22c55e' }} /> Selected</div>
        <div className="legend-item"><span className="legend-dot" style={{ background: '#ef4444' }} /> Rejected</div>
      </div>
    </div>
  );
}
