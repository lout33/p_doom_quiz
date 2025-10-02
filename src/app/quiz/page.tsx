'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { calculateResults, logEvidence } from '../lib/quiz-store';
import { Question, questions } from '../lib/question-data';
import { Evidence } from '../lib/bayes-network';
import QuestionCard from '../components/QuestionCard';
import ProgressBar from '../components/ProgressBar';

export default function QuizPage() {
  const router = useRouter();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userEvidence, setUserEvidence] = useState<Evidence>({});
  const [intermediateResults, setIntermediateResults] = useState<{[key: string]: number} | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [nickname, setNickname] = useState('');
  const [showNicknameInput, setShowNicknameInput] = useState(true);
  
  // Start with fresh evidence on mount
  useEffect(() => {
    setUserEvidence({});
    setIntermediateResults(null);
    // Initialize localStorage when the component mounts
    localStorage.removeItem('pdoom_evidence');
    localStorage.removeItem('pdoom_nickname');
    
    // Check if nickname already exists
    const existingNickname = localStorage.getItem('pdoom_nickname');
    if (existingNickname) {
      setNickname(existingNickname);
      setShowNicknameInput(false);
    }
  }, []);
  
  // Filter out the prior belief question which is handled separately
  const quizQuestions = questions.filter(q => !q.isPriorBelief);
  
  const progress = Math.round((currentQuestionIndex / quizQuestions.length) * 100);
  const currentQuestion = quizQuestions[currentQuestionIndex];
  
  // Handle nickname submission
  const handleNicknameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nickname.trim().length >= 2) {
      localStorage.setItem('pdoom_nickname', nickname.trim());
      setShowNicknameInput(false);
    }
  };
  
  // Handle option selection
  const handleOptionSelect = (question: Question, optionValue: string | number) => {
    // If it's a node state (string), we can directly apply it
    let nodeState = typeof optionValue === 'string' ? optionValue : String(optionValue);
    
    // Update evidence with the selected option
    const newEvidence = { ...userEvidence, [question.node]: nodeState };
    setUserEvidence(newEvidence);
    
    // Save evidence to localStorage for results page
    localStorage.setItem('pdoom_evidence', JSON.stringify(newEvidence));
    logEvidence(newEvidence, 'quiz selection');
    
    // Calculate intermediate results
    const results = calculateResults(newEvidence);
    if (results) {
      setIntermediateResults({
        central: results.pdoom2035.central,
        lower: results.pdoom2035.lower,
        upper: results.pdoom2035.upper
      });
    }
    
    // Add transition effect between questions
    setIsTransitioning(true);
    setTimeout(() => {
      // Move to the next question or results page
      if (currentQuestionIndex < quizQuestions.length - 1) {
        setCurrentQuestionIndex(prevIndex => prevIndex + 1);
      } else {
        // Navigate to results
        router.push('/results');
      }
      setIsTransitioning(false);
    }, 600);
  };
  
  // Get probability color based on value
  const getProbabilityColor = (value: number) => {
    if (value < 10) return 'text-purple-400';
    if (value < 30) return 'text-pink-400';
    if (value < 60) return 'text-orange-400';
    return 'text-red-400';
  };
  
  // Show nickname input screen
  if (showNicknameInput) {
    return (
      <div className="min-h-screen py-8 px-4 bg-gray-900 flex items-center justify-center">
        <div className="max-w-md w-full">
          <div className="bg-gray-800 rounded-lg shadow-md p-8 border border-gray-700">
            <h1 className="text-3xl font-bold mb-2 text-center text-gray-100">Welcome to P(doom)</h1>
            <p className="text-center text-gray-400 mb-8">Enter your nickname to get started</p>
            
            <form onSubmit={handleNicknameSubmit}>
              <div className="mb-6">
                <label htmlFor="nickname" className="block text-sm font-medium text-gray-300 mb-2">
                  Your Nickname
                </label>
                <input
                  type="text"
                  id="nickname"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Enter 2-20 characters"
                  maxLength={20}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-2">
                  This will appear on your P(doom) certificate
                </p>
              </div>
              
              <button
                type="submit"
                disabled={nickname.trim().length < 2}
                className={`w-full py-3 rounded-lg font-semibold transition-all ${
                  nickname.trim().length >= 2
                    ? 'bg-blue-700 hover:bg-blue-600 text-white shadow-md hover:shadow-lg'
                    : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                }`}
              >
                Continue to Quiz
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen py-8 px-4 bg-gray-900">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold text-gray-100">P(doom) Calculator</h1>
          <div className="text-sm text-gray-400">
            Welcome, <span className="text-blue-400 font-semibold">{nickname}</span>
          </div>
        </div>
        <p className="text-center text-gray-400 mb-8">Answer questions about AI risk factors to calculate existential risk probability</p>
        
        <div className="mb-8">
          <ProgressBar 
            progress={progress} 
            currentQuestion={currentQuestionIndex + 1} 
            totalQuestions={quizQuestions.length} 
          />
        </div>
        
        <div className={`transition-all duration-500 transform ${
          isTransitioning ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'
        }`}>
          {currentQuestion && (
            <QuestionCard 
              question={currentQuestion}
              onOptionSelect={(optionValue) => handleOptionSelect(currentQuestion, optionValue)}
            />
          )}
        </div>
        
        {intermediateResults && (
          <div className="mt-8 p-6 bg-gray-800 rounded-lg shadow-md border border-gray-700 transition-all duration-500">
            <h3 className="font-semibold mb-3 text-gray-200">Current P(doom) Estimate:</h3>
            <div className="flex items-center mb-4">
              <div className={`text-4xl font-bold ${getProbabilityColor(intermediateResults.central)}`}>
                {intermediateResults.central.toFixed(1)}%
              </div>
              <div className="ml-4 text-gray-400 text-sm">
                Range: {intermediateResults.lower.toFixed(1)}% - {intermediateResults.upper.toFixed(1)}%
              </div>
            </div>
            
            {/* Visual probability bar */}
            <div className="w-full h-5 bg-gray-700 rounded-full overflow-hidden mb-3">
              <div 
                className="h-full transition-all duration-700 ease-in-out"
                style={{ 
                  width: `${intermediateResults.central}%`,
                  background: `linear-gradient(90deg, 
                    rgba(167, 139, 250, 0.9) 0%, 
                    rgba(236, 72, 153, 0.9) 33%, 
                    rgba(249, 115, 22, 0.9) 66%, 
                    rgba(220, 38, 38, 0.9) 100%)`
                }}
              ></div>
            </div>
            
            <div className="flex justify-between text-xs text-gray-500">
              <span>0%</span>
              <span>25%</span>
              <span>50%</span>
              <span>75%</span>
              <span>100%</span>
            </div>
            
            <p className="text-sm text-gray-400 mt-4">
              This intermediate result shows the current P(doom) calculation based on your answers so far.
            </p>
          </div>
        )}
        
        <div className="mt-8 flex justify-between">
          <button
            onClick={() => currentQuestionIndex > 0 && setCurrentQuestionIndex(prev => prev - 1)}
            disabled={currentQuestionIndex === 0}
            className={`px-4 py-2 rounded-md transition-all ${
              currentQuestionIndex === 0 
                ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
                : 'bg-gray-700 text-gray-200 shadow hover:shadow-md hover:bg-gray-600'
            }`}
          >
            Previous
          </button>
          
          <div className="text-sm text-gray-400">
            Question {currentQuestionIndex + 1} of {quizQuestions.length}
          </div>
          
          <button
            onClick={() => router.push('/results')}
            className="px-4 py-2 bg-blue-900 text-blue-200 rounded-md hover:bg-blue-800 transition-all shadow hover:shadow-md"
          >
            Skip to Results
          </button>
        </div>
      </div>
    </div>
  );
}