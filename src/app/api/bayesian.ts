/**
 * Bayesian Network Implementation for P(doom) Calculator
 * 
 * This is a TypeScript port of the Bayesian network calculations from vanilla_bn2.py
 */

// Type definitions
export type Distribution = Record<string, number>;
export type NestedDistribution = Record<string, Distribution>;
export type CPT = Record<string, Distribution | NestedDistribution>;
export type Evidence = Record<string, string>;

// Default constants for heuristic calculations
export const TIMELINE_MULTIPLIER = {
  "Slow": 0.7,
  "Moderate": 1.0,
  "Fast": 1.5,
  "VeryFast": 2.0
};

export const DEFAULT_TIMELINE = "Moderate";
export const BASE_INCREASE_2050 = 10; // Additional increase for 2050
export const BASE_INCREASE_2100 = 15; // Additional increase for 2100 (on top of 2050)

// CPTs as used in vanilla_bn2.py - will be loaded from JSON
export const DefaultCPTs: CPT = {
  // These will be populated from bn_cpts.json
};

/**
 * Normalizes a probability distribution to sum to 1.0
 */
export function normalizeDistribution(dist: Distribution): Distribution {
  const sum = Object.values(dist).reduce((a, b) => a + b, 0);
  
  if (sum === 0) {
    // Handle zero distribution by making it uniform
    const keys = Object.keys(dist);
    const uniformProb = 1.0 / keys.length;
    return Object.fromEntries(keys.map(k => [k, uniformProb]));
  }
  
  // Normalize by dividing each value by the sum
  return Object.fromEntries(
    Object.entries(dist).map(([k, v]) => [k, v / sum])
  );
}

/**
 * Safely converts a value to float, returning a default if conversion fails
 */
