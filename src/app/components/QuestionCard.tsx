'use client';

import { useState } from 'react';
import { Question } from '../lib/question-data';

interface QuestionCardProps {
  question: Question;
  onOptionSelect: (value: string | number) => void;
}

export default function QuestionCard({ question, onOptionSelect }: QuestionCardProps) {
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [animating, setAnimating] = useState(false);

  const handleSelect = (optionValue: string | number, index: number) => {
    setSelectedOptionIndex(index);
    setAnimating(true);
    
    // Add a slight delay before moving to the next question
    setTimeout(() => {
      onOptionSelect(optionValue);
      setSelectedOptionIndex(null);
      setAnimating(false);
    }, 400);
  };
  
  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700 transition-all duration-500 hover:shadow-xl">
      <div className="mb-6 pb-4 border-b border-gray-700">
        <span className="px-3 py-1 bg-blue-900 text-blue-300 text-xs font-medium rounded-full">
          Level {question.level}
        </span>
        <span className="ml-2 px-3 py-1 bg-gray-700 text-gray-300 text-xs font-medium rounded-full">
          {question.id}
        </span>
      </div>
      
      <h2 className="text-xl font-semibold mb-6 text-gray-100">{question.text}</h2>
      
      <div className="space-y-3 mt-6">
        {question.options.map((option, index) => (
          <button
            key={index}
            onClick={() => handleSelect(option.value, index)}
            disabled={animating}
            className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-300 transform
              ${selectedOptionIndex === index 
                ? 'border-blue-500 bg-blue-900/30 scale-[1.02]' 
                : 'border-gray-700 hover:border-blue-700 hover:bg-gray-700/50'}
              ${animating ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'}`
            }
          >
            <div className="flex items-center">
              <div className={`mr-3 w-5 h-5 rounded-full flex items-center justify-center border-2
                ${selectedOptionIndex === index ? 'border-blue-500 bg-blue-500' : 'border-gray-600'}`}>
                {selectedOptionIndex === index && (
                  <svg className="w-3 h-3 text-gray-900" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                  </svg>
                )}
              </div>
              <span className="text-gray-200 font-medium">{option.label}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
} 