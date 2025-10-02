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
  // Determine flame color based on progress
  const getFlameClass = () => {
    if (progress < 25) return 'flame-gradient-low';
    if (progress < 50) return 'flame-gradient-low';
    if (progress < 75) return 'flame-gradient-medium';
    return 'flame-gradient-high';
  };

  return (
    <div className="w-full">
      <div className="flex justify-between mb-2">
        <div className="text-sm font-medium text-red-400">Question {currentQuestion} of {totalQuestions}</div>
        <div className="text-sm font-medium text-orange-400">{Math.round(progress)}% Complete</div>
      </div>
      <div className="w-full bg-gray-900 rounded-full h-4 mb-2 overflow-hidden border-2 border-gray-700 shadow-inner">
        <div
          className={`${getFlameClass()} h-4 rounded-full transition-all duration-700 ease-in-out relative`}
          style={{ width: `${progress}%` }}
        >
          <div className="w-full h-full opacity-40 bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
        </div>
      </div>
      <div className="flex justify-between px-1">
        {Array.from({ length: totalQuestions }).map((_, i) => (
          <div
            key={i}
            className={`h-2 w-2 rounded-full transition-all duration-500 ${
              i + 1 <= currentQuestion
                ? 'bg-red-500 scale-110 shadow-lg shadow-red-500/50'
                : 'bg-gray-700'
            }`}
          />
        ))}
      </div>
    </div>
  );
} 