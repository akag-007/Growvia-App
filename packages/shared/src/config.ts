/**
 * Centralized Brand Configuration
 * 
 * This file acts as the single source of truth for branding details 
 * across the entire platform (Web, Mobile, Backend notifications, etc.).
 * 
 * CHANGE THIS FILE to rebrand the application.
 */

export const brandConfig = {
  appName: "Growvia", 
  tagline: "Your Gamified Productivity Operating System",
  description: "A serious, premium, motivating, and aesthetic productivity tool for high-performance individuals.",
  
  // Contact & Support
  supportEmail: "support@growvia.io",
  websiteUrl: "https://growvia.io",
  
  // Theming & Aesthetics (High-level)
  theme: {
    // "Gen-Z friendly, without sacrificing performance"
    radius: 0.5, // rem
    primaryColor: "#6366f1", // Indigo-500 (Clean, modern, focus-oriented)
    fontFamily: "Inter, sans-serif", // Clean, readable, standard for SaaS
    visuals: "3d-accents", // As requested in "UI/UX SYSTEM"
  },

  // Feature Flags (Can be toggled here for global rollout)
  features: {
    gamification: true,
    offlineMode: true,
    social: false, // Future-proof but disabled now
  }
} as const;

export type BrandConfig = typeof brandConfig;
