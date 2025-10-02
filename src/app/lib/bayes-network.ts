// Bayesian Network implementation for P(doom) calculator
// Based on the Python implementation in references/vanilla_bn2.py

// Types for our Bayesian Network
export type NodeState = string;
export type NodeName = string;
export type ParentsMap = Record<NodeName, NodeName[]>;
export type StatesMap = Record<NodeName, NodeState[]>;
export type Evidence = Record<NodeName, NodeState>;

// Distribution types
export type Distribution = Record<NodeState, number>;
export type ConditionalDistribution = Record<string, Distribution>;

// CPT types
export type CPTs = Record<NodeName, Distribution | ConditionalDistribution>;
export type Probabilities = Record<NodeName, Distribution>;

// Configuration
export const KEY_DELIMITER = '|';
export const PERTURBATION_DELTA = 0.10; // For sensitivity analysis on 2035 CPT

// Heuristic configuration
export const BASE_INCREASE_2040 = 5.0;
export const BASE_INCREASE_2060 = 10.0;
export const TIMELINE_MULTIPLIER: Record<string, number> = {
  'Early': 0.6,
  'Mid': 1.0,
  'Late': 1.5
};
export const DEFAULT_TIMELINE_FOR_HEURISTIC = 'Mid';

// Define Network Structure (Parents) and Node States
export const PARENTS: ParentsMap = {
  'Timeline': [], 'Coordination': [], 'Interpretability': [], 'MisusePotential': [], // Priors
  'AlignmentSolvability': ['Timeline', 'Interpretability'],
  'Competition': ['Coordination'],
  'WarningShot': ['Coordination'],
  'Regulation': ['Coordination', 'Competition', 'WarningShot'],
  'DeceptionRisk': ['AlignmentSolvability'],
  'SelfReplication': ['Timeline'],
  'PowerConcentration': ['Competition'],
  'ControlLossRisk': ['Timeline', 'MisusePotential', 'DeceptionRisk'],
  'P_doom_2035': ['AlignmentSolvability', 'Regulation', 'ControlLossRisk']
};

export const STATES: StatesMap = {
  'Timeline': ['Early', 'Mid', 'Late'],
  'Coordination': ['Good', 'Med', 'Poor'],
  'Interpretability': ['Good', 'Med', 'Poor'],
  'MisusePotential': ['Low', 'Med', 'High'],
  'AlignmentSolvability': ['Easy', 'Med', 'Hard'],
  'Competition': ['Low', 'Med', 'High'],
  'WarningShot': ['Low', 'Med', 'High'],
  'Regulation': ['High', 'Med', 'Low'],
  'DeceptionRisk': ['Low', 'Med', 'High'],
  'SelfReplication': ['Low', 'Med', 'High'],
  'ControlLossRisk': ['Low', 'Med', 'High'],
  'PowerConcentration': ['Low', 'Med', 'High'],
  'P_doom_2035': ['Low', 'Medium', 'High', 'VeryHigh']
};

// Helper functions
export function safeFloat(value: string | number | null | undefined, defaultValue: number | null = null): number | null {
  if (value === null || value === undefined || value === '') return defaultValue;
  const num = typeof value === 'number' ? value : Number(value);
  return isNaN(num) ? defaultValue : num;
}

export function normalizeDistribution(dist: Distribution): Distribution {
  const total = Object.values(dist).reduce((sum, val) => sum + val, 0);
  if (total === 0) {
    const numStates = Object.keys(dist).length;
    return numStates > 0 
      ? Object.keys(dist).reduce((acc, key) => ({ ...acc, [key]: 1.0 / numStates }), {})
      : dist;
  }
  return Object.entries(dist).reduce((acc, [key, val]) => ({ ...acc, [key]: val / total }), {});
}

export function formatProbRange(prob: number | null, delta: number = 5): string {
  if (prob === null) return "N/A";
  const pct = prob * 100;
  if (pct < 0.01) return "< 1%";
  if (pct > 99.99) return "> 99%";
  const lower = Math.max(0, Math.round(pct) - delta);
  const upper = Math.min(100, Math.round(pct) + delta);
  if (lower === upper) {
    if (lower === 0) return `approx. ${Math.min(100, lower + delta)}%`;
    if (upper === 100) return `approx. ${Math.max(0, upper - delta)}%`;
    return `approx. ${lower}%`;
  }
  if (lower >= upper) return `approx. ${Math.round(pct)}%`;
  return `${lower}% - ${upper}%`;
}

