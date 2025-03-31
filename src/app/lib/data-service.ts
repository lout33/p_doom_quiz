import { CPTs, createPerturbedCPTs } from './bayes-network';
import cptData from '../../../references/bn_cpts.json';

// Expert data type
export type Expert = {
  name: string;
  pdoom_2035_percent: number | null;
  pdoom_2050_percent: number | null;
  pdoom_2100_percent: number | null;
};

// Load CPTs from the imported JSON file
export function loadCPTs() {
  return createPerturbedCPTs(cptData as unknown as CPTs);
}

// Find expert with closest estimate to user for a specific year
export function findClosestExpert(userEstimate: number, year: 2035 | 2050 | 2100): Expert | null {
  // Load and parse experts data
  const experts = loadExperts();
  
  // Filter experts with valid data for this year
  const relevantExperts = experts.filter(
    e => e[`pdoom_${year}_percent`] !== null
  );
  
  if (relevantExperts.length === 0) return null;
  
  // Find expert with closest estimate
  let closestExpert = relevantExperts[0];
  let minDifference = Math.abs((closestExpert[`pdoom_${year}_percent`] || 0) - userEstimate);
  
  for (const expert of relevantExperts) {
    const expertValue = expert[`pdoom_${year}_percent`] || 0;
    const difference = Math.abs(expertValue - userEstimate);
    
    if (difference < minDifference) {
      minDifference = difference;
      closestExpert = expert;
    }
  }
  
  return closestExpert;
}

// Load all experts for a specific year (for chart data)
export function loadExpertsForYear(year: 2035 | 2050 | 2100): Expert[] {
  const experts = loadExperts();
  return experts.filter(e => e[`pdoom_${year}_percent`] !== null);
}

// Load and parse all experts
export function loadExperts(): Expert[] {
  try {
    // Hardcoded expert data based on the CSV file
    return [
      {
        name: "Eliezer Yudkowsky",
        pdoom_2035_percent: 90,
        pdoom_2050_percent: 95,
        pdoom_2100_percent: 99
      },
      {
        name: "Paul Christiano",
        pdoom_2035_percent: 5,
        pdoom_2050_percent: 10,
        pdoom_2100_percent: 20
      },
      {
        name: "Sam Altman",
        pdoom_2035_percent: 5,
        pdoom_2050_percent: 15,
        pdoom_2100_percent: 33
      },
      {
        name: "Geoffrey Hinton",
        pdoom_2035_percent: 10,
        pdoom_2050_percent: 30,
        pdoom_2100_percent: 60
      },
      {
        name: "Stuart Russell",
        pdoom_2035_percent: 5,
        pdoom_2050_percent: 20,
        pdoom_2100_percent: 50
      },
      {
        name: "Demis Hassabis",
        pdoom_2035_percent: 1,
        pdoom_2050_percent: 3,
        pdoom_2100_percent: 10
      },
      {
        name: "Yoshua Bengio",
        pdoom_2035_percent: 2,
        pdoom_2050_percent: 5,
        pdoom_2100_percent: 10
      },
      {
        name: "Andrew Ng",
        pdoom_2035_percent: 0,
        pdoom_2050_percent: 0,
        pdoom_2100_percent: 1
      },
      {
        name: "Yann LeCun",
        pdoom_2035_percent: 0,
        pdoom_2050_percent: 0,
        pdoom_2100_percent: 1
      },
      {
        name: "Helen Toner",
        pdoom_2035_percent: 3,
        pdoom_2050_percent: 10,
        pdoom_2100_percent: 20
      }
    ];
  } catch (error) {
    console.error("Failed to load experts data:", error);
    return [];
  }
} 