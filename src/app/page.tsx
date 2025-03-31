"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";

export default function Home() {
  const router = useRouter();
  const [isMouseOver, setIsMouseOver] = useState(false);
  
  return (
    <div className="min-h-screen flex flex-col p-6 bg-gray-50 dark:bg-gray-900">
      <main className="flex-grow flex flex-col items-center justify-center text-center max-w-4xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-8"
        >
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
            P(doom) Calculator
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 mb-6">
            What is the probability of AI triggering human extinction?
          </p>
          <div className="prose dark:prose-invert max-w-3xl mx-auto text-gray-600 dark:text-gray-400">
            <p>
              This tool uses a <span className="font-semibold">Bayesian network model</span> to estimate 
              your probability of AI-driven catastrophe based on your beliefs about key factors.
            </p>
            <p>
              We'll compare your estimates to those of AI safety experts and researchers 
              who have published on this topic.
            </p>
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="relative w-full max-w-md aspect-square mb-12"
          onMouseEnter={() => setIsMouseOver(true)}
          onMouseLeave={() => setIsMouseOver(false)}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full animate-pulse"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-3/4 h-3/4">
              <img
                src="/doom_meter.svg"
                alt="P(doom) Meter"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
          <motion.div 
            className="absolute inset-0 flex items-center justify-center"
            initial={{ rotate: -100 }}
            animate={{ 
              rotate: isMouseOver ? 30 : -100
            }}
            transition={{ 
              type: "spring", 
              stiffness: 100, 
              damping: 12 
            }}
            style={{ transformOrigin: "center 80%" }}
          >
            <div className="w-1/2 h-[2px] bg-red-500 translate-y-[20%] origin-left"></div>
          </motion.div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <button
            onClick={() => router.push('/quiz')}
            className="px-8 py-4 text-xl font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-full hover:shadow-lg transition-all duration-300 hover:scale-105"
          >
            Calculate Your P(doom)
          </button>
          
          <div className="mt-8 text-gray-600 dark:text-gray-400">
            <p className="mb-4">
              This implementation uses an advanced Bayesian network model to simulate causal relationships
              between factors that may contribute to AI risk.
            </p>
            
            <div className="mt-6 flex flex-col md:flex-row items-center justify-center space-y-4 md:space-y-0 md:space-x-8">
              <Link 
                href="https://github.com/loutfouz/p-doom-revisited" 
                target="_blank"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                View on GitHub
              </Link>
              <Link 
                href="/about" 
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                Learn More
              </Link>
            </div>
          </div>
        </motion.div>
      </main>
      
      <footer className="mt-auto pt-8 pb-4 text-center text-sm text-gray-500 dark:text-gray-400">
        <p>
          Based on the work by Zachary Stein-Perlman and Geoffrey Irving on P(doom) methodology.
        </p>
        <p className="mt-2">
          Implementation by Lucas Santana &amp; AI assistants using Next.js and Python.
        </p>
      </footer>
    </div>
  );
}
