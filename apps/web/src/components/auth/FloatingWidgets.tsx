'use client';

import { motion } from 'framer-motion';
import { Target, TrendingUp, Flame, CheckCircle2, Award, ListTodo, Zap, Star, Trophy } from 'lucide-react';
import { useEffect, useState } from 'react';

// Depth layers configuration - make them much more visible
const DEPTHS = {
  far: { blur: 'blur(1px)', opacity: 0.65, scale: 0.85, parallaxMultiplier: 0.02 },
  mid: { blur: 'none', opacity: 0.85, scale: 0.92, parallaxMultiplier: 0.04 },
  near: { blur: 'none', opacity: 1.0, scale: 1.0, parallaxMultiplier: 0.08 },
};

// Define the 9 widgets with wandering X and Y animations
const WIDGETS = [
  {
    id: 1,
    icon: <TrendingUp className="w-4 h-4 text-emerald-400" />,
    label: "Growth",
    value: "+4.2%",
    depth: 'mid',
    position: { top: '15%', left: '10%' },
    animation: { y: [0, -20, 10, 0], x: [0, 30, -10, 0], duration: 18, delay: 0 },
  },
  {
    id: 2,
    icon: <Flame className="w-4 h-4 text-orange-400" />,
    label: "Streak",
    value: "14 Days",
    depth: 'near',
    position: { top: '25%', right: '12%' },
    animation: { y: [0, 15, -25, 0], x: [0, -40, 15, 0], duration: 22, delay: 1 },
  },
  {
    id: 3,
    icon: <Target className="w-4 h-4 text-indigo-400" />,
    label: "Goal",
    value: "Completed",
    depth: 'far',
    position: { top: '45%', left: '5%' },
    animation: { y: [0, -30, 20, 0], x: [0, 25, 40, 0], duration: 25, delay: 2 },
  },
  {
    id: 4,
    icon: <Award className="w-4 h-4 text-purple-400" />,
    label: "Rank",
    value: "Top 5%",
    depth: 'mid',
    position: { bottom: '30%', left: '15%' },
    animation: { y: [0, 25, -15, 0], x: [0, -20, -35, 0], duration: 19, delay: 0.5 },
  },
  {
    id: 5,
    icon: <ListTodo className="w-4 h-4 text-blue-400" />,
    label: "Tasks",
    value: "12/15",
    depth: 'near',
    position: { bottom: '20%', right: '15%' },
    animation: { y: [0, -25, 15, 0], x: [0, 35, -20, 0], duration: 21, delay: 1.5 },
  },
  {
    id: 6,
    icon: <Zap className="w-4 h-4 text-amber-400" />,
    label: "Focus",
    value: "4h 20m",
    depth: 'mid',
    position: { top: '10%', left: '55%' },
    animation: { y: [0, 20, -20, 0], x: [0, -30, 20, 0], duration: 17, delay: 2.5 },
  },
  {
    id: 7,
    icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
    label: "Consistency",
    value: "92%",
    depth: 'far',
    position: { bottom: '40%', right: '8%' },
    animation: { y: [0, -35, 10, 0], x: [0, 45, -30, 0], duration: 26, delay: 0.8 },
  },
  {
    id: 8,
    icon: <Star className="w-4 h-4 text-yellow-400" />,
    label: "Points",
    value: "2,450",
    depth: 'near',
    position: { bottom: '15%', left: '40%' },
    animation: { y: [0, 15, -30, 0], x: [0, -25, 35, 0], duration: 20, delay: 1.2 },
  },
  {
    id: 9,
    icon: <Trophy className="w-4 h-4 text-gold-400" />,
    label: "Milestone",
    value: "Level 10",
    depth: 'mid',
    position: { top: '35%', right: '25%' },
    animation: { y: [0, -15, 25, 0], x: [0, 30, -25, 0], duration: 16, delay: 3 },
  }
];

interface FloatingWidgetsProps {
  isDimmed: boolean;
}

export function FloatingWidgets({ isDimmed }: FloatingWidgetsProps) {
  return (
    <div 
      className={`absolute inset-0 overflow-hidden pointer-events-none transition-opacity duration-1000 ${isDimmed ? 'opacity-20' : 'opacity-100'}`}
      aria-hidden="true"
    >
      {WIDGETS.map((widget) => {
        const depthConfig = DEPTHS[widget.depth as keyof typeof DEPTHS];
        
        return (
          <motion.div
            key={widget.id}
            className="absolute flex items-center gap-3 px-4 py-3 rounded-2xl border pointer-events-none"
            style={{
              ...widget.position,
              background: 'rgba(20, 20, 20, 0.45)', // Make background much more visible
              borderColor: 'rgba(255, 255, 255, 0.15)', // Stronger border
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              filter: depthConfig.blur,
              opacity: depthConfig.opacity,
              scale: depthConfig.scale,
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 0 0 1px rgba(255, 255, 255, 0.1)',
            }}
            animate={{
              x: widget.animation.x,
              y: widget.animation.y
            }}
            transition={{
              x: {
                duration: widget.animation.duration,
                repeat: Infinity,
                repeatType: "mirror",
                ease: "easeInOut",
                delay: widget.animation.delay,
              },
              y: {
                duration: widget.animation.duration * 1.1, // slightly offset duration for more organic movement
                repeat: Infinity,
                repeatType: "mirror",
                ease: "easeInOut",
                delay: widget.animation.delay,
              }
            }}
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 border border-white/20 shadow-inner">
              {widget.icon}
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-medium tracking-wider text-white/70 uppercase">
                {widget.label}
              </span>
              <span className="text-sm font-bold tracking-tight text-white">
                {widget.value}
              </span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