// Function to perturb a distribution for sensitivity analysis
export function perturbDistribution(
  dist: Distribution, 
  delta: number, 
  pessimistic: boolean = true
): Distribution {
  // Check if this is the P_doom_2035 node
  const isPdoomNode = Object.keys(dist).length === 4 && 
                      'Low' in dist && 'Medium' in dist && 
                      'High' in dist && 'VeryHigh' in dist;
  
  if (!isPdoomNode) return dist;
  
  const newDist = { ...dist };
  const shiftPerStatePair = delta / 2.0;
  
  if (pessimistic) {
    // Shift probability from Low/Medium to High/VeryHigh
    const takeFromLow = Math.min(newDist['Low'] || 0, shiftPerStatePair);
    const takeFromMed = Math.min(newDist['Medium'] || 0, shiftPerStatePair);
    const totalTaken = takeFromLow + takeFromMed;
    
    newDist['Low'] = (newDist['Low'] || 0) - takeFromLow;
    newDist['Medium'] = (newDist['Medium'] || 0) - takeFromMed;
    
    const addToHigh = totalTaken / 2.0;
    const addToVh = totalTaken / 2.0;
    
    newDist['High'] = (newDist['High'] || 0) + addToHigh;
    newDist['VeryHigh'] = (newDist['VeryHigh'] || 0) + addToVh;
  } else {
    // Optimistic: Shift probability from High/VeryHigh to Low/Medium
    const takeFromHigh = Math.min(newDist['High'] || 0, shiftPerStatePair);
    const takeFromVh = Math.min(newDist['VeryHigh'] || 0, shiftPerStatePair);
    const totalTaken = takeFromHigh + takeFromVh;
    
    newDist['High'] = (newDist['High'] || 0) - takeFromHigh;
    newDist['VeryHigh'] = (newDist['VeryHigh'] || 0) - takeFromVh;
    
    const addToLow = totalTaken / 2.0;
    const addToMed = totalTaken / 2.0;
    
    newDist['Low'] = (newDist['Low'] || 0) + addToLow;
    newDist['Medium'] = (newDist['Medium'] || 0) + addToMed;
  }
  
  // Clip values between 0 and 1
  Object.keys(newDist).forEach(state => {
    newDist[state] = Math.max(0, Math.min(1, newDist[state] || 0));
  });
  
  return normalizeDistribution(newDist);
}

// Create perturbed CPTs based on the original CPTs
export function createPerturbedCPTs(
  originalCPTs: CPTs,
  targetNode: string = 'P_doom_2035'
): { central: CPTs, optimistic: CPTs, pessimistic: CPTs } {
  const central = { ...originalCPTs };
  const optimistic = JSON.parse(JSON.stringify(originalCPTs));
  const pessimistic = JSON.parse(JSON.stringify(originalCPTs));
  
  const targetCPT = central[targetNode];
  
  if (targetCPT && typeof targetCPT === 'object') {
    const conditionalDist = targetCPT as ConditionalDistribution;
    const perturbedOptimistic: ConditionalDistribution = {};
    const perturbedPessimistic: ConditionalDistribution = {};
    
    for (const [condition, dist] of Object.entries(conditionalDist)) {
      if (typeof dist === 'object') {
        const normalizedDist = normalizeDistribution(dist);
        perturbedOptimistic[condition] = perturbDistribution(normalizedDist, PERTURBATION_DELTA, false);
        perturbedPessimistic[condition] = perturbDistribution(normalizedDist, PERTURBATION_DELTA, true);
      } else {
        perturbedOptimistic[condition] = dist;
        perturbedPessimistic[condition] = dist;
      }
    }
    
    optimistic[targetNode] = perturbedOptimistic;
    pessimistic[targetNode] = perturbedPessimistic;
  } else {
    console.warn(`Cannot perturb '${targetNode}'. Sensitivity range will be based on central estimate only.`);
  }
  
  return { central, optimistic, pessimistic };
}

