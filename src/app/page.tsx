'use client';

import Link from 'next/link';

export default function Home() {
  // Function to clear localStorage for a fresh quiz
  const handleStartQuiz = () => {
    // Clear localStorage to ensure a fresh start
    localStorage.removeItem('pdoom_evidence');
    console.log('Evidence cleared before starting new quiz from homepage');
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 md:p-24 bg-gray-900">
      <div className="max-w-3xl mx-auto text-center">
        <h1 className="text-3xl md:text-5xl font-bold mb-6 text-gray-100">
          P(doom) Calculator
        </h1>
        <p className="text-xl mb-8 text-gray-300">
          Estimate the probability of AI-related existential catastrophe based on your
          beliefs about key factors.
        </p>
        
        <div className="mb-10 bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700">
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
        
        <Link
          href="/quiz"
          className="bg-blue-800 hover:bg-blue-700 text-blue-100 font-bold py-3 px-8 rounded-lg text-xl transition-all shadow-md hover:shadow-lg"
          onClick={handleStartQuiz}
        >
          Start Quiz
        </Link>
        
        <div className="mt-10">
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