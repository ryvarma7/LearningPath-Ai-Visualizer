'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { tracks } from '@/data/courses';
import { Sparkles, Clock, Target, GraduationCap, ChevronDown } from 'lucide-react';

const skillLabels = ['Beginner', 'Elementary', 'Intermediate', 'Advanced', 'Expert'];

const formatTimeDisplay = (hours: number) => {
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return `${days}d ${remainingHours}h`;
};

export default function UserInputPanel() {
  const { preferences, setPreferences, generatePath, selectedAlgorithm } = useStore();
  const [isTrackMenuOpen, setIsTrackMenuOpen] = useState(false);
  const currentTrack = tracks.find((t) => t.id === preferences.goalTrack);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 25 }}
      className="glass-panel"
    >
      <h2 className="panel-title">
        <Sparkles size={18} />
        Configure Your Path
      </h2>

      {/* Learning Track Custom Dropdown */}
      <div className="input-group">
        <label className="input-label">
          <Target size={14} />
          Learning Track
        </label>
        <div className="relative w-full">
          <motion.button
            onClick={() => setIsTrackMenuOpen(!isTrackMenuOpen)}
            className="w-full px-6 py-3 bg-gradient-to-r from-slate-800/60 to-slate-800/40 border-2 border-indigo-500/40 rounded-lg text-white font-medium flex items-center justify-between hover:border-indigo-500/80 hover:shadow-lg hover:shadow-indigo-500/20 focus:border-indigo-500 focus:shadow-lg focus:shadow-indigo-500/30 focus:outline-none transition-all duration-200"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <span className="flex items-center gap-2">
              <span className="text-indigo-400">{currentTrack?.icon}</span>
              <span>{currentTrack?.name} ({currentTrack?.nodes.length} topics)</span>
            </span>
            <motion.div
              animate={{ rotate: isTrackMenuOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown size={20} className="text-indigo-400" />
            </motion.div>
          </motion.button>

          <AnimatePresence>
            {isTrackMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute top-full left-0 right-0 mt-2 bg-slate-900/95 border-2 border-indigo-500/40 rounded-lg shadow-xl shadow-indigo-500/20 backdrop-blur-xl z-50 overflow-hidden"
              >
                <div className="max-h-80 overflow-y-auto custom-scrollbar">
                  {tracks.map((track) => (
                    <motion.button
                      key={track.id}
                      onClick={() => {
                        setPreferences({ goalTrack: track.id, selectedCourse: undefined });
                        setIsTrackMenuOpen(false);
                      }}
                      className={`w-full px-6 py-4 text-left flex items-center gap-3 transition-all duration-150 ${
                        preferences.goalTrack === track.id
                          ? 'bg-indigo-500/20 border-l-4 border-indigo-500'
                          : 'hover:bg-slate-800/50 border-l-4 border-transparent'
                      }`}
                      whileHover={{ x: 4 }}
                    >
                      <span className="text-2xl">{track.icon}</span>
                      <div className="flex-1">
                        <div className="text-white font-medium">{track.name}</div>
                        <div className="text-sm text-indigo-300">{track.nodes.length} topics • {track.description}</div>
                      </div>
                      {preferences.goalTrack === track.id && (
                        <motion.div
                          layoutId="activeTrack"
                          className="w-2 h-2 bg-indigo-400 rounded-full"
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        />
                      )}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Skill Level */}
      <div className="input-group">
        <label className="input-label">
          <GraduationCap size={14} />
          Skill Level: <span className="highlight-text">{skillLabels[preferences.skillLevel - 1]}</span>
        </label>
        <input
          type="range"
          min={1}
          max={5}
          value={preferences.skillLevel}
          onChange={(e) => setPreferences({ skillLevel: parseInt(e.target.value) })}
          className="slider"
        />
        <div className="slider-labels">
          {skillLabels.map((label, i) => (
            <span key={label} className={preferences.skillLevel === i + 1 ? 'active' : ''}>{label}</span>
          ))}
        </div>
      </div>

      {/* Time Available */}
      <div className="input-group">
        <label className="input-label">
          <Clock size={14} />
          Time Available: <span className="highlight-text">{formatTimeDisplay(preferences.timeAvailable)}</span>
        </label>
        <input
          type="range"
          min={50}
          max={500}
          step={10}
          value={preferences.timeAvailable}
          onChange={(e) => setPreferences({ timeAvailable: parseInt(e.target.value) })}
          className="slider"
        />
        <div className="slider-labels">
          <span>50h</span>
          <span>200h</span>
          <span>350h</span>
          <span>500h</span>
        </div>
      </div>

      {/* Generate Button */}
      <motion.button
        whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(99, 102, 241, 0.4)' }}
        whileTap={{ scale: 0.98 }}
        onClick={generatePath}
        className="generate-btn"
      >
        <Sparkles size={18} />
        Generate Learning Path
      </motion.button>
    </motion.div>
  );
}
