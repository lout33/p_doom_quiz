'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { calculateResults, logEvidence } from '../lib/quiz-store';
import { loadCPTs } from '../lib/data-service';
import { analyzePDoom, formatProbRange, PDoomResults } from '../lib/bayes-network';
import { findClosestExpert } from '../lib/data-service';
import ResultsChart from '../components/ResultsChart';
import { Evidence } from '../lib/bayes-network';

export default function ResultsPage() {
  const [results, setResults] = useState<PDoomResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [animate, setAnimate] = useState(false);
  
  useEffect(() => {
    // Load evidence from localStorage
    try {
      const storedEvidence = localStorage.getItem('pdoom_evidence');
      let evidence: Evidence = {};
      
      if (storedEvidence) {
        evidence = JSON.parse(storedEvidence);
        logEvidence(evidence, 'results page (from localStorage)');
      } else {
        console.warn('No evidence found in localStorage, using empty evidence');
        logEvidence({}, 'results page (empty - no localStorage data)');
      }
      
      // Calculate results
      const pdoomResults = calculateResults(evidence);
      setResults(pdoomResults);
    } catch (error) {
      console.error('Error calculating results:', error);
    } finally {
      setLoading(false);
      
      // Trigger animations after a small delay
      setTimeout(() => setAnimate(true), 100);
    }
  }, []);
  
  // Determine probability color based on value
  const getProbabilityColor = (value: number | null) => {
    if (value === null) return 'text-gray-400';
    if (value < 10) return 'text-purple-400';
    if (value < 30) return 'text-pink-400';
    if (value < 60) return 'text-orange-400';
    return 'text-red-400';
  };
  
  // Create a linear gradient based on probability
  const getProbabilityGradient = (value: number | null) => {
    if (value === null) return 'bg-gray-700';
    return `bg-gradient-to-r ${
      value < 10 ? 'from-purple-600 to-purple-700' :
      value < 30 ? 'from-pink-500 to-pink-600' :
      value < 60 ? 'from-orange-600 to-orange-700' :
      'from-red-600 to-red-700'
    }`;
  };
  
  // Function to start a new quiz
  const handleStartNewQuiz = () => {
    // Clear localStorage
    localStorage.removeItem('pdoom_evidence');
    console.log('Evidence cleared for new quiz');
  };
  
  if (loading) {
    return (
      <div className="min-h-screen py-8 px-4 flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4 text-gray-100">Calculating Your Results...</h2>
          <div className="w-20 h-20 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-400 mt-4">Analyzing your responses and computing P(doom) estimates</p>
        </div>
      </div>
    );
  }
  
  if (!results) {
    return (
      <div className="min-h-screen py-8 px-4 bg-gray-900">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-6 text-center text-red-400">Error</h1>
          <div className="bg-gray-800 rounded-lg shadow-md p-8 text-center border border-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-red-500 mx-auto mb-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="text-gray-300 mb-6">
              There was an error calculating your results. Please try again.
            </p>
            <Link 
              href="/quiz" 
              className="bg-blue-700 hover:bg-blue-800 text-white font-bold py-3 px-8 rounded-lg transition-colors"
              onClick={handleStartNewQuiz}
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
    <div className="min-h-screen py-8 px-4 bg-gray-900">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2 text-center text-gray-100">Your P(doom) Results</h1>
        <p className="text-center text-gray-400 mb-8">Based on your responses to the AI risk factor questionnaire</p>
        
        {/* Main results card with animation */}
        <div className={`bg-gray-800 rounded-lg shadow-md p-8 mb-8 border border-gray-700 transition-all duration-1000 transform ${
          animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          <h2 className="text-2xl font-semibold mb-2 text-gray-100">P(doom) by 2035</h2>
          <p className="text-sm text-gray-400 mb-6">
            Based on the Bayesian Network model and your responses to key AI risk factors
          </p>
          
          <div className="flex flex-col md:flex-row items-center mb-6">
            <div className={`text-6xl font-bold mb-4 md:mb-0 ${getProbabilityColor(results.pdoom2035.central)}`}>
              {results.pdoom2035.central.toFixed(1)}%
            </div>
            <div className="ml-0 md:ml-6 text-gray-400 text-center md:text-left">
              <div className="mb-2">
                <span className="font-medium">Range:</span> {results.pdoom2035.lower.toFixed(1)}% - {results.pdoom2035.upper.toFixed(1)}%
              </div>
              <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                <div className={`h-full ${getProbabilityGradient(results.pdoom2035.central)}`} 
                     style={{width: `${results.pdoom2035.central}%`}}></div>
              </div>
            </div>
          </div>
          
          {closestExpert2035 && (
            <div className="mt-6 p-4 bg-blue-900/30 rounded-lg border border-blue-900">
              <div className="flex items-start">
                <div className="bg-blue-900 rounded-full p-2 mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-blue-300">
                    Your 2035 estimate is closest to <span className="font-bold">{closestExpert2035.name}</span> 
                    ({closestExpert2035.pdoom_2035_percent}%)
                  </p>
                  <p className="text-sm text-blue-400 mt-1">
                    Your estimate differs by only {Math.abs(results.pdoom2035.central - (closestExpert2035.pdoom_2035_percent || 0)).toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Future Projections */}
        <div className={`bg-gray-800 rounded-lg shadow-md p-8 mb-8 border border-gray-700 transition-all duration-1000 transform ${
          animate ? 'opacity-100 translate-y-0 delay-300' : 'opacity-0 translate-y-10'
        }`}>
          <h2 className="text-2xl font-semibold mb-2 text-gray-100">Future Projections</h2>
          <p className="text-sm text-gray-400 mb-6">
            Heuristic estimates based on your 2035 result and {results.mostLikelyTimeline || 'Mid'} timeline
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-6 bg-gray-900 rounded-lg border border-gray-700">
              <h3 className="text-xl font-semibold text-gray-100 mb-4">P(doom) by 2050</h3>
              <div className={`text-4xl font-bold ${getProbabilityColor(results.pdoom2050.central)}`}>
                {results.pdoom2050.central?.toFixed(1) || 'N/A'}%
              </div>
              <div className="text-sm text-gray-400 mt-2 mb-3">
                Range: {results.pdoom2050.lower?.toFixed(1) || 'N/A'}% - 
                {results.pdoom2050.upper?.toFixed(1) || 'N/A'}%
              </div>
              
              <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                <div className={`h-full ${getProbabilityGradient(results.pdoom2050.central)}`} 
                     style={{width: `${results.pdoom2050.central || 0}%`}}></div>
              </div>
              
              {closestExpert2050 && (
                <div className="mt-4 bg-gray-800 p-3 rounded shadow-sm border border-gray-700">
                  <div className="text-sm text-gray-300">
                    Closest to <strong>{closestExpert2050.name}</strong> 
                    ({closestExpert2050.pdoom_2050_percent}%)
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-6 bg-gray-900 rounded-lg border border-gray-700">
              <h3 className="text-xl font-semibold text-gray-100 mb-4">P(doom) by 2100</h3>
              <div className={`text-4xl font-bold ${getProbabilityColor(results.pdoom2100.central)}`}>
                {results.pdoom2100.central?.toFixed(1) || 'N/A'}%
              </div>
              <div className="text-sm text-gray-400 mt-2 mb-3">
                Range: {results.pdoom2100.lower?.toFixed(1) || 'N/A'}% - 
                {results.pdoom2100.upper?.toFixed(1) || 'N/A'}%
              </div>
              
              <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                <div className={`h-full ${getProbabilityGradient(results.pdoom2100.central)}`} 
                     style={{width: `${results.pdoom2100.central || 0}%`}}></div>
              </div>
              
              {closestExpert2100 && (
                <div className="mt-4 bg-gray-800 p-3 rounded shadow-sm border border-gray-700">
                  <div className="text-sm text-gray-300">
                    Closest to <strong>{closestExpert2100.name}</strong> 
                    ({closestExpert2100.pdoom_2100_percent}%)
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Expert Comparison Chart */}
        <div className={`bg-gray-800 rounded-lg shadow-md p-8 mb-8 border border-gray-700 transition-all duration-1000 transform ${
          animate ? 'opacity-100 translate-y-0 delay-500' : 'opacity-0 translate-y-10'
        }`}>
          <h2 className="text-2xl font-semibold mb-2 text-gray-100">Expert Comparison</h2>
          <p className="text-sm text-gray-400 mb-6">
            See how your estimate compares to AI researchers and industry experts
          </p>
          <ResultsChart results={results} />
        </div>
        
        <div className={`text-center mt-10 transition-all duration-1000 ${
          animate ? 'opacity-100 delay-700' : 'opacity-0'
        }`}>
          <Link 
            href="/"
            className="bg-blue-800 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition-colors shadow-md hover:shadow-lg mr-4"
            onClick={handleStartNewQuiz}
          >
            Return Home
          </Link>
          <Link 
            href="/quiz"
            className="bg-gray-800 hover:bg-gray-700 text-gray-200 font-bold py-3 px-8 rounded-lg transition-colors border border-gray-700 shadow-md hover:shadow-lg"
            onClick={handleStartNewQuiz}
          >
            Take Quiz Again
          </Link>
          
          <div className="mt-8 text-sm text-gray-500 max-w-2xl mx-auto">
            <p>
              These estimates are based on a simplified Bayesian Network model and should be interpreted as subjective probabilities.
              The results should be taken as a tool for thinking about AI risk, not as definitive scientific predictions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 