export function safeFloat(value: any, defaultValue: number | null = null): number | null {
  if (value === null || value === undefined) return defaultValue;
  
  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Formats a probability range with +/- delta
 */
export function formatProbRange(prob: number, delta: number = 5): string {
  if (prob === null || prob === undefined) {
    return "N/A";
  }
  const lower = Math.max(0, prob - delta);
  const upper = Math.min(100, prob + delta);
  return `${lower.toFixed(0)}%-${upper.toFixed(0)}%`;
}

/**
 * Perturbs a distribution by delta percentage points (optimistic or pessimistic direction)
 */
export function perturbDistribution(
  dist: Distribution, 
  delta: number, 
  pessimistic: boolean = true
): Distribution {
  const keys = Object.keys(dist);
  if (keys.length <= 1) return {...dist}; // Can't perturb a single-state distribution
  
  // Sort keys based on pessimism (what constitutes worse outcomes)
  // For P(doom) we assume higher states are worse outcomes
  const sortedKeys = [...keys].sort();
  
  if (!pessimistic) {
    // For optimistic, reverse the order
    sortedKeys.reverse();
  }
  
  // Create a new distribution
  const newDist = {...dist};
  
  // Calculate delta to apply
  let remainingDelta = delta;
  let currentKeyIndex = 0;
  
  // Add to higher states (pessimistic) or lower states (optimistic)
  while (remainingDelta > 0 && currentKeyIndex < sortedKeys.length - 1) {
    const targetKey = sortedKeys[currentKeyIndex];
    const sourceKey = sortedKeys[sortedKeys.length - 1 - currentKeyIndex];
    
    // Don't take more than is available in the source state
    const maxTakeFromSource = Math.min(remainingDelta, dist[sourceKey]);
    
    if (maxTakeFromSource > 0) {
      newDist[targetKey] += maxTakeFromSource;
      newDist[sourceKey] -= maxTakeFromSource;
      remainingDelta -= maxTakeFromSource;
    }
    
    currentKeyIndex++;
  }
  
  return newDist;
}

/**
 * Calculates the marginal probability for a node given evidence
 */
export function calculateMarginal(
  node: string,
  evidence: Evidence,
  currentProbabilities: Record<string, Distribution>,
  allCPTs: CPT
): Distribution {
  // Skip if node not in CPTs
  if (!(node in allCPTs) && !(node in currentProbabilities)) {
    console.error(`Node ${node} not found in CPTs or current probabilities`);
    return {};
  }
  
  // If node already has a value in evidence, return a deterministic distribution
  if (node in evidence) {
    const value = evidence[node];
    // Get possible states from CPT or current probabilities
    let possibleStates: string[] = [];
    
    if (node in allCPTs) {
      // For non-conditional nodes
      const cptEntry = allCPTs[node];
      if (typeof cptEntry === 'object' && !Array.isArray(cptEntry)) {
        possibleStates = Object.keys(cptEntry);
      } else {
        // For conditional nodes, look at the values
        const cptEntries = Object.entries(allCPTs).filter(([key]) => 
          key.startsWith(`${node}|`) || key === node
        );
        
        if (cptEntries.length > 0) {
          // Get states from the first CPT entry
          const firstCPT = cptEntries[0][1];
          possibleStates = Object.keys(firstCPT as Distribution);
        }
      }
    } else if (node in currentProbabilities) {
      possibleStates = Object.keys(currentProbabilities[node]);
    }
    
    // Create deterministic distribution
    const dist: Distribution = {};
    for (const state of possibleStates) {
      dist[state] = state === value ? 1.0 : 0.0;
    }
    return dist;
  }
  
  // If node is root (no parents), get distribution directly from CPT
  if (node in allCPTs && !Object.keys(allCPTs).some(k => k.startsWith(`${node}|`))) {
    const cptEntry = allCPTs[node];
    if (typeof cptEntry === 'object' && !Array.isArray(cptEntry) && 
        Object.values(cptEntry).every(v => typeof v === 'number')) {
      return {...(cptEntry as Distribution)};
    }
  }
  
  // For nodes with parents, compute the distribution based on parent values
  let result: Distribution = {};
  
  // Find all CPT entries for this node
  const cptEntries = Object.entries(allCPTs).filter(([key]) => 
    key.startsWith(`${node}|`) || key === node
  );
  
  for (const [cptKey, cptDist] of cptEntries) {
    // Skip if this is not a conditional CPT
    if (!cptKey.includes('|')) continue;
    
    // Extract parent condition
    const parentsCondition = cptKey.split('|')[1];
    const parentAssignments = parentsCondition.split(',');
    
    // Check if evidence matches the parent assignments
    let conditionMatched = true;
    
    for (const assignment of parentAssignments) {
      const [parentNode, parentValue] = assignment.split('=');
      
      if (!(parentNode in evidence) || evidence[parentNode] !== parentValue) {
        conditionMatched = false;
        break;
      }
    }
    
    if (conditionMatched) {
      result = {...(cptDist as Distribution)};
      break;
    }
  }
  
  // If no matching CPT entry, use a uniform distribution
  if (Object.keys(result).length === 0) {
    // Find states from any matching CPT
    if (cptEntries.length > 0) {
      const states = Object.keys(cptEntries[0][1] as Distribution);
      const uniformProb = 1.0 / states.length;
      result = Object.fromEntries(states.map(s => [s, uniformProb]));
    }
  }
  
  return result;
}

/**
 * Updates all node probabilities based on evidence
 */
export function updateAllProbabilities(
  evidence: Evidence,
  cpts: CPT
): Record<string, Distribution> {
  // Initialize probabilities for all nodes
  const allNodes = new Set<string>();
  
  // Extract all node names from CPTs
  for (const key of Object.keys(cpts)) {
    if (key.includes('|')) {
      allNodes.add(key.split('|')[0]);
    } else {
      allNodes.add(key);
    }
  }
  
  // Initialize probability distributions
  const probabilities: Record<string, Distribution> = {};
  
  // Update all nodes
  for (const node of allNodes) {
    probabilities[node] = calculateMarginal(node, evidence, probabilities, cpts);
  }
  
  return probabilities;
}

/**
 * Calculates the most likely state from a probability distribution
 */
export function getMostLikelyState(dist: Distribution): string | null {
  if (!dist || Object.keys(dist).length === 0) return null;
  
  let maxProb = -1;
  let maxState = null;
  
  for (const [state, prob] of Object.entries(dist)) {
    if (prob > maxProb) {
      maxProb = prob;
      maxState = state;
    }
  }
  
  return maxState;
}

/**
 * Calculates heuristic P(doom) values for future years based on 2035 estimate
 */
export function calculateHeuristicPdoom(
  pdoom2035Percent: number,
  timelineState: string = DEFAULT_TIMELINE,
  targetYear: number
): number {
  if (pdoom2035Percent === null || pdoom2035Percent === undefined) return 0;
  
  const timelineMultiplier = TIMELINE_MULTIPLIER[timelineState as keyof typeof TIMELINE_MULTIPLIER] || 
                            TIMELINE_MULTIPLIER[DEFAULT_TIMELINE];
  
  let pdoomAdjusted = pdoom2035Percent;
  
  if (targetYear === 2050) {
    pdoomAdjusted += (BASE_INCREASE_2050 * timelineMultiplier);
  } else if (targetYear === 2100) {
    pdoomAdjusted += ((BASE_INCREASE_2050 + BASE_INCREASE_2100) * timelineMultiplier);
  }
  
  // Clamp to 0-100 range
  return Math.max(0, Math.min(100, pdoomAdjusted));
}

/**
 * Evaluate P(doom) for all years using Bayesian Network
 */
export function evaluatePdoom(
  evidence: Evidence,
  cpts: CPT,
  delta: number = 5
): {
  pdoom2035: number;
  pdoom2035Range: [number, number];
  pdoom2050: number;
  pdoom2050Range: [number, number];
  pdoom2100: number;
  pdoom2100Range: [number, number];
} {
  // Create optimistic and pessimistic CPTs
  const cptsOptimistic: CPT = JSON.parse(JSON.stringify(cpts));
  const cptsPessimistic: CPT = JSON.parse(JSON.stringify(cpts));
  
  // Get all P_doom_2035 related keys
  const pdoomKeys = Object.keys(cpts).filter(key => 
    key === 'P_doom_2035' || key.startsWith('P_doom_2035|'));
  
  // Perturb the P_doom distributions
  for (const key of pdoomKeys) {
    const dist = cpts[key] as Distribution;
    
    // Create perturbed versions
    const optimisticDist = perturbDistribution(dist, delta / 100, false);
    const pessimisticDist = perturbDistribution(dist, delta / 100, true);
    
    // Assign to the CPTs
    cptsOptimistic[key] = optimisticDist;
    cptsPessimistic[key] = pessimisticDist;
  }
  
  // Calculate probabilities for each CPT set
  const probabilitiesCentral = updateAllProbabilities(evidence, cpts);
  const probabilitiesOptimistic = updateAllProbabilities(evidence, cptsOptimistic);
  const probabilitiesPessimistic = updateAllProbabilities(evidence, cptsPessimistic);
  
  // Extract P(doom) values
  const pDoomDist2035Central = probabilitiesCentral['P_doom_2035'] || {};
  const pDoomDist2035Optimistic = probabilitiesOptimistic['P_doom_2035'] || {};
  const pDoomDist2035Pessimistic = probabilitiesPessimistic['P_doom_2035'] || {};
  
  // Calculate P(doom) as probability of High or VeryHigh states
  const central2035 = (pDoomDist2035Central['High'] || 0) + (pDoomDist2035Central['VeryHigh'] || 0);
  const optimistic2035 = (pDoomDist2035Optimistic['High'] || 0) + (pDoomDist2035Optimistic['VeryHigh'] || 0);
  const pessimistic2035 = (pDoomDist2035Pessimistic['High'] || 0) + (pDoomDist2035Pessimistic['VeryHigh'] || 0);
  
  // Get values as percentages
  const pdoom2035 = central2035 * 100;
  const pdoom2035Lower = optimistic2035 * 100;
  const pdoom2035Upper = pessimistic2035 * 100;
  
  // Get timeline state for heuristic calculations
  const timelineDist = probabilitiesCentral['Timeline'] || {};
  const timelineState = getMostLikelyState(timelineDist) || DEFAULT_TIMELINE;
  
  // Calculate values for 2050 and 2100 based on heuristics
  const pdoom2050 = calculateHeuristicPdoom(pdoom2035, timelineState, 2050);
  const pdoom2050Lower = calculateHeuristicPdoom(pdoom2035Lower, timelineState, 2050);
  const pdoom2050Upper = calculateHeuristicPdoom(pdoom2035Upper, timelineState, 2050);
  
  const pdoom2100 = calculateHeuristicPdoom(pdoom2035, timelineState, 2100);
  const pdoom2100Lower = calculateHeuristicPdoom(pdoom2035Lower, timelineState, 2100);
  const pdoom2100Upper = calculateHeuristicPdoom(pdoom2035Upper, timelineState, 2100);
  
  return {
    pdoom2035,
    pdoom2035Range: [pdoom2035Lower, pdoom2035Upper],
    pdoom2050,
    pdoom2050Range: [pdoom2050Lower, pdoom2050Upper],
    pdoom2100,
    pdoom2100Range: [pdoom2100Lower, pdoom2100Upper]
  };
}

/**
 * Loads the CPTs from a JSON string
 */
export function loadCPTsFromJSON(jsonString: string): CPT {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("Error parsing CPTs JSON:", error);
    return {};
  }
}

