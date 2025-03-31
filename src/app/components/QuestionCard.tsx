'use client';

import { Question } from '../lib/question-data';

interface QuestionCardProps {
  question: Question;
  onOptionSelect: (value: string | number) => void;
}

export default function QuestionCard({ question, onOptionSelect }: QuestionCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">{question.text}</h2>
      
      <div className="space-y-3 mt-6">
        {question.options.map((option, index) => (
          <button
            key={index}
            onClick={() => onOptionSelect(option.value)}
            className="w-full text-left p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            {option.label}
          </button>
        ))}
      </div>
      
      <div className="mt-4 text-sm text-gray-500">
        <p>Question {question.id} (Level {question.level})</p>
      </div>
    </div>
  );
} 