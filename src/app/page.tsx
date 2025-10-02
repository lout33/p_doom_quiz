'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import FlameEffect from './components/FlameEffect';
import EmberParticles from './components/EmberParticles';

export default function Home() {
  const [showAnimation, setShowAnimation] = useState(false);
  
  // Function to clear localStorage for a fresh quiz
  const handleStartQuiz = () => {
    // Clear localStorage to ensure a fresh start
    localStorage.removeItem('pdoom_evidence');
    console.log('Evidence cleared before starting new quiz from homepage');
  };
  
  useEffect(() => {
    setShowAnimation(true);
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 md:p-24 bg-gradient-to-b from-black via-gray-900 to-red-950/20 relative overflow-hidden">
      {/* Apocalyptic overlay */}
      <div className="apocalyptic-overlay" />
      
      {/* Ember particles */}
      <EmberParticles count={30} />
      
      <div className="max-w-3xl mx-auto text-center relative z-10">
        {/* Doom Meter Visual */}
        <div className={`mb-8 relative transition-all duration-1000 transform ${
          showAnimation ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}>
          <div className="relative w-48 h-48 mx-auto mb-6">
            {/* Flame effect background */}
            <div className="absolute inset-0 opacity-40">
              <FlameEffect intensity="high" size="medium" />
            </div>
            
            {/* Doom meter circle */}
            <div className="absolute inset-0 rounded-full border-4 border-red-600 bg-black/50 backdrop-blur-sm flex items-center justify-center doom-text-extreme">
              <div className="text-center">
                <div className="text-6xl font-bold">☠️</div>
                <div className="text-sm font-semibold mt-2 text-red-400">P(doom)</div>
              </div>
            </div>
          </div>
        </div>
        
        <h1 className={`text-4xl md:text-6xl font-bold mb-6 doom-text-high transition-all duration-1000 ${
          showAnimation ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}>
          P(doom) Calculator
        </h1>
        <p className={`text-xl mb-8 text-gray-300 transition-all duration-1000 delay-200 ${
          showAnimation ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}>
          Estimate the probability of AI-related existential catastrophe based on your
          beliefs about key factors.
        </p>
        
        <div className={`mb-10 bg-gray-800/90 backdrop-blur-sm p-6 rounded-lg shadow-2xl border-2 border-red-900/50 relative overflow-hidden transition-all duration-1000 delay-300 ${
          showAnimation ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}>
          {/* Subtle flame background */}
          <div className="absolute top-0 left-0 right-0 opacity-10">
            <FlameEffect intensity="low" size="small" />
          </div>
          
          <div className="relative z-10">
            <h2 className="text-2xl font-semibold mb-3 text-gray-200">How It Works</h2>
            <ol className="text-left list-decimal list-inside space-y-2 text-gray-300">
              <li>Enter your nickname and answer questions about AI risk factors</li>
              <li>Get your P(doom) estimate for 2035 based on a Bayesian Network</li>
              <li>See heuristic projections for 2040 and 2060</li>
              <li>Compare your estimates with 13 AI experts and researchers</li>
              <li>Get a personalized certificate and share your results</li>
              <li>Click on experts to learn about their backgrounds and sources</li>
            </ol>
          </div>
        </div>
        
        <div className={`transition-all duration-1000 delay-500 ${
          showAnimation ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}>
          <Link
            href="/quiz"
            className="flame-gradient-high text-white font-bold py-4 px-10 rounded-lg text-xl transition-all shadow-2xl hover:shadow-red-900/50 hover:scale-105 inline-block border-2 border-red-600"
            onClick={handleStartQuiz}
          >
            🔥 Start Quiz 🔥
          </Link>
        </div>
        
        <div className={`mt-10 transition-all duration-1000 delay-700 ${
          showAnimation ? 'opacity-100' : 'opacity-0'
        }`}>
          <h3 className="text-xl font-semibold mb-2 text-gray-200">Educational Purpose</h3>
          <p className="text-sm text-gray-400">
            This tool is designed for educational purposes to help people think about AI risk in a structured way.
            The P(doom) estimates are subjective and should not be taken as scientific predictions.
          </p>
        </div>
      </div>
    </main>
  );
} 