// Main inference function for calculating marginal distributions
export function calculateMarginal(
  node: NodeName,
  evidence: Evidence,
  currentProbabilities: Probabilities,
  allCPTs: CPTs
): Distribution {
  // If node is in evidence, return deterministic distribution
  if (node in evidence) {
    if (!(node in STATES)) return {};
    const dist: Distribution = {};
    STATES[node].forEach(state => dist[state] = 0.0);
    dist[evidence[node]] = 1.0;
    return dist;
  }
  
  const parentNodes = PARENTS[node] || [];
  
  // If it's a root node, return its prior
  if (parentNodes.length === 0) {
    if (!(node in allCPTs)) {
      console.error(`Prior CPT missing '${node}'. Using uniform.`);
      const nodeStates = STATES[node] || [];
      return nodeStates.length > 0 
        ? nodeStates.reduce((acc, s) => ({ ...acc, [s]: 1.0 / nodeStates.length }), {})
        : {};
    }
    
    const prior = allCPTs[node];
    return typeof prior === 'object' ? normalizeDistribution(prior as Distribution) : {};
  }
  
  // It's a conditional node
  const nodeStates = STATES[node] || [];
  const nodeDist: Distribution = nodeStates.reduce((acc, state) => ({ ...acc, [state]: 0.0 }), {});
  
  if (nodeStates.length === 0) return nodeDist;
  
  const cpt = allCPTs[node];
  if (!cpt || typeof cpt !== 'object') {
    console.error(`CPT missing/invalid '${node}'.`);
    return nodeDist;
  }
  
  const parentStatesList = parentNodes.map(pNode => STATES[pNode] || []);
  if (parentStatesList.some(states => states.length === 0)) return nodeDist;
  
  // Generate parent state combinations (cartesian product)
  const cartesianProduct = (...arrays: any[][]): any[][] => {
    return arrays.reduce((a, b) => 
      a.flatMap(x => b.map(y => [...x, y])), [[]]);
  };
  
  const parentStateCombinations = cartesianProduct(...parentStatesList);
  
  // Calculate weighted sum over all parent combinations
  for (const parentCombo of parentStateCombinations) {
    let probParents = 1.0;
    let validCombo = true;
    
    // Calculate P(parents)
    for (let i = 0; i < parentNodes.length; i++) {
      const pNode = parentNodes[i];
      const parentState = parentCombo[i];
      const parentProbDist = currentProbabilities[pNode];
      
      if (!parentProbDist || typeof parentProbDist !== 'object') {
        validCombo = false;
        break;
      }
      
      probParents *= parentProbDist[parentState] || 0.0;
    }
    
    if (!validCombo || probParents === 0) continue;
    
    // Get conditional distribution for this parent combination
    const parentKeyTuple = parentCombo.join(KEY_DELIMITER);
    const conditionalCPT = cpt as ConditionalDistribution;
    const condDist = conditionalCPT[parentKeyTuple];
    
    if (!condDist || typeof condDist !== 'object') continue;
    
    const normCondDist = normalizeDistribution(condDist);
    
    // Add weighted contribution to the node distribution
    for (const nodeState of nodeStates) {
      nodeDist[nodeState] = (nodeDist[nodeState] || 0) + (normCondDist[nodeState] || 0) * probParents;
    }
  }
  
  return normalizeDistribution(nodeDist);
}

// Update all probability distributions given evidence
export function updateAllProbabilities(evidence: Evidence, masterCPTs: CPTs): Probabilities {
  const calculationOrder = [
    'Timeline', 'Coordination', 'Interpretability', 'MisusePotential', 'AlignmentSolvability',
    'Competition', 'WarningShot', 'SelfReplication', 'Regulation', 'DeceptionRisk',
    'PowerConcentration', 'ControlLossRisk', 'P_doom_2035'
  ];
  
  const currentProbabilities: Probabilities = {};
  
  if (!masterCPTs || typeof masterCPTs !== 'object') {
    console.error("Invalid master_cpt_dict.");
    return {};
  }
  
  for (const node of calculationOrder) {
    if (!(node in masterCPTs) && !(node in evidence)) {
      console.warn(`Critical Warning: Node '${node}' missing CPTs/evidence. Using uniform.`);
      const nodeStates = STATES[node] || [];
      currentProbabilities[node] = nodeStates.reduce(
        (acc, s) => ({ ...acc, [s]: 1.0 / nodeStates.length }), {}
      );
      continue;
    }
    
    currentProbabilities[node] = calculateMarginal(node, evidence, currentProbabilities, masterCPTs);
  }
  
  return currentProbabilities;
}

// Get the most likely state in a distribution
export function getMostLikelyState(probDist: Distribution | null): NodeState | null {
  if (!probDist || typeof probDist !== 'object') return null;
  
  let maxProb = -1;
  let maxState = null;
  
  for (const [state, prob] of Object.entries(probDist)) {
    if (prob > maxProb) {
      maxProb = prob;
      maxState = state;
    }
  }
  
  return maxState;
}

