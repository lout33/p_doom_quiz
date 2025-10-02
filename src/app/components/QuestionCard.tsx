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
  
  // Get level icon
  const getLevelIcon = () => {
    if (question.level === 1) return '⚠️';
    if (question.level === 2) return '🔥';
    return '☠️';
  };
  
  // Get level color scheme
  const getLevelColors = () => {
    if (question.level === 1) return {
      border: 'border-yellow-900/50',
      bg: 'bg-yellow-900/10',
      text: 'text-yellow-400'
    };
    if (question.level === 2) return {
      border: 'border-orange-900/50',
      bg: 'bg-orange-900/10',
      text: 'text-orange-400'
    };
    return {
      border: 'border-red-900/50',
      bg: 'bg-red-900/10',
      text: 'text-red-400'
    };
  };
  
  // Determine option risk level and colors
  const getOptionColors = (optionLabel: string) => {
    const label = optionLabel.toLowerCase();
    
    // Safe/positive options (green)
    if (label.includes('very unlikely') || label.includes('strongly disagree') ||
        label.includes('very low') || label.includes('minimal')) {
      return {
        border: 'border-green-700',
        hover: 'hover:border-green-500 hover:bg-green-900/20',
        selected: 'border-green-500 bg-green-900/30',
        glow: 'shadow-green-500/50',
        radio: 'border-green-500 bg-green-500'
      };
    }
    
    // Moderate options (yellow)
    if (label.includes('unlikely') || label.includes('disagree') ||
        label.includes('low') || label.includes('somewhat')) {
      return {
        border: 'border-yellow-700',
        hover: 'hover:border-yellow-500 hover:bg-yellow-900/20',
        selected: 'border-yellow-500 bg-yellow-900/30',
        glow: 'shadow-yellow-500/50',
        radio: 'border-yellow-500 bg-yellow-500'
      };
    }
    
    // Concerning options (orange)
    if (label.includes('likely') || label.includes('agree') ||
        label.includes('high') || label.includes('significant')) {
      return {
        border: 'border-orange-700',
        hover: 'hover:border-orange-500 hover:bg-orange-900/20',
        selected: 'border-orange-500 bg-orange-900/30',
        glow: 'shadow-orange-500/50',
        radio: 'border-orange-500 bg-orange-500'
      };
    }
    
    // Critical options (red)
    if (label.includes('very likely') || label.includes('strongly agree') ||
        label.includes('very high') || label.includes('extreme')) {
      return {
        border: 'border-red-700',
        hover: 'hover:border-red-500 hover:bg-red-900/20',
        selected: 'border-red-500 bg-red-900/30',
        glow: 'shadow-red-500/50',
        radio: 'border-red-500 bg-red-500'
      };
    }
    
    // Default (gray)
    return {
      border: 'border-gray-700',
      hover: 'hover:border-gray-500 hover:bg-gray-700/50',
      selected: 'border-gray-500 bg-gray-700/50',
      glow: 'shadow-gray-500/50',
      radio: 'border-gray-500 bg-gray-500'
    };
  };
  
  const levelColors = getLevelColors();
  
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