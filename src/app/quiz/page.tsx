'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { evidence, updateEvidenceAndCalculate } from '../lib/quiz-store';
import { Question, questions } from '../lib/question-data';
import { Evidence } from '../lib/bayes-network';
import QuestionCard from '../components/QuestionCard';
import ProgressBar from '../components/ProgressBar';

export default function QuizPage() {
  const router = useRouter();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userEvidence, setUserEvidence] = useState<Evidence>({});
  const [intermediateResults, setIntermediateResults] = useState<{[key: string]: number} | null>(null);
  
  // Filter out the prior belief question which is handled separately
  const quizQuestions = questions.filter(q => !q.isPriorBelief);
  
  const progress = Math.round((currentQuestionIndex / quizQuestions.length) * 100);
  const currentQuestion = quizQuestions[currentQuestionIndex];
  
  // Handle option selection
  const handleOptionSelect = (question: Question, optionValue: string | number) => {
    // If it's a node state (string), we can directly apply it
    let nodeState = typeof optionValue === 'string' ? optionValue : String(optionValue);
    
    // Update evidence with the selected option
    const newEvidence = { ...userEvidence, [question.node]: nodeState };
    setUserEvidence(newEvidence);
    
    // Calculate intermediate results
    const results = updateEvidenceAndCalculate(newEvidence);
    if (results) {
      setIntermediateResults({
        central: results.pdoom2035.central
      });
    }
    
    // Move to the next question or results page
    if (currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex(prevIndex => prevIndex + 1);
    } else {
      // Save the final evidence and redirect to results
      router.push('/results');
    }
  };
  
  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">P(doom) Calculator Quiz</h1>
        
        <div className="mb-6">
          <ProgressBar 
            progress={progress} 
            currentQuestion={currentQuestionIndex + 1} 
            totalQuestions={quizQuestions.length} 
          />
        </div>
        
        {currentQuestion && (
          <QuestionCard 
            question={currentQuestion}
            onOptionSelect={(optionValue) => handleOptionSelect(currentQuestion, optionValue)}
          />
        )}
        
        {intermediateResults && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold mb-2">Current P(doom) Estimate:</h3>
            <p className="text-xl">
              {intermediateResults.central.toFixed(1)}%
            </p>
            <p className="text-sm text-gray-600 mt-1">
              This is an intermediate result based on your answers so far.
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 