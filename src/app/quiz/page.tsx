"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { questions } from "../api/questions";
import { AnswerDetail } from "../api/questions";
import { mapAnswersToBNEvidence, evaluatePdoom } from "../api/bayesian";
import { CPTs } from "../api/cpts";

// Constants for heuristic calculations (matching vanilla_bn2.py)
const TIMELINE_MULTIPLIER = {
  "Slow": 0.7,
  "Moderate": 1.0,
  "Fast": 1.5,
  "VeryFast": 2.0
};
const DEFAULT_TIMELINE = "Moderate";
const BASE_INCREASE_2050 = 10; // Additional increase for 2050
const BASE_INCREASE_2100 = 15; // Additional increase for 2100 (on top of 2050)

function QuizContent() {
  const router = useRouter();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, AnswerDetail>>({});
  const [pdoom, setPdoom] = useState(0);
  const [doomMeter, setDoomMeter] = useState(0);
  
  // Current question
  const currentQuestion = questions[currentQuestionIndex];
  
  // Progress percentage
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  
  // Handle selecting an answer
  const handleAnswer = (answerIndex: number) => {
    const question = questions[currentQuestionIndex];
    const selectedAnswer = question.answers[answerIndex];
    
    // Calculate the base increase
    const baseIncrease = selectedAnswer.pdoom_increase;
    const weight = selectedAnswer.weight;
    const weightedIncrease = baseIncrease * weight;
    
    // Store answer info
    const answerInfo: AnswerDetail = {
      questionId: question.id,
      question: question.question,
      answer: selectedAnswer.text,
      baseIncrease,
      weight,
      weightedIncrease,
      category: question.category
    };
    
    // Update answers
    const updatedAnswers = {
      ...userAnswers,
      [question.id]: answerInfo
    };
    
    setUserAnswers(updatedAnswers);
    
    // Calculate P(doom) using Bayesian network
    // This is a simplified approach for interactive feedback
    // Full BN calculation will be done at the end
    const simpleEstimate = Object.values(updatedAnswers).reduce(
      (total, answer) => total + answer.weightedIncrease, 0
    );
    
    // If we're on the last question, calculate the full BN result
    // Otherwise, just do a simple approximation for the meter
    if (currentQuestionIndex === questions.length - 1) {
      // Convert answers to BN evidence
      const evidence = mapAnswersToBNEvidence(updatedAnswers);
      
      // Calculate P(doom) values using Bayesian network
      const { pdoom2035 } = evaluatePdoom(evidence, CPTs);
      
      // Update with the BN-calculated value
      setPdoom(pdoom2035);
      animateDoomMeter(pdoom2035);
    } else {
      // Use simple sum for real-time feedback
      setPdoom(simpleEstimate);
      animateDoomMeter(simpleEstimate);
    }
    
    // Go to next question or results
    if (currentQuestionIndex < questions.length - 1) {
      setTimeout(() => {
        setCurrentQuestionIndex(prev => prev + 1);
      }, 500);
    } else {
      // Navigate to results page with Bayesian network results
      setTimeout(() => {
        // Convert answers to BN evidence
        const evidence = mapAnswersToBNEvidence(updatedAnswers);
        
        // Calculate P(doom) values using Bayesian network
        const {
          pdoom2035,
          pdoom2035Range,
          pdoom2050,
          pdoom2050Range,
          pdoom2100,
          pdoom2100Range
        } = evaluatePdoom(evidence, CPTs);
        
        // Pass these values to the results page
        router.push(`/results?pdoom2035=${pdoom2035}&pdoom2035Lower=${pdoom2035Range[0]}&pdoom2035Upper=${pdoom2035Range[1]}&pdoom2050=${pdoom2050}&pdoom2050Lower=${pdoom2050Range[0]}&pdoom2050Upper=${pdoom2050Range[1]}&pdoom2100=${pdoom2100}&pdoom2100Lower=${pdoom2100Range[0]}&pdoom2100Upper=${pdoom2100Range[1]}`);
      }, 1000);
    }
  };
  
  // Smoothly update doom meter
  const animateDoomMeter = (targetValue: number) => {
    setDoomMeter(prev => {
      if (Math.abs(prev - targetValue) < 0.5) return targetValue;
      return prev < targetValue ? prev + 0.5 : prev - 0.5;
    });
    
    if (Math.abs(doomMeter - targetValue) > 0.5) {
      setTimeout(() => animateDoomMeter(targetValue), 10);
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col p-6 bg-gray-50 dark:bg-gray-900">
      {/* Progress bar */}
      <div className="w-full max-w-3xl mx-auto mb-8">
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
          <div 
            className="bg-gradient-to-r from-blue-500 to-purple-600 h-2.5 rounded-full transition-all duration-500 ease-out" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          Question {currentQuestionIndex + 1} of {questions.length}
        </div>
      </div>
      
      {/* Doom meter */}
      <div className="w-full max-w-3xl mx-auto mb-8 flex items-center">
        <div className="mr-3 text-sm text-gray-600 dark:text-gray-400">P(doom):</div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
          <div 
            className="bg-gradient-to-r from-blue-400 via-orange-400 to-red-500 h-4 rounded-full transition-all duration-300 ease-in-out" 
            style={{ width: `${Math.min(doomMeter, 100)}%` }}
          ></div>
        </div>
        <div className="ml-3 font-medium">{doomMeter.toFixed(1)}%</div>
      </div>
      
      {/* Category indicator */}
      <div className="w-full max-w-3xl mx-auto -mb-4">
        <span className="inline-block px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium">
          {currentQuestion.category}
        </span>
      </div>
      
      {/* Question card */}
      <div className="w-full max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">{currentQuestion.question}</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm italic">
          {currentQuestion.reasoning}
        </p>
        
        {/* Answer options */}
        <div className="space-y-3">
          {currentQuestion.answers.map((answer, index) => (
            <button
              key={index}
              onClick={() => handleAnswer(index)}
              className="w-full text-left p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex justify-between items-center"
            >
              <span>{answer.text}</span>
              <span className="text-sm text-gray-500">
                +{answer.pdoom_increase}% × {answer.weight}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Wrap the component in a Suspense boundary to fix build errors
export default function Quiz() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-gray-900">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-8 w-64 bg-gray-300 dark:bg-gray-700 rounded mb-8"></div>
          <div className="h-64 w-full max-w-md bg-gray-300 dark:bg-gray-700 rounded-xl"></div>
          <div className="mt-8 text-gray-500 dark:text-gray-400">Loading questions...</div>
        </div>
      </div>
    }>
      <QuizContent />
    </Suspense>
  );
} 