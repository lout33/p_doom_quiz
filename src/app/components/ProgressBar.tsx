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
      <div className="flex justify-between mb-2">
        <div className="text-sm font-medium text-blue-400">Question {currentQuestion} of {totalQuestions}</div>
        <div className="text-sm font-medium text-blue-400">{Math.round(progress)}% Complete</div>
      </div>
      <div className="w-full bg-gray-800 rounded-full h-3 mb-2 overflow-hidden">
        <div 
          className="bg-gradient-to-r from-blue-600 to-indigo-700 h-3 rounded-full transition-all duration-700 ease-in-out"
          style={{ width: `${progress}%` }}
        >
          <div className="w-full h-full opacity-30 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(255,255,255,0.3)_10px,rgba(255,255,255,0.3)_20px)]"></div>
        </div>
      </div>
      <div className="flex justify-between px-1">
        {Array.from({ length: totalQuestions }).map((_, i) => (
          <div 
            key={i}
            className={`h-1.5 w-1.5 rounded-full transition-all duration-500 ${
              i + 1 <= currentQuestion 
                ? 'bg-blue-500 scale-110' 
                : 'bg-gray-700'
            }`}
          />
        ))}
      </div>
    </div>
  );
} 