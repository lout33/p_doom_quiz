'use client';

import { useState, useEffect } from 'react';
import { PDoomResults } from '../lib/bayes-network';
import { loadExpertsForYear, Expert } from '../lib/data-service';
import ExpertModal from './ExpertModal';

// Chart style properties
const BAR_HEIGHT = 32;
const BAR_GAP = 10;
const BAR_COLORS = {
  low: '#fbbf24', // yellow-400 - DOOM THEME
  medium: '#fb923c', // orange-400 - DOOM THEME
  high: '#ef4444', // red-500 - DOOM THEME
  veryHigh: '#dc2626', // red-600 - DOOM THEME
  user: '#3b82f6', // blue-500
};

interface ResultsChartProps {
  results: PDoomResults;
  nickname?: string;
}

export default function ResultsChart({ results, nickname }: ResultsChartProps) {
  const [selectedYear, setSelectedYear] = useState<2035 | 2040 | 2060>(2035);
  const [animateIn, setAnimateIn] = useState(false);
  const [selectedExpert, setSelectedExpert] = useState<Expert | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Animate bars in on mount and year change
  useEffect(() => {
    setAnimateIn(false);
    const timer = setTimeout(() => setAnimateIn(true), 100);
    return () => clearTimeout(timer);
  }, [selectedYear]);
  
  // Get the appropriate P(doom) value based on the selected year
  const getUserEstimate = () => {
    if (selectedYear === 2035) return results.pdoom2035.central;
    if (selectedYear === 2040) return results.pdoom2040.central || 0;
    return results.pdoom2060.central || 0;
  };
  
  // Load experts data for the selected year
  const experts = loadExpertsForYear(selectedYear);
  
  // Add user to the experts list
  const userEstimate = getUserEstimate();
  const displayName = nickname ? nickname.toUpperCase() : 'YOUR ESTIMATE';
  
  // Create a properly typed merged array
  const allData: (Expert & { isUser?: boolean })[] = [
    ...experts,
    {
      name: displayName,
      pdoom_2035_percent: selectedYear === 2035 ? userEstimate : null,
      pdoom_2040_percent: selectedYear === 2040 ? userEstimate : null,
      pdoom_2060_percent: selectedYear === 2060 ? userEstimate : null,
      isUser: true
    }
  ].sort((a, b) => {
    const aValue = a[`pdoom_${selectedYear}_percent`] as number | null;
    const bValue = b[`pdoom_${selectedYear}_percent`] as number | null;
    return (aValue || 0) - (bValue || 0);
  });
  
  // Calculate total height based on number of items
  const chartHeight = (BAR_HEIGHT + BAR_GAP) * allData.length + 50;
  
  // Determine color based on probability value - DOOM THEME
  const getBarColor = (value: number | null, isUser: boolean = false) => {
    if (isUser) return BAR_COLORS.user;
    if (value === null) return '#4b5563'; // gray-600
    if (value < 10) return BAR_COLORS.low;
    if (value < 30) return BAR_COLORS.medium;
    if (value < 60) return BAR_COLORS.high;
    return BAR_COLORS.veryHigh;
  };
  
  // Get flame gradient class for bars
  const getFlameGradientClass = (value: number | null) => {
    if (value === null) return '';
    if (value < 10) return 'flame-gradient-low';
    if (value < 30) return 'flame-gradient-medium';
    if (value < 60) return 'flame-gradient-high';
    return 'flame-gradient-extreme';
  };
  
  return (
    <div>
      {/* Year selector */}
      <div className="flex mb-8 border border-gray-700 rounded-lg overflow-hidden shadow-sm">
        {[2035, 2040, 2060].map((year) => (
          <button
            key={year}
            className={`flex-1 py-3 text-center transition-all duration-300 ${
              selectedYear === year
                ? 'bg-gradient-to-r from-blue-800 to-blue-900 text-white font-medium shadow-inner'
                : 'bg-gray-800 hover:bg-gray-700 text-gray-200'
            }`}
            onClick={() => setSelectedYear(year as 2035 | 2040 | 2060)}
          >
            {year}
          </button>
        ))}
      </div>
      
      {/* Legend */}
      <div className="flex justify-center space-x-4 mb-6">
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full mr-1" style={{ backgroundColor: BAR_COLORS.user }}></div>
          <span className="text-sm">Your Estimate</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full mr-1" style={{ backgroundColor: BAR_COLORS.low }}></div>
          <span className="text-sm">&lt;10%</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full mr-1" style={{ backgroundColor: BAR_COLORS.medium }}></div>
          <span className="text-sm">10-30%</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full mr-1" style={{ backgroundColor: BAR_COLORS.high }}></div>
          <span className="text-sm">30-60%</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full mr-1" style={{ backgroundColor: BAR_COLORS.veryHigh }}></div>
          <span className="text-sm">&gt;60%</span>
        </div>
      </div>
      
      {/* Simple bar chart */}
      <div className="mt-6 overflow-x-auto rounded-lg bg-gray-800 p-4 shadow-md border border-gray-700">
        <div className="flex px-2 py-1 mb-4 text-sm font-medium">
          <div className="w-48 text-gray-300">Expert</div>
          <div className="flex-1 text-gray-300">P(doom) for {selectedYear}</div>
        </div>
        <div style={{ minWidth: '500px', height: `${chartHeight}px` }}>
          {allData.map((item, index) => {
            const value = item[`pdoom_${selectedYear}_percent`] as number | null;
            const displayValue = value !== null ? value : 0;
            const barColor = getBarColor(value, item.isUser);
            
            return (
              <div
                key={index}
                className={`flex items-center mb-3 relative ${!item.isUser ? 'cursor-pointer hover:bg-gray-700/30 rounded-lg p-2 -m-2 transition-colors' : ''}`}
                onClick={() => {
                  if (!item.isUser) {
                    setSelectedExpert(item);
                    setIsModalOpen(true);
                  }
                }}
              >
                <div className={`w-48 flex items-center ${item.isUser ? 'font-bold text-blue-300' : 'font-medium text-gray-300'}`}>
                  {item.isUser && (
                    <div className="h-6 w-1 bg-blue-500 mr-2 rounded"></div>
                  )}
                  <span className="truncate">{item.name}</span>
                </div>
                <div className="flex-1 relative h-8">
                  <div className="absolute inset-y-0 left-0 bg-gray-800 w-full rounded-full border border-gray-700"></div>
                  <div
                    className={`absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ${
                      animateIn ? 'opacity-100' : 'opacity-0 scale-x-0'
                    } ${!item.isUser && value !== null ? getFlameGradientClass(value) : ''}`}
                    style={{
                      width: `${displayValue}%`,
                      backgroundColor: item.isUser || value === null ? barColor : undefined,
                      transformOrigin: 'left',
                      boxShadow: value !== null && value >= 60 ? '0 0 20px rgba(220, 38, 38, 0.6)' : undefined
                    }}
                  >
                    {item.isUser && (
                      <>
                        <div className="w-full h-full opacity-30 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(255,255,255,0.2)_10px,rgba(255,255,255,0.2)_20px)]"></div>
                        <div className="absolute inset-0 opacity-50 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                      </>
                    )}
                  </div>
                  <span className={`text-sm font-medium absolute right-0 top-0 bottom-0 flex items-center pr-2 transition-opacity duration-500 text-gray-200 ${
                    animateIn ? 'opacity-100' : 'opacity-0'
                  }`}>
                    {value !== null ? value.toFixed(1) : 'N/A'}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="mt-6 text-sm text-gray-400 bg-gray-800 p-4 rounded-lg border border-gray-700">
        <h3 className="font-medium mb-1 text-gray-200">About this chart</h3>
        <p className="mb-2">
          Shows estimates from {allData.length - 1} experts plus your calculated estimate,
          sorted by P(doom) percentage for {selectedYear}.
        </p>
        <p className="text-blue-400">
          💡 Click on any expert name to see their background and sources
        </p>
      </div>
      
      {/* Expert Modal */}
      <ExpertModal
        expert={selectedExpert}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedExpert(null);
        }}
        year={selectedYear}
      />
    </div>
  );
} 