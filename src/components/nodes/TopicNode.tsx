'use client';

import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { motion } from 'framer-motion';
import type { NodeStatus } from '@/algorithms/types';

interface TopicNodeData {
  label: string;
  difficulty: number;
  estimatedHours: number;
  status: NodeStatus;
  category: string;
  description: string;
  gScore?: number;
  hScore?: number;
  fScore?: number;
  cspViolations?: string[];
  coursePlatform?: string;
  [key: string]: unknown;
}

const statusColors: Record<NodeStatus, { bg: string; border: string; shadow: string; text: string }> = {
  unexplored: {
    bg: 'rgba(30, 30, 50, 0.7)',
    border: 'rgba(100, 100, 140, 0.4)',
    shadow: '0 0 0 rgba(0,0,0,0)',
    text: '#8888aa',
  },
  exploring: {
    bg: 'rgba(60, 50, 10, 0.8)',
    border: 'rgba(255, 200, 0, 0.7)',
    shadow: '0 0 20px rgba(255, 200, 0, 0.3)',
    text: '#ffd700',
  },
  current: {
    bg: 'rgba(10, 30, 80, 0.9)',
    border: 'rgba(60, 130, 255, 0.9)',
    shadow: '0 0 25px rgba(60, 130, 255, 0.5)',
    text: '#60a5ff',
  },
  selected: {
    bg: 'rgba(10, 50, 20, 0.85)',
    border: 'rgba(34, 197, 94, 0.8)',
    shadow: '0 0 20px rgba(34, 197, 94, 0.3)',
    text: '#22c55e',
  },
  rejected: {
    bg: 'rgba(50, 10, 10, 0.7)',
    border: 'rgba(239, 68, 68, 0.6)',
    shadow: '0 0 15px rgba(239, 68, 68, 0.2)',
    text: '#ef4444',
  },
};

const difficultyColor = (d: number): string => {
  if (d <= 3) return '#22c55e';
  if (d <= 5) return '#eab308';
  if (d <= 7) return '#f97316';
  return '#ef4444';
};

function TopicNode({ data }: NodeProps) {
  const d = data as unknown as TopicNodeData;
  const status = d.status || 'unexplored';
  const colors = statusColors[status];

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      style={{
        background: colors.bg,
        border: `1.5px solid ${colors.border}`,
        boxShadow: colors.shadow,
        borderRadius: '12px',
        padding: '16px 20px',
        minWidth: '240px',
        maxWidth: '300px',
        backdropFilter: 'blur(12px)',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      <Handle type="target" position={Position.Top} style={{ background: colors.border, border: 'none', width: 8, height: 8 }} />

      {/* Category badge */}
      <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: 'rgba(255,255,255,0.5)', marginBottom: '6px', fontWeight: 600 }}>
        {d.category}
      </div>

      {/* Title */}
      <div style={{ fontSize: '15px', fontWeight: 700, color: colors.text, lineHeight: 1.4, marginBottom: '10px' }}>
        {d.label}
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: '14px', fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '8px' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: difficultyColor(d.difficulty), display: 'inline-block' }} />
          Level {d.difficulty}
        </span>
        <span>⏱ {d.estimatedHours}h</span>
        {d.coursePlatform && <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>{d.coursePlatform}</span>}
      </div>

      {/* A* Scores (if available) */}
      {(d.gScore !== undefined || d.fScore !== undefined) && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          style={{
            marginTop: '8px',
            paddingTop: '6px',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            display: 'flex',
            gap: '8px',
            fontSize: '9px',
            fontFamily: 'monospace',
          }}
        >
          {d.gScore !== undefined && <span style={{ color: '#60a5ff' }}>g={d.gScore.toFixed(1)}</span>}
          {d.hScore !== undefined && <span style={{ color: '#a78bfa' }}>h={d.hScore.toFixed(1)}</span>}
          {d.fScore !== undefined && <span style={{ color: '#fbbf24' }}>f={d.fScore.toFixed(1)}</span>}
        </motion.div>
      )}

      {/* CSP Violations */}
      {d.cspViolations && d.cspViolations.length > 0 && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          style={{
            marginTop: '8px',
            padding: '6px 8px',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '6px',
            fontSize: '10px',
            color: '#f87171',
            lineHeight: 1.3,
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: '2px' }}>⚠️ Constraint Violated</div>
          {d.cspViolations[0]} {d.cspViolations.length > 1 ? `(+${d.cspViolations.length - 1} more)` : ''}
        </motion.div>
      )}

      <Handle type="source" position={Position.Bottom} style={{ background: colors.border, border: 'none', width: 8, height: 8 }} />
    </motion.div>
  );
}

export default memo(TopicNode);
