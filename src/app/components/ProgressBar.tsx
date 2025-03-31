'use client';

interface ProgressBarProps {
  progress: number;
  currentQuestion: number;
  totalQuestions: number;
}

export default function ProgressBar({ 
  progress, 
  currentQuestion, 
  totalQuestions 
}: ProgressBarProps) {
  return (
    <div className="w-full">
      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
        <div 
          className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      <div className="text-sm text-gray-600">
        Question {currentQuestion} of {totalQuestions}
      </div>
    </div>
  );
} 