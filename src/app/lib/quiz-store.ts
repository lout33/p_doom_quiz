'use client';

import { Evidence, PDoomResults, analyzePDoom } from './bayes-network';
import { loadCPTs } from './data-service';

// Store the evidence and CPTs
let evidence: Evidence = {};
const cpts = loadCPTs();

// Update evidence and calculate results
export function updateEvidenceAndCalculate(newEvidence: Evidence): PDoomResults | null {
  evidence = { ...evidence, ...newEvidence };
  try {
    return analyzePDoom(evidence, cpts);
  } catch (error) {
    console.error('Error calculating P(doom) results:', error);
    return null;
  }
}

// Get current evidence
export function getEvidence(): Evidence {
  return { ...evidence };
}

// Reset evidence
export function resetEvidence(): void {
  evidence = {};
}

// Export the evidence for module access
export { evidence }; 