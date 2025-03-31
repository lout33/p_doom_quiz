'use client';

import { Evidence, PDoomResults, analyzePDoom } from './bayes-network';
import { loadCPTs } from './data-service';

// Load CPTs once
const cpts = loadCPTs();

// Update evidence and calculate results - using a completely fresh approach
export function calculateResults(evidence: Evidence): PDoomResults | null {
  try {
    // Always use the provided evidence directly without any module-level state
    return analyzePDoom(evidence, cpts);
  } catch (error) {
    console.error('Error calculating P(doom) results:', error);
    return null;
  }
}

// For debugging
export function logEvidence(evidence: Evidence, source: string): void {
  console.log(`Evidence from ${source}:`, JSON.stringify(evidence));
} 