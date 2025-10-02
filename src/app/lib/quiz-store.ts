'use client';

import { Evidence, PDoomResults, analyzePDoom } from './bayes-network';
import { loadCPTs } from './data-service';

// Load CPTs once
const cpts = loadCPTs();

// Extract model confidence from evidence
function extractModelConfidence(evidence: Evidence): number | null {
  if ('ModelConfidence' in evidence) {
    const value = evidence['ModelConfidence'];
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return isNaN(numValue as number) ? null : (numValue as number);
  }
  return null;
}

// Update evidence and calculate results - using a completely fresh approach
export function calculateResults(evidence: Evidence): PDoomResults | null {
  try {
    // Extract model confidence if present
    const modelConfidence = extractModelConfidence(evidence);
    
    // Log model confidence for debugging
    if (modelConfidence !== null) {
      console.log(`Model Confidence: ${(modelConfidence * 100).toFixed(0)}%`);
    }
    
    // Always use the provided evidence directly without any module-level state
    return analyzePDoom(evidence, cpts, modelConfidence);
  } catch (error) {
    console.error('Error calculating P(doom) results:', error);
    return null;
  }
}

// For debugging
export function logEvidence(evidence: Evidence, source: string): void {
  console.log(`Evidence from ${source}:`, JSON.stringify(evidence));
}