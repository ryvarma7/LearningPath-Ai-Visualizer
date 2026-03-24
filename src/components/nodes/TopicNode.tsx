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
    bg: 'rgba(255, 255, 255, 0.8)',
    border: 'rgba(45, 90, 123, 0.15)',
    shadow: '0 2px 8px rgba(45, 90, 123, 0.08)',
    text: '#64748b',
  },
  exploring: {
    bg: 'rgba(217, 119, 6, 0.09)',
    border: 'rgba(217, 119, 6, 0.4)',
    shadow: '0 2px 16px rgba(217, 119, 6, 0.2)',
    text: '#92400e',
  },
  current: {
    bg: 'rgba(37, 99, 235, 0.1)',
    border: 'rgba(37, 99, 235, 0.5)',
    shadow: '0 4px 20px rgba(37, 99, 235, 0.3)',
    text: '#1e40af',
  },
  selected: {
    bg: 'rgba(22, 163, 74, 0.1)',
    border: 'rgba(22, 163, 74, 0.4)',
    shadow: '0 2px 12px rgba(22, 163, 74, 0.2)',
    text: '#15803d',
  },
  rejected: {
    bg: 'rgba(220, 38, 38, 0.09)',
    border: 'rgba(220, 38, 38, 0.35)',
    shadow: '0 2px 12px rgba(220, 38, 38, 0.15)',
    text: '#7f1d1d',
  },
};

const statusLabels: Record<NodeStatus, { icon: string; label: string }> = {
  unexplored: { icon: '⏳', label: 'Waiting' },
  exploring: { icon: '🔍', label: 'Being Evaluated' },
  current: { icon: '👉', label: 'Active Now' },
  selected: { icon: '✅', label: 'Selected' },
  rejected: { icon: '❌', label: 'Rejected' },
};

const difficultyColor = (d: number): string => {
  if (d <= 3) return '#16a34a';
  if (d <= 5) return '#d97706';
  if (d <= 7) return '#ea580c';
  return '#dc2626';
};

function TopicNode({ data }: NodeProps) {
  const d = data as unknown as TopicNodeData;
  const status = d.status || 'unexplored';
  const colors = statusColors[status];
  const statusInfo = statusLabels[status];
  const isCurrent = status === 'current';

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{
        scale: isCurrent ? [1, 1.03, 1] : 1,
        opacity: 1,
      }}
      transition={isCurrent ? {
        scale: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' },
        opacity: { duration: 0.3 },
      } : {
        type: 'spring', stiffness: 300, damping: 25,
      }}
      style={{
        background: colors.bg,
        border: `${isCurrent ? '2.5px' : '1.5px'} solid ${colors.border}`,
        boxShadow: colors.shadow,
        borderRadius: '14px',
        padding: '14px 18px',
        minWidth: '220px',
        maxWidth: '280px',
        backdropFilter: 'blur(12px)',
        fontFamily: 'Inter, sans-serif',
        position: 'relative',
      }}
    >
      <Handle type="target" position={Position.Top} style={{ background: colors.border, border: 'none', width: 8, height: 8 }} />

      {/* Status badge */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '8px',
      }}>
        {/* Category */}
        <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', color: '#94a3b8', fontWeight: 600 }}>
          {d.category}
        </div>

        {/* Status label */}
        {status !== 'unexplored' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
              fontSize: '10px',
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: '10px',
              background: `${colors.border}`,
              color: 'white',
              lineHeight: 1.4,
            }}
          >
            <span style={{ fontSize: '10px' }}>{statusInfo.icon}</span>
            {statusInfo.label}
          </motion.div>
        )}
      </div>

      {/* Title */}
      <div style={{ fontSize: '14px', fontWeight: 700, color: colors.text, lineHeight: 1.3, marginBottom: '8px' }}>
        {d.label}
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: '10px', fontSize: '11px', color: '#64748b', marginBottom: '6px' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: difficultyColor(d.difficulty), display: 'inline-block' }} />
          Lvl {d.difficulty}
        </span>
        <span>⏱ {d.estimatedHours}h</span>
        {d.coursePlatform && <span style={{ color: '#94a3b8', fontSize: '10px' }}>{d.coursePlatform}</span>}
      </div>

      {/* A* Scores — visual bars instead of raw numbers */}
      {(d.gScore !== undefined || d.fScore !== undefined) && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          style={{
            marginTop: '6px',
            paddingTop: '6px',
            borderTop: '1px solid rgba(100, 116, 139, 0.12)',
          }}
        >
          {d.fScore !== undefined && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', marginBottom: '3px' }}>
              <span style={{ color: '#d97706', fontWeight: 600, width: '18px' }}>f</span>
              <div style={{ flex: 1, height: '4px', borderRadius: '2px', background: 'rgba(217,119,6,0.12)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.min(100, (d.fScore / 30) * 100)}%`, background: '#d97706', borderRadius: '2px', transition: 'width 0.3s' }} />
              </div>
              <span style={{ color: '#d97706', fontFamily: 'monospace', fontSize: '9px', minWidth: '28px', textAlign: 'right' }}>{d.fScore.toFixed(1)}</span>
            </div>
          )}
          {d.gScore !== undefined && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', marginBottom: '3px' }}>
              <span style={{ color: '#2563eb', fontWeight: 600, width: '18px' }}>g</span>
              <div style={{ flex: 1, height: '4px', borderRadius: '2px', background: 'rgba(37,99,235,0.12)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.min(100, (d.gScore / 20) * 100)}%`, background: '#2563eb', borderRadius: '2px', transition: 'width 0.3s' }} />
              </div>
              <span style={{ color: '#2563eb', fontFamily: 'monospace', fontSize: '9px', minWidth: '28px', textAlign: 'right' }}>{d.gScore.toFixed(1)}</span>
            </div>
          )}
          {d.hScore !== undefined && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px' }}>
              <span style={{ color: '#7c3aed', fontWeight: 600, width: '18px' }}>h</span>
              <div style={{ flex: 1, height: '4px', borderRadius: '2px', background: 'rgba(124,58,237,0.12)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.min(100, (d.hScore / 20) * 100)}%`, background: '#7c3aed', borderRadius: '2px', transition: 'width 0.3s' }} />
              </div>
              <span style={{ color: '#7c3aed', fontFamily: 'monospace', fontSize: '9px', minWidth: '28px', textAlign: 'right' }}>{d.hScore.toFixed(1)}</span>
            </div>
          )}
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
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            borderRadius: '8px',
            fontSize: '10px',
            color: '#dc2626',
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