/**
 * Maps quiz answers to Bayesian network evidence
 */
export function mapAnswersToBNEvidence(
  answers: Record<string, any>
): Evidence {
  const evidence: Evidence = {};
  
  // Map question answers to BN nodes based on patterns
  // This is a simplified mapping - real implementation would need more detail
  for (const [questionId, answerDetail] of Object.entries(answers)) {
    const questionText = answerDetail.question || "";
    const answerText = answerDetail.answer || "";
    
    // Timeline questions
    if (questionText.includes("autonomous") && questionText.includes("replicate")) {
      if (answerText.includes("Before 2030")) evidence["Timeline"] = "Early";
      else if (answerText.includes("2030-2040")) evidence["Timeline"] = "Mid";
      else evidence["Timeline"] = "Late";
    }
    
    // Coordination questions
    else if (questionText.includes("international treaties") || questionText.includes("regulate")) {
      if (answerText.includes("Before 2030")) evidence["Coordination"] = "Good";
      else if (answerText.includes("2030-2040")) evidence["Coordination"] = "Med";
      else evidence["Coordination"] = "Poor";
    }
    
    // Interpretability questions
    else if (questionText.includes("interpretability") || questionText.includes("explain")) {
      if (answerText.includes("Before 2030")) evidence["Interpretability"] = "Good";
      else if (answerText.includes("2030-2040")) evidence["Interpretability"] = "Med";
      else evidence["Interpretability"] = "Poor";
    }
    
    // Alignment questions
    else if (questionText.includes("alignment problem") || questionText.includes("alignment")) {
      if (answerText.includes("Very likely")) evidence["AlignmentSolvability"] = "Easy";
      else if (answerText.includes("Somewhat likely")) evidence["AlignmentSolvability"] = "Med";
      else evidence["AlignmentSolvability"] = "Hard";
    }
    
    // Misuse questions
    else if (questionText.includes("bioweapons") || questionText.includes("hack")) {
      if (answerText.includes("Never")) evidence["MisusePotential"] = "Low";
      else if (answerText.includes("After 2040")) evidence["MisusePotential"] = "Med";
      else evidence["MisusePotential"] = "High";
    }
    
    // Competition questions
    else if (questionText.includes("competitive race") || questionText.includes("competition")) {
      if (answerText.includes("Collaborative")) evidence["Competition"] = "Low";
      else if (answerText.includes("Moderate")) evidence["Competition"] = "Med";
      else evidence["Competition"] = "High";
    }
    
    // Warning shot questions
    else if (questionText.includes("warning shot") || questionText.includes("catastrophe")) {
      if (answerText.includes("Very unlikely")) evidence["WarningShot"] = "Low";
      else if (answerText.includes("Somewhat unlikely")) evidence["WarningShot"] = "Med";
      else evidence["WarningShot"] = "High";
    }
    
    // Deception questions
    else if (questionText.includes("deceptive") || questionText.includes("deception")) {
      if (answerText.includes("Very unlikely")) evidence["DeceptionRisk"] = "Low";
      else if (answerText.includes("Somewhat unlikely")) evidence["DeceptionRisk"] = "Med";
      else evidence["DeceptionRisk"] = "High";
    }
  }
  
  return evidence;
} 