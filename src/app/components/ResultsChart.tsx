'use client';

import { useState } from 'react';
import { PDoomResults } from '../lib/bayes-network';
import { loadExpertsForYear, Expert } from '../lib/data-service';

// Simple bar chart style properties
const BAR_HEIGHT = 30;
const BAR_GAP = 8;
const BAR_COLOR = '#3b82f6'; // blue-500
const USER_BAR_COLOR = '#ef4444'; // red-500

interface ResultsChartProps {
  results: PDoomResults;
}

export default function ResultsChart({ results }: ResultsChartProps) {
  const [selectedYear, setSelectedYear] = useState<2035 | 2050 | 2100>(2035);
  
  // Get the appropriate P(doom) value based on the selected year
  const getUserEstimate = () => {
    if (selectedYear === 2035) return results.pdoom2035.central;
    if (selectedYear === 2050) return results.pdoom2050.central || 0;
    return results.pdoom2100.central || 0;
  };
  
  // Load experts data for the selected year
  const experts = loadExpertsForYear(selectedYear);
  
  // Add user to the experts list
  const userEstimate = getUserEstimate();
  
  // Create a properly typed merged array
  const allData: (Expert & { isUser?: boolean })[] = [
    ...experts,
    { 
      name: 'YOUR ESTIMATE', 
      pdoom_2035_percent: selectedYear === 2035 ? userEstimate : null,
      pdoom_2050_percent: selectedYear === 2050 ? userEstimate : null,
      pdoom_2100_percent: selectedYear === 2100 ? userEstimate : null,
      isUser: true
    }
  ].sort((a, b) => {
    const aValue = a[`pdoom_${selectedYear}_percent`] as number | null;
    const bValue = b[`pdoom_${selectedYear}_percent`] as number | null;
    return (aValue || 0) - (bValue || 0);
  });
  
  // Calculate total height based on number of items
  const chartHeight = (BAR_HEIGHT + BAR_GAP) * allData.length + 50;
  
  return (
    <div>
      {/* Year selector */}
      <div className="flex mb-6 border rounded-md overflow-hidden">
        {[2035, 2050, 2100].map((year) => (
          <button
            key={year}
            className={`flex-1 py-2 text-center transition-colors ${
              selectedYear === year 
                ? 'bg-blue-500 text-white font-medium' 
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
            onClick={() => setSelectedYear(year as 2035 | 2050 | 2100)}
          >
            {year}
          </button>
        ))}
      </div>
      
      {/* Simple bar chart */}
      <div className="mt-6 overflow-x-auto">
        <div style={{ minWidth: '500px', height: `${chartHeight}px` }}>
          {allData.map((item, index) => {
            const value = item[`pdoom_${selectedYear}_percent`] as number | null;
            const displayValue = value !== null ? value : 0;
            
            return (
              <div key={index} className="flex items-center mb-2 relative">
                <div className="w-40 text-sm truncate pr-2">
                  {item.name}
                </div>
                <div className="flex-1 relative">
                  <div 
                    className="rounded transition-all duration-500"
                    style={{ 
                      width: `${displayValue}%`, 
                      height: `${BAR_HEIGHT}px`,
                      backgroundColor: item.isUser ? USER_BAR_COLOR : BAR_COLOR
                    }}
                  ></div>
                  <span className="text-sm absolute right-0 top-0 ml-2">
                    {value !== null ? value.toFixed(1) : 'N/A'}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="mt-4 text-sm text-gray-600">
        <p>
          Showing {allData.length} experts plus your estimate, sorted by P(doom) percentage for {selectedYear}.
        </p>
      </div>
    </div>
  );
} 