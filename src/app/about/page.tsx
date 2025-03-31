"use client";

import { useState } from "react";
import Link from "next/link";

export default function About() {
  const [activeTab, setActiveTab] = useState<"about" | "methodology" | "bayesian">("about");
  
  return (
    <div className="min-h-screen flex flex-col p-6 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto w-full">
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-8">About P(doom) Calculator</h1>
        
        {/* Tab navigation */}
        <div className="flex mb-6 rounded-lg overflow-hidden">
          <button
            onClick={() => setActiveTab("about")}
            className={`flex-1 py-3 px-4 text-center transition-colors ${
              activeTab === "about" 
                ? "bg-blue-600 text-white" 
                : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
            }`}
          >
            About the Project
          </button>
          <button
            onClick={() => setActiveTab("methodology")}
            className={`flex-1 py-3 px-4 text-center transition-colors ${
              activeTab === "methodology" 
                ? "bg-blue-600 text-white" 
                : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
            }`}
          >
            Methodology
          </button>
          <button
            onClick={() => setActiveTab("bayesian")}
            className={`flex-1 py-3 px-4 text-center transition-colors ${
              activeTab === "bayesian" 
                ? "bg-blue-600 text-white" 
                : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
            }`}
          >
            Bayesian Networks
          </button>
        </div>
        
        {/* About content */}
        {activeTab === "about" && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">What is P(doom)?</h2>
            <div className="prose dark:prose-invert max-w-none">
              <p>
                P(doom) is the probability that advanced AI will cause an existential catastrophe. 
                The concept has been discussed by AI safety researchers as a way to quantify 
                the risk posed by artificial general intelligence (AGI) and artificial superintelligence (ASI).
              </p>
              
              <p>
                This calculator is based on research by Zachary Stein-Perlman and Geoffrey Irving on 
                measuring P(doom) and using Bayesian networks to model complex interconnected beliefs 
                about AI risk factors.
              </p>
              
              <h3 className="text-xl font-semibold mt-6 mb-2">Why calculate P(doom)?</h3>
              <p>
                Understanding and quantifying AI risk is crucial for several reasons:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>It helps prioritize research and safety measures</li>
                <li>It allows for more precise discussions about existential risk</li>
                <li>It helps track how risk assessments change over time</li>
                <li>It reveals differences in assumptions between experts</li>
              </ul>
              
              <h3 className="text-xl font-semibold mt-6 mb-2">About this Implementation</h3>
              <p>
                This web application is an interactive implementation of P(doom) calculation 
                using Bayesian networks. The original methodology has been extended and adapted 
                for an interactive web experience, with:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Multiple timeframes (2035, 2050, 2100)</li>
                <li>Comparison with expert estimates</li>
                <li>Real-time feedback during question answering</li>
                <li>Uncertainty ranges in the probability estimates</li>
              </ul>
            </div>
          </div>
        )}
        
        {/* Methodology content */}
        {activeTab === "methodology" && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">Methodology</h2>
            <div className="prose dark:prose-invert max-w-none">
              <p>
                The P(doom) Calculator is based on a structured approach to decomposing beliefs about AI risk 
                into more concrete, assessable factors. The methodology follows these key principles:
              </p>
              
              <h3 className="text-xl font-semibold mt-6 mb-2">Question Selection</h3>
              <p>
                Questions are selected to cover the main factors that influence the probability of AI-driven 
                existential catastrophe, including:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Technical AI development timelines</li>
                <li>AI capabilities and power-seeking behavior</li>
                <li>Alignment difficulty</li>
                <li>Human coordination and security</li>
                <li>Governance and deployment decisions</li>
              </ul>
              
              <h3 className="text-xl font-semibold mt-6 mb-2">Expert Comparisons</h3>
              <p>
                The calculator compares your estimates with those from AI safety experts who have 
                published their P(doom) assessments. These experts include researchers from organizations 
                like Anthropic, OpenAI, DeepMind, and academic institutions.
              </p>
              
              <p>
                Expert estimates were collected from published papers, blog posts, and public statements, 
                with adjustments made to standardize the timeframes (2035, 2050, 2100) when needed.
              </p>
              
              <h3 className="text-xl font-semibold mt-6 mb-2">Limitations</h3>
              <p>
                It's important to recognize several limitations of this approach:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Subjective beliefs are inherently difficult to quantify precisely</li>
                <li>The factors influencing P(doom) are complex and interconnected</li>
                <li>Expert opinions vary widely and change over time</li>
                <li>The Bayesian network is a simplified model of complex relationships</li>
                <li>This is an educational tool, not a definitive prediction</li>
              </ul>
            </div>
          </div>
        )}
        
        {/* Bayesian Networks content */}
        {activeTab === "bayesian" && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">Bayesian Networks</h2>
            <div className="prose dark:prose-invert max-w-none">
              <p>
                This implementation uses a Bayesian network to model the relationships between 
                different AI risk factors and calculate the overall P(doom).
              </p>
              
              <h3 className="text-xl font-semibold mt-6 mb-2">What is a Bayesian Network?</h3>
              <p>
                A Bayesian network is a probabilistic graphical model that represents variables and 
                their conditional dependencies via a directed acyclic graph (DAG). In the context of 
                P(doom) calculation, this allows us to:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Model complex causal relationships between risk factors</li>
                <li>Update probabilities based on new evidence (your answers)</li>
                <li>Represent uncertainty in the model parameters</li>
                <li>Capture how different factors influence each other</li>
              </ul>
              
              <h3 className="text-xl font-semibold mt-6 mb-2">Advantages Over Simple Methods</h3>
              <p>
                Using a Bayesian network provides several advantages over simpler calculation methods:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>It can capture non-linear relationships between factors</li>
                <li>It properly handles conditional dependencies</li>
                <li>It can be updated with new information over time</li>
                <li>It produces probability ranges that reflect parameter uncertainty</li>
                <li>It better models the complex causal structure of real-world risks</li>
              </ul>
              
              <h3 className="text-xl font-semibold mt-6 mb-2">Implementation Details</h3>
              <p>
                Our implementation:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Is based on the Python implementation by Zachary Stein-Perlman</li>
                <li>Has been ported to TypeScript for web integration</li>
                <li>Uses conditional probability tables (CPTs) to encode relationships</li>
                <li>Performs Monte Carlo sampling to generate probability ranges</li>
                <li>Is optimized for real-time feedback in the browser environment</li>
              </ul>
              
              <p className="mt-4">
                For those interested in the technical details, the source code for this implementation 
                is available on <a href="https://github.com/loutfouz/p-doom-revisited" className="text-blue-600 dark:text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">GitHub</a>.
              </p>
            </div>
          </div>
        )}
        
        {/* Call to action */}
        <div className="text-center">
          <Link 
            href="/quiz"
            className="px-6 py-3 mr-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full hover:opacity-90 transition-colors"
          >
            Take the Quiz
          </Link>
          <Link 
            href="/"
            className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Back to Home
          </Link>
        </div>
        
        {/* Disclaimer */}
        <div className="mt-12 text-sm text-gray-500 dark:text-gray-400 text-center">
          This is an educational tool and not a scientific prediction. P(doom) estimates are highly subjective.
        </div>
      </div>
    </div>
  );
} 