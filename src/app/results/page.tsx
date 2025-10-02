'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { calculateResults, logEvidence } from '../lib/quiz-store';
import { loadCPTs } from '../lib/data-service';
import { analyzePDoom, formatProbRange, PDoomResults } from '../lib/bayes-network';
import { findClosestExpert } from '../lib/data-service';
import ResultsChart from '../components/ResultsChart';
import { Evidence } from '../lib/bayes-network';
import FlameEffect from '../components/FlameEffect';
import EmberParticles from '../components/EmberParticles';

export default function ResultsPage() {
  const [results, setResults] = useState<PDoomResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [animate, setAnimate] = useState(false);
  const [nickname, setNickname] = useState<string>('');
  const [useStaticText, setUseStaticText] = useState(false);
  
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
      
      // Switch to static text after 2 seconds for readability
      setTimeout(() => setUseStaticText(true), 2100);
    }
    
    // Load nickname
    const storedNickname = localStorage.getItem('pdoom_nickname');
    if (storedNickname) {
      setNickname(storedNickname);
    }
  }, []);
  
  // Determine probability color based on value - DOOM THEME
  const getProbabilityColor = (value: number | null) => {
    if (value === null) return 'text-gray-400';
    if (value < 10) return 'text-yellow-400';
    if (value < 30) return 'text-orange-400';
    if (value < 60) return 'text-red-500';
    return 'text-red-600';
  };
  
  // Determine doom text effect class (switches to static after animation)
  const getDoomTextClass = (value: number | null) => {
    if (value === null) return '';
    const prefix = useStaticText ? 'doom-text-static-' : 'doom-text-';
    if (value < 10) return prefix + 'low';
    if (value < 30) return prefix + 'medium';
    if (value < 60) return prefix + 'high';
    return prefix + 'extreme';
  };
  
  // Create a flame gradient based on probability - DOOM THEME
  const getProbabilityGradient = (value: number | null) => {
    if (value === null) return 'bg-gray-700';
    if (value < 10) return 'flame-gradient-low';
    if (value < 30) return 'flame-gradient-medium';
    if (value < 60) return 'flame-gradient-high';
    return 'flame-gradient-extreme';
  };
  
  // Get flame intensity
  const getFlameIntensity = (value: number | null): 'low' | 'medium' | 'high' => {
    if (value === null || value < 30) return 'low';
    if (value < 60) return 'medium';
    return 'high';
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
  const closestExpert2040 = findClosestExpert(results.pdoom2040.central || 0, 2040);
  const closestExpert2060 = findClosestExpert(results.pdoom2060.central || 0, 2060);
  
  // Share functionality
  const handleShare = async () => {
    const shareText = `I just calculated my P(doom) estimate!

🎯 2035: ${results.pdoom2035.central.toFixed(1)}%
📈 2040: ${results.pdoom2040.central?.toFixed(1)}%
📊 2060: ${results.pdoom2060.central?.toFixed(1)}%

Calculate yours at: ${window.location.origin}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My P(doom) Results',
          text: shareText,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(shareText);
      alert('Results copied to clipboard!');
    }
  };
  
  return (
    <div className="min-h-screen py-8 px-4 bg-gradient-to-b from-black via-gray-900 to-red-950/20 relative overflow-hidden">
      {/* Apocalyptic overlay */}
      <div className="apocalyptic-overlay" />
      
      {/* Ember particles */}
      <EmberParticles count={results ? Math.min(50, Math.floor((results.pdoom2035.central / 2))) : 20} />
      
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2 text-gray-100">Your P(doom) Results</h1>
          {nickname && (
            <p className="text-lg text-blue-400 mb-2">Certificate for: <span className="font-semibold">{nickname}</span></p>
          )}
          <p className="text-gray-400">Based on your responses to the AI risk factor questionnaire</p>
        </div>
        
        {/* Main results card with animation */}
        <div className={`bg-gray-800/90 backdrop-blur-sm rounded-lg shadow-2xl p-8 mb-8 border-2 ${
          results.pdoom2035.central >= 60 ? 'border-red-600' :
          results.pdoom2035.central >= 30 ? 'border-orange-600' : 'border-gray-700'
        } transition-all duration-1000 transform relative overflow-hidden ${
          animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          {/* Flame effect background */}
          <div className="absolute top-0 left-0 right-0 opacity-20">
            <FlameEffect
              intensity={getFlameIntensity(results.pdoom2035.central)}
              size="medium"
            />
          </div>
          
          <div className="relative z-10">
            <h2 className="text-2xl font-semibold mb-2 text-gray-100">P(doom) by 2035</h2>
            <p className="text-sm text-gray-400 mb-6">
              {results.modelConfidence !== null
                ? `Framework estimate (${(results.modelConfidence * 100).toFixed(0)}% model confidence)`
                : 'Based on the Bayesian Network model and your responses to key AI risk factors'}
            </p>
            
            <div className="flex flex-col md:flex-row items-center mb-6">
              <div className={`text-7xl md:text-8xl font-bold mb-4 md:mb-0 ${getProbabilityColor(results.pdoom2035.central)} ${getDoomTextClass(results.pdoom2035.central)}`}>
                {results.pdoom2035.central.toFixed(1)}%
              </div>
              <div className="ml-0 md:ml-6 text-gray-400 text-center md:text-left flex-1">
                <div className="mb-3">
                  <span className="font-medium text-gray-300">Range:</span>
                  <span className="ml-2 text-lg font-semibold text-gray-200">
                    {results.pdoom2035.lower.toFixed(1)}% - {results.pdoom2035.upper.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-900 h-6 rounded-full overflow-hidden border-2 border-gray-700 shadow-inner relative">
                  <div
                    className={`h-full ${getProbabilityGradient(results.pdoom2035.central)} transition-all duration-1000 shadow-lg`}
                    style={{width: animate ? `${results.pdoom2035.central}%` : '0%'}}
                  >
                    {/* Inner glow effect */}
                    <div className="w-full h-full opacity-50 bg-gradient-to-t from-white/30 to-transparent" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Epistemic Uncertainty Adjustment */}
          {results.epistemicAdjusted && results.modelConfidence !== null && (
            <div className="mt-6 p-4 bg-purple-900/30 rounded-lg border border-purple-900">
              <div className="flex items-start">
                <div className="bg-purple-900 rounded-full p-2 mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-purple-300 mb-2">
                    Epistemic Uncertainty Adjusted Estimate
                  </p>
                  <div className="flex items-baseline gap-4 mb-2">
                    <div>
                      <span className="text-sm text-purple-400">Adjusted Central:</span>
                      <span className={`ml-2 text-2xl font-bold ${getProbabilityColor(results.epistemicAdjusted.pdoom2035.central)}`}>
                        {results.epistemicAdjusted.pdoom2035.central.toFixed(1)}%
                      </span>
                    </div>
                    <div className="text-sm text-purple-400">
                      Range: {results.epistemicAdjusted.pdoom2035.lower.toFixed(1)}% - {results.epistemicAdjusted.pdoom2035.upper.toFixed(1)}%
                    </div>
                  </div>
                  <p className="text-xs text-purple-400 mt-2">
                    This accounts for the possibility ({((1 - results.modelConfidence) * 100).toFixed(0)}%) that our understanding of AI risk is fundamentally incorrect.
                    Following the principle "if you predict you will update, update now" - your true p(doom) may be closer to this adjusted value.
                  </p>
                </div>
              </div>
            </div>
          )}
          
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
        <div className={`bg-gray-800/90 backdrop-blur-sm rounded-lg shadow-2xl p-8 mb-8 border-2 border-gray-700 transition-all duration-1000 transform relative overflow-hidden ${
          animate ? 'opacity-100 translate-y-0 delay-300' : 'opacity-0 translate-y-10'
        }`}>
          {/* Subtle flame background */}
          <div className="absolute top-0 left-0 right-0 opacity-10">
            <FlameEffect intensity="low" size="small" />
          </div>
          
          <div className="relative z-10">
            <h2 className="text-2xl font-semibold mb-2 text-gray-100">Future Projections</h2>
            <p className="text-sm text-gray-400 mb-6">
              Heuristic estimates based on your 2035 result and {results.mostLikelyTimeline || 'Mid'} timeline
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="p-6 bg-gray-900/80 rounded-lg border-2 border-orange-900/50 shadow-lg hover:border-orange-700/70 transition-all relative overflow-hidden group">
                {/* Hover flame effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity">
                  <FlameEffect intensity="medium" size="small" />
                </div>
                
                <div className="relative z-10">
                  <h3 className="text-xl font-semibold text-gray-100 mb-4">P(doom) by 2040</h3>
                  <div className={`text-5xl font-bold ${getProbabilityColor(results.pdoom2040.central)} ${getDoomTextClass(results.pdoom2040.central)}`}>
                    {results.pdoom2040.central?.toFixed(1) || 'N/A'}%
                  </div>
                  <div className="text-sm text-gray-400 mt-2 mb-3">
                    Range: {results.pdoom2040.lower?.toFixed(1) || 'N/A'}% -
                    {results.pdoom2040.upper?.toFixed(1) || 'N/A'}%
                  </div>
                  
                  <div className="w-full bg-gray-800 h-4 rounded-full overflow-hidden border border-gray-700 shadow-inner">
                    <div className={`h-full ${getProbabilityGradient(results.pdoom2040.central)} transition-all duration-1000`}
                         style={{width: animate ? `${results.pdoom2040.central || 0}%` : '0%'}}>
                      <div className="w-full h-full opacity-50 bg-gradient-to-t from-white/30 to-transparent" />
                    </div>
                  </div>
                  
                  {closestExpert2040 && (
                    <div className="mt-4 bg-gray-800/50 p-3 rounded shadow-sm border border-gray-700">
                      <div className="text-sm text-gray-300">
                        Closest to <strong>{closestExpert2040.name}</strong>
                        ({closestExpert2040.pdoom_2040_percent}%)
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="p-6 bg-gray-900/80 rounded-lg border-2 border-red-900/50 shadow-lg hover:border-red-700/70 transition-all relative overflow-hidden group">
                {/* Hover flame effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity">
                  <FlameEffect intensity="high" size="small" />
                </div>
                
                <div className="relative z-10">
                  <h3 className="text-xl font-semibold text-gray-100 mb-4">P(doom) by 2060</h3>
                  <div className={`text-5xl font-bold ${getProbabilityColor(results.pdoom2060.central)} ${getDoomTextClass(results.pdoom2060.central)}`}>
                    {results.pdoom2060.central?.toFixed(1) || 'N/A'}%
                  </div>
                  <div className="text-sm text-gray-400 mt-2 mb-3">
                    Range: {results.pdoom2060.lower?.toFixed(1) || 'N/A'}% -
                    {results.pdoom2060.upper?.toFixed(1) || 'N/A'}%
                  </div>
                  
                  <div className="w-full bg-gray-800 h-4 rounded-full overflow-hidden border border-gray-700 shadow-inner">
                    <div className={`h-full ${getProbabilityGradient(results.pdoom2060.central)} transition-all duration-1000`}
                         style={{width: animate ? `${results.pdoom2060.central || 0}%` : '0%'}}>
                      <div className="w-full h-full opacity-50 bg-gradient-to-t from-white/30 to-transparent" />
                    </div>
                  </div>
                  
                  {closestExpert2060 && (
                    <div className="mt-4 bg-gray-800/50 p-3 rounded shadow-sm border border-gray-700">
                      <div className="text-sm text-gray-300">
                        Closest to <strong>{closestExpert2060.name}</strong>
                        ({closestExpert2060.pdoom_2060_percent}%)
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Expert Comparison Chart */}
        <div className={`bg-gray-800/90 backdrop-blur-sm rounded-lg shadow-2xl p-8 mb-8 border-2 border-gray-700 transition-all duration-1000 transform ${
          animate ? 'opacity-100 translate-y-0 delay-500' : 'opacity-0 translate-y-10'
        }`}>
          <h2 className="text-2xl font-semibold mb-2 text-gray-100">Expert Comparison</h2>
          <p className="text-sm text-gray-400 mb-6">
            See how your estimate compares to AI researchers and industry experts
          </p>
          <ResultsChart results={results} nickname={nickname} />
        </div>
        
        <div className={`text-center mt-10 transition-all duration-1000 ${
          animate ? 'opacity-100 delay-700' : 'opacity-0'
        }`}>
          <button
            onClick={handleShare}
            className="bg-green-700 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-lg transition-colors shadow-md hover:shadow-lg mr-4 mb-4"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block mr-2 -mt-1" viewBox="0 0 20 20" fill="currentColor">
              <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
            </svg>
            Share Results
          </button>
          <Link
            href="/"
            className="bg-blue-800 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition-colors shadow-md hover:shadow-lg mr-4 mb-4 inline-block"
            onClick={handleStartNewQuiz}
          >
            Return Home
          </Link>
          <Link
            href="/quiz"
            className="bg-gray-800 hover:bg-gray-700 text-gray-200 font-bold py-3 px-8 rounded-lg transition-colors border border-gray-700 shadow-md hover:shadow-lg mb-4 inline-block"
            onClick={handleStartNewQuiz}
          >
            Take Quiz Again
          </Link>
          
          <div className="mt-8 text-sm text-gray-500 max-w-2xl mx-auto">
            <p className="mb-3">
              These estimates are based on a simplified Bayesian Network model and should be interpreted as subjective probabilities.
              The results should be taken as a tool for thinking about AI risk, not as definitive scientific predictions.
            </p>
            {results.modelConfidence !== null && results.modelConfidence < 1.0 && (
              <p className="text-purple-400 italic">
                Note: Your model confidence setting ({(results.modelConfidence * 100).toFixed(0)}%) indicates uncertainty about whether this framework captures the full picture of AI risk.
                The adjusted estimates reflect this meta-uncertainty.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 