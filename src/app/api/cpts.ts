/**
 * Conditional Probability Tables (CPTs) API
 * 
 * Provides the CPTs for the Bayesian network model
 */

import type { CPT } from './bayesian';

// Import CPTs from the JSON file
// For client-side use, JSON is included directly rather than using fs.readFile
export const CPTs: CPT = {
  "Timeline": {
    "Early": 0.3,
    "Mid": 0.4,
    "Late": 0.3
  },
  "Coordination": {
    "Good": 0.2,
    "Med": 0.4,
    "Poor": 0.4
  },
  "Interpretability": {
    "Good": 0.2,
    "Med": 0.5,
    "Poor": 0.3
  },
  "MisusePotential": {
    "Low": 0.3,
    "Med": 0.4,
    "High": 0.3
  },
  "AlignmentSolvability": {
    "Easy": 0.1,
    "Med": 0.3,
    "Hard": 0.6
  },
  "AlignmentSolvability|Early,Good": {
    "Easy": 0.1,
    "Med": 0.3,
    "Hard": 0.6
  },
  "AlignmentSolvability|Early,Med": {
    "Easy": 0.1,
    "Med": 0.2,
    "Hard": 0.7
  },
  "AlignmentSolvability|Early,Poor": {
    "Easy": 0.05,
    "Med": 0.15,
    "Hard": 0.8
  },
  "AlignmentSolvability|Mid,Good": {
    "Easy": 0.2,
    "Med": 0.4,
    "Hard": 0.4
  },
  "AlignmentSolvability|Mid,Med": {
    "Easy": 0.2,
    "Med": 0.3,
    "Hard": 0.5
  },
  "AlignmentSolvability|Mid,Poor": {
    "Easy": 0.15,
    "Med": 0.25,
    "Hard": 0.6
  },
  "AlignmentSolvability|Late,Good": {
    "Easy": 0.3,
    "Med": 0.5,
    "Hard": 0.2
  },
  "AlignmentSolvability|Late,Med": {
    "Easy": 0.3,
    "Med": 0.4,
    "Hard": 0.3
  },
  "AlignmentSolvability|Late,Poor": {
    "Easy": 0.3,
    "Med": 0.3,
    "Hard": 0.4
  },
  "Competition": {
    "Low": 0.2,
    "Med": 0.3,
    "High": 0.5
  },
  "Competition|Good": {
    "Low": 0.4,
    "Med": 0.4,
    "High": 0.2
  },
  "Competition|Med": {
    "Low": 0.2,
    "Med": 0.3,
    "High": 0.5
  },
  "Competition|Poor": {
    "Low": 0.05,
    "Med": 0.15,
    "High": 0.8
  },
  "WarningShot": {
    "Low": 0.2,
    "Med": 0.4,
    "High": 0.4
  },
  "WarningShot|Good": {
    "Low": 0.4,
    "Med": 0.4,
    "High": 0.2
  },
  "WarningShot|Med": {
    "Low": 0.2,
    "Med": 0.4,
    "High": 0.4
  },
  "WarningShot|Poor": {
    "Low": 0.1,
    "Med": 0.3,
    "High": 0.6
  },
  "Regulation": {
    "High": 0.3,
    "Med": 0.4,
    "Low": 0.3
  },
  "DeceptionRisk": {
    "Low": 0.2,
    "Med": 0.3,
    "High": 0.5
  },
  "DeceptionRisk|Easy": {
    "Low": 0.6,
    "Med": 0.3,
    "High": 0.1
  },
  "DeceptionRisk|Med": {
    "Low": 0.2,
    "Med": 0.4,
    "High": 0.4
  },
  "DeceptionRisk|Hard": {
    "Low": 0.1,
    "Med": 0.2,
    "High": 0.7
  },
  "SelfReplication": {
    "Low": 0.3,
    "Med": 0.4,
    "High": 0.3
  },
  "SelfReplication|Early": {
    "Low": 0.1,
    "Med": 0.3,
    "High": 0.6
  },
  "SelfReplication|Mid": {
    "Low": 0.3,
    "Med": 0.4,
    "High": 0.3
  },
  "SelfReplication|Late": {
    "Low": 0.6,
    "Med": 0.3,
    "High": 0.1
  },
  "PowerConcentration": {
    "Low": 0.2,
    "Med": 0.4,
    "High": 0.4
  },
  "PowerConcentration|Low": {
    "Low": 0.4,
    "Med": 0.4,
    "High": 0.2
  },
  "PowerConcentration|Med": {
    "Low": 0.2,
    "Med": 0.4,
    "High": 0.4
  },
  "PowerConcentration|High": {
    "Low": 0.1,
    "Med": 0.3,
    "High": 0.6
  },
  "ControlLossRisk": {
    "Low": 0.2,
    "Med": 0.3,
    "High": 0.5
  },
  "P_doom_2035": {
    "Low": 0.25,
    "Medium": 0.35,
    "High": 0.25,
    "VeryHigh": 0.15
  },
  "P_doom_2035|Easy,High,Low": {
    "Low": 0.7,
    "Medium": 0.2,
    "High": 0.07,
    "VeryHigh": 0.03
  },
  "P_doom_2035|Easy,High,Med": {
    "Low": 0.6,
    "Medium": 0.25,
    "High": 0.1,
    "VeryHigh": 0.05
  },
  "P_doom_2035|Easy,High,High": {
    "Low": 0.4,
    "Medium": 0.3,
    "High": 0.2,
    "VeryHigh": 0.1
  },
  "P_doom_2035|Easy,Med,Low": {
    "Low": 0.5,
    "Medium": 0.3,
    "High": 0.15,
    "VeryHigh": 0.05
  },
  "P_doom_2035|Easy,Med,Med": {
    "Low": 0.4,
    "Medium": 0.35,
    "High": 0.18,
    "VeryHigh": 0.07
  },
  "P_doom_2035|Easy,Med,High": {
    "Low": 0.25,
    "Medium": 0.35,
    "High": 0.25,
    "VeryHigh": 0.15
  },
  "P_doom_2035|Easy,Low,Low": {
    "Low": 0.3,
    "Medium": 0.4,
    "High": 0.2,
    "VeryHigh": 0.1
  },
  "P_doom_2035|Easy,Low,Med": {
    "Low": 0.2,
    "Medium": 0.4,
    "High": 0.25,
    "VeryHigh": 0.15
  },
  "P_doom_2035|Easy,Low,High": {
    "Low": 0.1,
    "Medium": 0.3,
    "High": 0.35,
    "VeryHigh": 0.25
  },
  "P_doom_2035|Med,High,Low": {
    "Low": 0.3,
    "Medium": 0.4,
    "High": 0.2,
    "VeryHigh": 0.1
  },
  "P_doom_2035|Med,High,Med": {
    "Low": 0.2,
    "Medium": 0.4,
    "High": 0.25,
    "VeryHigh": 0.15
  },
  "P_doom_2035|Med,High,High": {
    "Low": 0.1,
    "Medium": 0.3,
    "High": 0.35,
    "VeryHigh": 0.25
  },
  "P_doom_2035|Med,Med,Low": {
    "Low": 0.2,
    "Medium": 0.35,
    "High": 0.3,
    "VeryHigh": 0.15
  },
  "P_doom_2035|Med,Med,Med": {
    "Low": 0.1,
    "Medium": 0.35,
    "High": 0.35,
    "VeryHigh": 0.2
  },
  "P_doom_2035|Med,Med,High": {
    "Low": 0.05,
    "Medium": 0.25,
    "High": 0.4,
    "VeryHigh": 0.3
  },
  "P_doom_2035|Med,Low,Low": {
    "Low": 0.1,
    "Medium": 0.3,
    "High": 0.35,
    "VeryHigh": 0.25
  },
  "P_doom_2035|Med,Low,Med": {
    "Low": 0.05,
    "Medium": 0.25,
    "High": 0.4,
    "VeryHigh": 0.3
  },
  "P_doom_2035|Med,Low,High": {
    "Low": 0.02,
    "Medium": 0.18,
    "High": 0.45,
    "VeryHigh": 0.35
  },
  "P_doom_2035|Hard,High,Low": {
    "Low": 0.1,
    "Medium": 0.2,
    "High": 0.4,
    "VeryHigh": 0.3
  },
  "P_doom_2035|Hard,High,Med": {
    "Low": 0.05,
    "Medium": 0.15,
    "High": 0.45,
    "VeryHigh": 0.35
  },
  "P_doom_2035|Hard,High,High": {
    "Low": 0.02,
    "Medium": 0.1,
    "High": 0.48,
    "VeryHigh": 0.4
  },
  "P_doom_2035|Hard,Med,Low": {
    "Low": 0.05,
    "Medium": 0.15,
    "High": 0.45,
    "VeryHigh": 0.35
  },
  "P_doom_2035|Hard,Med,Med": {
    "Low": 0.03,
    "Medium": 0.12,
    "High": 0.5,
    "VeryHigh": 0.35
  },
  "P_doom_2035|Hard,Med,High": {
    "Low": 0.01,
    "Medium": 0.09,
    "High": 0.5,
    "VeryHigh": 0.4
  },
  "P_doom_2035|Hard,Low,Low": {
    "Low": 0.02,
    "Medium": 0.1,
    "High": 0.53,
    "VeryHigh": 0.35
  },
  "P_doom_2035|Hard,Low,Med": {
    "Low": 0.01,
    "Medium": 0.07,
    "High": 0.52,
    "VeryHigh": 0.4
  },
  "P_doom_2035|Hard,Low,High": {
    "Low": 0.0,
    "Medium": 0.05,
    "High": 0.5,
    "VeryHigh": 0.45
  }
}; 