// Calculate heuristic P(doom) for future years based on 2035 result
export function calculateHeuristicPdoom(
  pdoomStartPercent: number | null,
  mostLikelyTimeline: string,
  targetYear: number
): number | null {
  if (pdoomStartPercent === null) return null;
  
  const timelineMult = TIMELINE_MULTIPLIER[mostLikelyTimeline] || TIMELINE_MULTIPLIER[DEFAULT_TIMELINE_FOR_HEURISTIC];
  let pdoomAdjusted = pdoomStartPercent;
  
  if (targetYear === 2040) {
    pdoomAdjusted += (BASE_INCREASE_2040 * timelineMult);
  } else if (targetYear === 2060) {
    pdoomAdjusted += ((BASE_INCREASE_2040 + BASE_INCREASE_2060) * timelineMult);
  } else {
    return pdoomStartPercent; // Unknown year
  }
  
  return Math.max(0, Math.min(100, pdoomAdjusted));
}

// Export type for results
export type PDoomResults = {
  pdoom2035: {
    lower: number;
    central: number;
    upper: number;
  };
  pdoom2040: {
    lower: number | null;
    central: number | null;
    upper: number | null;
  };
  pdoom2060: {
    lower: number | null;
    central: number | null;
    upper: number | null;
  };
  mostLikelyTimeline: string | null;
};

// Analyze evidence and return all P(doom) estimates
export function analyzePDoom(
  evidence: Evidence,
  cpts: { central: CPTs, optimistic: CPTs, pessimistic: CPTs }
): PDoomResults {
  const { central, optimistic, pessimistic } = cpts;
  
  // Calculate probabilities with different CPTs
  const probsCentral = updateAllProbabilities(evidence, central);
  const probsOptimistic = updateAllProbabilities(evidence, optimistic);
  const probsPessimistic = updateAllProbabilities(evidence, pessimistic);
  
  // Extract P_doom_2035 distributions
  const pdoomDistC = probsCentral['P_doom_2035'] || {};
  const pdoomDistO = probsOptimistic['P_doom_2035'] || {};
  const pdoomDistP = probsPessimistic['P_doom_2035'] || {};
  
  // Calculate P(doom) as P(High) + P(VeryHigh)
  const pdoomHighVhC = (pdoomDistC['High'] || 0) + (pdoomDistC['VeryHigh'] || 0);
  const pdoomHighVhO = (pdoomDistO['High'] || 0) + (pdoomDistO['VeryHigh'] || 0);
  const pdoomHighVhP = (pdoomDistP['High'] || 0) + (pdoomDistP['VeryHigh'] || 0);
  
  // Convert to percentages
  const pdoom2035Lower = Math.min(pdoomHighVhC, pdoomHighVhO, pdoomHighVhP) * 100;
  const pdoom2035Upper = Math.max(pdoomHighVhC, pdoomHighVhO, pdoomHighVhP) * 100;
  const pdoom2035Central = pdoomHighVhC * 100;
  
  // Get most likely timeline for heuristics
  const timelineDist = probsCentral['Timeline'] || {};
  const mostLikelyTimeline = getMostLikelyState(timelineDist) || DEFAULT_TIMELINE_FOR_HEURISTIC;
  
  // Calculate heuristic estimates for 2040 and 2060
  const pdoom2040Lower = calculateHeuristicPdoom(pdoom2035Lower, mostLikelyTimeline, 2040);
  const pdoom2040Central = calculateHeuristicPdoom(pdoom2035Central, mostLikelyTimeline, 2040);
  const pdoom2040Upper = calculateHeuristicPdoom(pdoom2035Upper, mostLikelyTimeline, 2040);
  
  const pdoom2060Lower = calculateHeuristicPdoom(pdoom2035Lower, mostLikelyTimeline, 2060);
  const pdoom2060Central = calculateHeuristicPdoom(pdoom2035Central, mostLikelyTimeline, 2060);
  const pdoom2060Upper = calculateHeuristicPdoom(pdoom2035Upper, mostLikelyTimeline, 2060);
  
  return {
    pdoom2035: {
      lower: pdoom2035Lower,
      central: pdoom2035Central,
      upper: pdoom2035Upper
    },
    pdoom2040: {
      lower: pdoom2040Lower,
      central: pdoom2040Central,
      upper: pdoom2040Upper
    },
    pdoom2060: {
      lower: pdoom2060Lower,
      central: pdoom2060Central,
      upper: pdoom2060Upper
    },
    mostLikelyTimeline
  };
}