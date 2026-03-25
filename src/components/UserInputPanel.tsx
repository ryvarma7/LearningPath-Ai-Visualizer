'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { tracks, getRecommendedTracks } from '@/data/courses';
import { Sparkles, Clock, Target, GraduationCap, ChevronDown, AlertCircle } from 'lucide-react';

const skillLabels = ['Beginner', 'Elementary', 'Intermediate', 'Advanced', 'Expert'];

const formatTimeDisplay = (hours: number) => {
  const days = Math.floor(hours / 24);
  const remainingHours = Math.round(hours % 24);
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

      {/* Skill Level First */}
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
        
        {/* Skill level info message */}
        <div className="mt-2 mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs leading-relaxed text-slate-700 flex gap-2">
          <AlertCircle size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            {preferences.skillLevel === 1 && 'Beginner: Start with foundation courses. Pick one track and focus deeply.'}
            {preferences.skillLevel === 2 && 'Early Intermediate: Mix of fundamentals and intermediate content. Can explore related tracks.'}
            {preferences.skillLevel === 3 && 'Intermediate: Access to most courses. Can combine multiple learning paths.'}
            {preferences.skillLevel === 4 && 'Advanced: Most courses available. Ready for specialized and advanced topics.'}
            {preferences.skillLevel === 5 && 'Expert: Full access to all courses including highly advanced content.'}
          </div>
        </div>
      </div>

      {/* Learning Track - Now with skill-level filtering */}
      <div className="input-group">
        <label className="input-label">
          <Target size={14} />
          Learning Track ({getRecommendedTracks(preferences.skillLevel).length} available)
        </label>
        <div className="relative w-full">
          <motion.button
            onClick={() => setIsTrackMenuOpen(!isTrackMenuOpen)}
            className="w-full px-6 py-3 bg-white/60 border border-gray-200 rounded-lg text-slate-800 font-medium flex items-center justify-between hover:bg-white/80 hover:border-gray-300 hover:shadow-md focus:border-slate-400 focus:shadow-md focus:outline-none transition-all duration-200 backdrop-blur-sm"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <span className="flex items-center gap-2">
              <span className="text-2xl">{currentTrack?.icon}</span>
              <span className="text-slate-800">{currentTrack?.name} ({currentTrack?.nodes.length} topics)</span>
            </span>
            <motion.div
              animate={{ rotate: isTrackMenuOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown size={20} className="text-slate-600" />
            </motion.div>
          </motion.button>

          <AnimatePresence>
            {isTrackMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute top-full left-0 right-0 mt-2 bg-white/95 border border-gray-200 rounded-lg shadow-lg backdrop-blur-sm z-50 overflow-hidden"
              >
                <div className="max-h-80 overflow-y-auto custom-scrollbar">
                  {tracks.map((track) => {
                    const isRecommended = getRecommendedTracks(preferences.skillLevel).includes(track.id);
                    return (
                      <motion.button
                        key={track.id}
                        onClick={() => {
                          if (isRecommended) {
                            setPreferences({ goalTrack: track.id, selectedCourse: undefined });
                            setIsTrackMenuOpen(false);
                          }
                        }}
                        disabled={!isRecommended}
                        className={`w-full px-6 py-4 text-left flex items-center gap-3 transition-all duration-150 ${
                          !isRecommended
                            ? 'opacity-40 cursor-not-allowed bg-gray-50'
                            : preferences.goalTrack === track.id
                            ? 'bg-blue-50 border-l-4 border-slate-700'
                            : 'hover:bg-gray-50 border-l-4 border-transparent'
                        }`}
                        whileHover={isRecommended ? { x: 4 } : {}}
                      >
                        <span className="text-2xl">{track.icon}</span>
                        <div className="flex-1">
                          <div className="text-slate-800 font-semibold">{track.name}</div>
                          <div className="text-sm text-slate-600">{track.nodes.length} topics • {track.description}</div>
                          {!isRecommended && <div className="text-xs text-slate-500 mt-1">📚 Unlock at higher skill level</div>}
                        </div>
                        {preferences.goalTrack === track.id && isRecommended && (
                          <motion.div
                            layoutId="activeTrack"
                            className="w-2 h-2 bg-slate-700 rounded-full"
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                          />
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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
          max={2000}
          step={50}
          value={preferences.timeAvailable}
          onChange={(e) => setPreferences({ timeAvailable: parseInt(e.target.value) })}
          className="slider"
        />
        <div className="slider-labels">
          <span>50h</span>
          <span>500h</span>
          <span>1000h</span>
          <span>2000h</span>
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
