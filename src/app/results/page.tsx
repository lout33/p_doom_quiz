'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getEvidence, resetEvidence } from '../lib/quiz-store';
import { loadCPTs } from '../lib/data-service';
import { analyzePDoom, formatProbRange, PDoomResults } from '../lib/bayes-network';
import { findClosestExpert } from '../lib/data-service';
import ResultsChart from '../components/ResultsChart';

export default function ResultsPage() {
  const [results, setResults] = useState<PDoomResults | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Calculate results
    try {
      const evidence = getEvidence();
      const cpts = loadCPTs();
      const pdoomResults = analyzePDoom(evidence, cpts);
      setResults(pdoomResults);
    } catch (error) {
      console.error('Error calculating results:', error);
    } finally {
      setLoading(false);
    }
    
    // Clean up function
    return () => {
      resetEvidence();
    };
  }, []);
  
  if (loading) {
    return (
      <div className="min-h-screen py-8 px-4 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Calculating Results...</h2>
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }
  
  if (!results) {
    return (
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-6 text-center">Error</h1>
          <p className="text-center mb-6">
            There was an error calculating your results. Please try again.
          </p>
          <div className="text-center">
            <Link 
              href="/quiz" 
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg"
            >
              Restart Quiz
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  // Find closest experts
  const closestExpert2035 = findClosestExpert(results.pdoom2035.central, 2035);
  const closestExpert2050 = findClosestExpert(results.pdoom2050.central || 0, 2050);
  const closestExpert2100 = findClosestExpert(results.pdoom2100.central || 0, 2100);
  
  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">Your P(doom) Results</h1>
        
        {/* 2035 Results */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-2">P(doom) by 2035</h2>
          <p className="text-sm text-gray-600 mb-4">
            Based on the Bayesian Network model and your responses
          </p>
          
          <div className="flex items-center mb-4">
            <div className="text-4xl font-bold text-blue-600">
              {results.pdoom2035.central.toFixed(1)}%
            </div>
            <div className="ml-4 text-gray-600">
              Range: {results.pdoom2035.lower.toFixed(1)}% - {results.pdoom2035.upper.toFixed(1)}%
            </div>
          </div>
          
          {closestExpert2035 && (
            <div className="mt-4 p-3 bg-blue-50 rounded">
              <p>
                Your 2035 estimate is closest to <strong>{closestExpert2035.name}</strong> 
                ({closestExpert2035.pdoom_2035_percent}%)
              </p>
            </div>
          )}
        </div>
        
        {/* Future Projections */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-2">Future Projections</h2>
          <p className="text-sm text-gray-600 mb-4">
            Heuristic estimates based on your 2035 result and {results.mostLikelyTimeline || 'Mid'} timeline
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold">P(doom) by 2050</h3>
              <div className="text-3xl font-bold text-purple-600">
                {results.pdoom2050.central?.toFixed(1) || 'N/A'}%
              </div>
              <div className="text-sm text-gray-600">
                Range: {results.pdoom2050.lower?.toFixed(1) || 'N/A'}% - 
                {results.pdoom2050.upper?.toFixed(1) || 'N/A'}%
              </div>
              
              {closestExpert2050 && (
                <div className="mt-2 text-sm">
                  Closest to <strong>{closestExpert2050.name}</strong> 
                  ({closestExpert2050.pdoom_2050_percent}%)
                </div>
              )}
            </div>
            
            <div>
              <h3 className="text-lg font-semibold">P(doom) by 2100</h3>
              <div className="text-3xl font-bold text-red-600">
                {results.pdoom2100.central?.toFixed(1) || 'N/A'}%
              </div>
              <div className="text-sm text-gray-600">
                Range: {results.pdoom2100.lower?.toFixed(1) || 'N/A'}% - 
                {results.pdoom2100.upper?.toFixed(1) || 'N/A'}%
              </div>
              
              {closestExpert2100 && (
                <div className="mt-2 text-sm">
                  Closest to <strong>{closestExpert2100.name}</strong> 
                  ({closestExpert2100.pdoom_2100_percent}%)
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Expert Comparison Chart */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Expert Comparison</h2>
          <ResultsChart results={results} />
        </div>
        
        <div className="text-center mt-8">
          <Link 
            href="/"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg"
          >
            Return Home
          </Link>
          <Link 
            href="/quiz"
            className="ml-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-6 rounded-lg"
          >
            Take Quiz Again
          </Link>
        </div>
        
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>
            Remember that these estimates are subjective and based on a simplified model.
            The results should be taken as a tool for thinking, not as scientific predictions.
          </p>
        </div>
      </div>
    </div>
  );
} 