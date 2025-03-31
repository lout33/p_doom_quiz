"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";
import { Bar } from "react-chartjs-2";
import { experts, Expert, findSimilarExperts } from "../api/questions";
import { formatProbRange } from "../api/bayesian";

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function ResultsContent() {
  const searchParams = useSearchParams();
  const [pdoomValues, setPdoomValues] = useState<{ 
    pdoom2035: number; 
    pdoom2035Range: [number, number];
    pdoom2050: number; 
    pdoom2050Range: [number, number];
    pdoom2100: number; 
    pdoom2100Range: [number, number];
  }>({ 
    pdoom2035: 0, 
    pdoom2035Range: [0, 0],
    pdoom2050: 0,
    pdoom2050Range: [0, 0],
    pdoom2100: 0,
    pdoom2100Range: [0, 0]
  });
  
  const [selectedYear, setSelectedYear] = useState<string>("2035");
  const [similarExperts, setSimilarExperts] = useState<Expert[]>([]);
  const [chartData, setChartData] = useState<{
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      backgroundColor: string[];
      borderColor: string[];
      borderWidth: number;
    }[];
  } | null>(null);
  
  useEffect(() => {
    try {
      // Get P(doom) values for different years
      const pdoom2035Param = searchParams.get('pdoom2035');
      const pdoom2035LowerParam = searchParams.get('pdoom2035Lower');
      const pdoom2035UpperParam = searchParams.get('pdoom2035Upper');
      
      const pdoom2050Param = searchParams.get('pdoom2050');
      const pdoom2050LowerParam = searchParams.get('pdoom2050Lower');
      const pdoom2050UpperParam = searchParams.get('pdoom2050Upper');
      
      const pdoom2100Param = searchParams.get('pdoom2100');
      const pdoom2100LowerParam = searchParams.get('pdoom2100Lower');
      const pdoom2100UpperParam = searchParams.get('pdoom2100Upper');
      
      // Legacy support for old parameter format
      const legacyPdoomParam = searchParams.get('pdoom');
      
      // Set default values and parse parameters
      let pdoom2035 = 0, pdoom2035Lower = 0, pdoom2035Upper = 0;
      let pdoom2050 = 0, pdoom2050Lower = 0, pdoom2050Upper = 0;
      let pdoom2100 = 0, pdoom2100Lower = 0, pdoom2100Upper = 0;
      
      if (pdoom2035Param) {
        pdoom2035 = parseFloat(pdoom2035Param);
        pdoom2035Lower = pdoom2035LowerParam ? parseFloat(pdoom2035LowerParam) : Math.max(0, pdoom2035 - 5);
        pdoom2035Upper = pdoom2035UpperParam ? parseFloat(pdoom2035UpperParam) : Math.min(100, pdoom2035 + 5);
      } else if (legacyPdoomParam) {
        // Legacy support
        pdoom2035 = parseFloat(legacyPdoomParam);
        pdoom2035Lower = Math.max(0, pdoom2035 - 5);
        pdoom2035Upper = Math.min(100, pdoom2035 + 5);
      }
      
      if (pdoom2050Param) {
        pdoom2050 = parseFloat(pdoom2050Param);
        pdoom2050Lower = pdoom2050LowerParam ? parseFloat(pdoom2050LowerParam) : Math.max(0, pdoom2050 - 7);
        pdoom2050Upper = pdoom2050UpperParam ? parseFloat(pdoom2050UpperParam) : Math.min(100, pdoom2050 + 7);
      } else if (pdoom2035 > 0) {
        // If 2050 wasn't provided but 2035 was, calculate a reasonable default
        pdoom2050 = Math.min(100, pdoom2035 + 10);
        pdoom2050Lower = Math.max(0, pdoom2035Lower + 8);
        pdoom2050Upper = Math.min(100, pdoom2035Upper + 12); 
      }
      
      if (pdoom2100Param) {
        pdoom2100 = parseFloat(pdoom2100Param);
        pdoom2100Lower = pdoom2100LowerParam ? parseFloat(pdoom2100LowerParam) : Math.max(0, pdoom2100 - 10);
        pdoom2100Upper = pdoom2100UpperParam ? parseFloat(pdoom2100UpperParam) : Math.min(100, pdoom2100 + 10);
      } else if (pdoom2035 > 0) {
        // If 2100 wasn't provided but 2035 was, calculate a reasonable default
        pdoom2100 = Math.min(100, pdoom2035 + 25);
        pdoom2100Lower = Math.max(0, pdoom2035Lower + 20);
        pdoom2100Upper = Math.min(100, pdoom2035Upper + 30);
      }
      
      // Store all values
      setPdoomValues({ 
        pdoom2035, pdoom2035Range: [pdoom2035Lower, pdoom2035Upper],
        pdoom2050, pdoom2050Range: [pdoom2050Lower, pdoom2050Upper],
        pdoom2100, pdoom2100Range: [pdoom2100Lower, pdoom2100Upper]
      });
      
      // Find similar experts for current year
      const matchingExperts = findSimilarExperts(pdoom2035, "2035");
      setSimilarExperts(matchingExperts);
      
      // Create chart data for current year
      createChartData(pdoom2035, [pdoom2035Lower, pdoom2035Upper], matchingExperts, "2035");
    } catch (error) {
      console.error("Error processing results:", error);
    }
  }, [searchParams]);

  // Handle year selection change
  const handleYearChange = (year: string) => {
    setSelectedYear(year);
    
    // Get the corresponding doom values for this year
    const pdoomForYear = pdoomValues[`pdoom${year}` as keyof typeof pdoomValues] as number;
    const pdoomRangeForYear = pdoomValues[`pdoom${year}Range` as keyof typeof pdoomValues] as [number, number];
    
    // Update similar experts for this year
    const matchingExperts = findSimilarExperts(pdoomForYear, year);
    setSimilarExperts(matchingExperts);
    
    // Update chart for this year
    createChartData(pdoomForYear, pdoomRangeForYear, matchingExperts, year);
  };
  
  // Chart data creation
  const createChartData = (
    pdoomValue: number, 
    pdoomRange: [number, number], 
    similarExpertsList: Expert[], 
    year: string
  ) => {
    // Sort experts by estimate
    const sortedExperts = [...experts].sort((a, b) => {
      const aValue = a[`pdoom_${year}_percent` as keyof Expert] as number || a.estimate;
      const bValue = b[`pdoom_${year}_percent` as keyof Expert] as number || b.estimate;
      return aValue - bValue;
    });
    
    // Get a subset of experts for better display
    const chartExperts = [
      sortedExperts[0], // lowest
      sortedExperts[Math.floor(sortedExperts.length * 0.2)], // 20th percentile
      sortedExperts[Math.floor(sortedExperts.length * 0.4)], // 40th percentile
      sortedExperts[Math.floor(sortedExperts.length * 0.6)], // 60th percentile
      sortedExperts[Math.floor(sortedExperts.length * 0.8)], // 80th percentile
      sortedExperts[sortedExperts.length - 1], // highest
      ...similarExpertsList // closest to user
    ].filter(Boolean); // Remove any undefined values
    
    // Remove duplicates
    const uniqueExpertsMap = new Map();
    chartExperts.forEach(expert => {
      if (expert && !uniqueExpertsMap.has(expert.name)) {
        uniqueExpertsMap.set(expert.name, expert);
      }
    });
    
    // Convert map to array and sort
    const uniqueExperts = Array.from(uniqueExpertsMap.values())
      .sort((a, b) => {
        const aValue = a[`pdoom_${year}_percent` as keyof Expert] as number || a.estimate;
        const bValue = b[`pdoom_${year}_percent` as keyof Expert] as number || b.estimate;
        return aValue - bValue;
      });
    
    // Add user to the list
    const expertsWithUser = [
      ...uniqueExperts,
      { 
        name: "YOUR ESTIMATE", 
        estimate: pdoomValue,
        lowerBound: pdoomRange[0],
        upperBound: pdoomRange[1]
      }
    ].sort((a, b) => {
      const aValue = a.name === "YOUR ESTIMATE" ? pdoomValue : 
        (a[`pdoom_${year}_percent` as keyof Expert] as number || a.estimate);
      const bValue = b.name === "YOUR ESTIMATE" ? pdoomValue : 
        (b[`pdoom_${year}_percent` as keyof Expert] as number || b.estimate);
      return aValue - bValue;
    });
    
    // Create chart data
    const chartConfig = {
      labels: expertsWithUser.map(e => e.name),
      datasets: [
        {
          label: `P(doom by ${year}) Estimate (%)`,
          data: expertsWithUser.map(e => 
            e.name === "YOUR ESTIMATE" ? pdoomValue : 
            (e[`pdoom_${year}_percent` as keyof Expert] as number || e.estimate)
          ),
          backgroundColor: expertsWithUser.map(e => 
            e.name === "YOUR ESTIMATE" ? 'rgba(255, 99, 132, 0.8)' : 'rgba(54, 162, 235, 0.8)'
          ),
          borderColor: expertsWithUser.map(e => 
            e.name === "YOUR ESTIMATE" ? 'rgb(255, 99, 132)' : 'rgb(54, 162, 235)'
          ),
          borderWidth: 1
        }
      ]
    };
    
    setChartData(chartConfig);
  };
  
  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        grid: {
          color: 'rgba(200, 200, 200, 0.2)'
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const dataIndex = context.dataIndex;
            const parsed = context.parsed.y !== undefined ? context.parsed.y : context.parsed;
            
            // Get the expert data for this index
            if (expertsWithUser && expertsWithUser[dataIndex]) {
              const expertData = expertsWithUser[dataIndex];
              if (expertData && expertData.lowerBound !== undefined && expertData.upperBound !== undefined) {
                return `P(doom): ${parsed}% (Range: ${expertData.lowerBound.toFixed(0)}%-${expertData.upperBound.toFixed(0)}%)`;
              }
            }
            return `P(doom): ${parsed}%`;
          }
        }
      }
    }
  };
  
  const getRiskCategory = (value: number): { label: string, color: string } => {
    if (value < 5) return { label: "Very Low", color: "bg-green-500" };
    if (value < 20) return { label: "Low", color: "bg-blue-500" };
    if (value < 40) return { label: "Moderate", color: "bg-yellow-500" };
    if (value < 70) return { label: "High", color: "bg-orange-500" };
    return { label: "Very High", color: "bg-red-500" };
  };
  
  // Get the current P(doom) value and range based on selected year
  const currentPdoom = pdoomValues[`pdoom${selectedYear}` as keyof typeof pdoomValues] as number;
  const currentPdoomRange = pdoomValues[`pdoom${selectedYear}Range` as keyof typeof pdoomValues] as [number, number];
  const riskCategory = getRiskCategory(currentPdoom);
  
  // Prepare data for tooltips
  const expertsWithUser = [...similarExperts, { 
    name: "YOUR ESTIMATE", 
    estimate: currentPdoom,
    lowerBound: currentPdoomRange[0],
    upperBound: currentPdoomRange[1]
  }];
  
  return (
    <div className="min-h-screen flex flex-col p-6 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto w-full">
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-8">Your P(doom) Results</h1>
        
        {/* Year Selection Tabs */}
        <div className="flex mb-6 rounded-lg overflow-hidden">
          {["2035", "2050", "2100"].map(year => (
            <button
              key={year}
              onClick={() => handleYearChange(year)}
              className={`flex-1 py-3 px-4 text-center transition-colors ${
                selectedYear === year 
                  ? "bg-blue-600 text-white" 
                  : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
              }`}
            >
              {year}
            </button>
          ))}
        </div>
        
        {/* Main result */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-6">
            <div className="text-center md:text-left">
              <h2 className="text-xl text-gray-600 dark:text-gray-400 mb-2">
                Your estimated probability of AI doom by {selectedYear}:
              </h2>
              <div className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600">
                {currentPdoom.toFixed(1)}%
              </div>
              <div className={`mt-2 inline-block px-3 py-1 rounded-full text-white ${riskCategory.color}`}>
                {riskCategory.label} Risk Level
              </div>
              <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                Bayesian model range: {currentPdoomRange[0].toFixed(1)}%-{currentPdoomRange[1].toFixed(1)}%
              </div>
            </div>
            
            <div className="h-32 md:h-40 w-full md:w-2/3">
              {chartData && <Bar data={chartData} options={chartOptions} />}
            </div>
          </div>
          
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="text-lg font-semibold mb-4">Your {selectedYear} estimate is similar to:</h3>
            {similarExperts.length > 0 ? (
              <div className="space-y-4">
                {similarExperts.map((expert, index) => (
                  <div key={index} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="font-medium">
                      {expert.name}: {(expert[`pdoom_${selectedYear}_percent` as keyof Expert] as number || expert.estimate)}%
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Categories of concern: {expert.categories}
                    </div>
                    {expert.lowerBound && expert.upperBound && (
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Range: {expert.lowerBound}% - {expert.upperBound}%
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 dark:text-gray-400">
                Your estimate doesn't closely match any of our listed experts.
              </p>
            )}
          </div>
        </div>
        
        {/* P(doom) Summary Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">P(doom) Summary by Year</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700">
                  <th className="border border-gray-200 dark:border-gray-600 px-4 py-2 text-left">Year</th>
                  <th className="border border-gray-200 dark:border-gray-600 px-4 py-2 text-left">Estimate</th>
                  <th className="border border-gray-200 dark:border-gray-600 px-4 py-2 text-left">Range</th>
                  <th className="border border-gray-200 dark:border-gray-600 px-4 py-2 text-left">Risk Level</th>
                </tr>
              </thead>
              <tbody>
                {["2035", "2050", "2100"].map(year => {
                  const yearValue = pdoomValues[`pdoom${year}` as keyof typeof pdoomValues] as number;
                  const yearRange = pdoomValues[`pdoom${year}Range` as keyof typeof pdoomValues] as [number, number];
                  const yearRisk = getRiskCategory(yearValue);
                  return (
                    <tr key={year} className={selectedYear === year ? "bg-blue-50 dark:bg-blue-900/20" : ""}>
                      <td className="border border-gray-200 dark:border-gray-600 px-4 py-2">{year}</td>
                      <td className="border border-gray-200 dark:border-gray-600 px-4 py-2">{yearValue.toFixed(1)}%</td>
                      <td className="border border-gray-200 dark:border-gray-600 px-4 py-2">
                        {yearRange[0].toFixed(1)}% - {yearRange[1].toFixed(1)}%
                      </td>
                      <td className="border border-gray-200 dark:border-gray-600 px-4 py-2">
                        <span className={`px-2 py-1 rounded-full text-white text-xs ${yearRisk.color}`}>
                          {yearRisk.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            Note: 2035 estimate is based on Bayesian network inference from your quiz answers. 2050 and 2100 values are heuristically derived from the 2035 model.
          </p>
        </div>
        
        {/* Methodology explanation */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">About the Bayesian Model</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Your results were calculated using a Bayesian network model that processes your answers through a causal graph of AI risk factors.
          </p>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            The range represents uncertainty due to variations in model parameters, similar to how the Python implementation applies sensitivity analysis.
          </p>
          <p className="text-gray-600 dark:text-gray-400">
            Unlike a simple weighted sum approach, the Bayesian model can capture complex interactions between questions and generate more nuanced predictions.
          </p>
        </div>
        
        {/* Share section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Share your results</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Share your P(doom) estimate with others to spark a conversation about AI risk.
          </p>
          <div className="flex flex-wrap gap-3">
            <button 
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              onClick={() => {
                const pdoom2035 = pdoomValues.pdoom2035;
                const pdoom2050 = pdoomValues.pdoom2050;
                const pdoom2100 = pdoomValues.pdoom2100;
                const text = `My AI P(doom) estimates: ${pdoom2035.toFixed(1)}% by 2035, ${pdoom2050.toFixed(1)}% by 2050, ${pdoom2100.toFixed(1)}% by 2100. What's yours?`;
                window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(window.location.href)}`, '_blank');
              }}
            >
              Twitter
            </button>
            <button 
              className="px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors"
              onClick={() => {
                window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank');
              }}
            >
              Facebook
            </button>
            <button 
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                alert('Link copied to clipboard!');
              }}
            >
              Copy Link
            </button>
          </div>
        </div>
        
        {/* Call to action */}
        <div className="text-center">
          <Link 
            href="/"
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full hover:opacity-90 transition-colors"
          >
            Take the Quiz Again
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

// Wrap the component in a Suspense boundary to fix build errors
export default function Results() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-gray-900">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-8 w-64 bg-gray-300 dark:bg-gray-700 rounded mb-8"></div>
          <div className="h-64 w-full max-w-md bg-gray-300 dark:bg-gray-700 rounded-xl"></div>
          <div className="mt-8 text-gray-500 dark:text-gray-400">Loading results...</div>
        </div>
      </div>
    }>
      <ResultsContent />
    </Suspense>
  );
} 