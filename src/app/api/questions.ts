// Types for our question model
export interface Answer {
  text: string;
  pdoom_increase: number;
  weight: number;
}

export interface Question {
  id: string;
  question: string;
  category: string;
  reasoning: string;
  answers: Answer[];
  depends_on: string[];
  dependency_rule: string;
}

// Simplified version of the questions from reorganized_pdoom_questions.csv
export const questions: Question[] = [
  {
    id: "Q1",
    question: "When will AI systems be able to autonomously replicate the full research and development cycle of creating a more capable AI system?",
    category: "Technical Milestone",
    reasoning: "Self-improving AI systems could rapidly surpass human control capabilities",
    answers: [
      { text: "Before 2030", pdoom_increase: 5, weight: 1.2 },
      { text: "2030-2040", pdoom_increase: 3, weight: 1.0 },
      { text: "After 2040", pdoom_increase: 1, weight: 0.8 },
      { text: "Never or >100 years", pdoom_increase: 0, weight: 0.5 }
    ],
    depends_on: [],
    dependency_rule: ""
  },
  {
    id: "Q2",
    question: "When will AI systems be capable of developing novel, effective bioweapons without human oversight?",
    category: "Technical Milestone",
    reasoning: "Misuse risk increases dramatically with autonomous bioweapon development",
    answers: [
      { text: "Before 2030", pdoom_increase: 5, weight: 1.0 },
      { text: "2030-2040", pdoom_increase: 3, weight: 1.0 },
      { text: "After 2040", pdoom_increase: 1, weight: 1.0 },
      { text: "Never or >100 years", pdoom_increase: 0, weight: 1.0 }
    ],
    depends_on: ["Q1"],
    dependency_rule: "If Q1.Answer='Before 2030' then multiply PDoom by 1.5"
  },
  {
    id: "Q3",
    question: "When will AI systems be able to autonomously hack critical infrastructure (power grids, financial systems) without human guidance?",
    category: "Technical Milestone",
    reasoning: "Autonomous offensive capabilities could lead to catastrophic infrastructure failures",
    answers: [
      { text: "Before 2030", pdoom_increase: 5, weight: 1.0 },
      { text: "2030-2040", pdoom_increase: 3, weight: 1.0 },
      { text: "After 2040", pdoom_increase: 1, weight: 1.0 },
      { text: "Never or >100 years", pdoom_increase: 0, weight: 1.0 }
    ],
    depends_on: ["Q1"],
    dependency_rule: "If Q1.Answer='Before 2030' then multiply PDoom by 1.3"
  },
  {
    id: "Q4",
    question: "How likely is it that we will develop robust technical solutions to the AI alignment problem before superintelligent AI is developed?",
    category: "Safety & Alignment",
    reasoning: "The alignment problem is central to preventing catastrophic outcomes",
    answers: [
      { text: "Very likely (>80%)", pdoom_increase: 0, weight: 0.7 },
      { text: "Somewhat likely (40-80%)", pdoom_increase: 2, weight: 1.0 },
      { text: "Somewhat unlikely (20-40%)", pdoom_increase: 4, weight: 1.2 },
      { text: "Very unlikely (<20%)", pdoom_increase: 6, weight: 1.5 }
    ],
    depends_on: ["Q1", "Q2"],
    dependency_rule: "If Q1.Answer='Before 2030' AND Q2.Answer='Before 2030' then multiply PDoom by 1.5"
  },
  {
    id: "Q5",
    question: "How much of AI research funding will be dedicated to safety research within the next decade?",
    category: "Safety & Alignment",
    reasoning: "Adequate safety research is necessary to mitigate catastrophic risks",
    answers: [
      { text: "More than 30%", pdoom_increase: 0, weight: 0.8 },
      { text: "15-30%", pdoom_increase: 2, weight: 1.0 },
      { text: "5-15%", pdoom_increase: 3, weight: 1.2 },
      { text: "Less than 5%", pdoom_increase: 5, weight: 1.5 }
    ],
    depends_on: ["Q4"],
    dependency_rule: "If Q4.Answer='Very unlikely (<20%)' then multiply PDoom by 1.5"
  },
  {
    id: "Q6",
    question: "When will major AI labs implement robust, verifiable interpretability techniques that can explain the reasoning of their most advanced models?",
    category: "Safety & Alignment",
    reasoning: "Interpretability is crucial for detecting and preventing harmful behaviors",
    answers: [
      { text: "Before 2030", pdoom_increase: 0, weight: 0.8 },
      { text: "2030-2040", pdoom_increase: 2, weight: 1.0 },
      { text: "After 2040", pdoom_increase: 4, weight: 1.2 },
      { text: "Never or >100 years", pdoom_increase: 6, weight: 1.5 }
    ],
    depends_on: ["Q1"],
    dependency_rule: "If Q1.Answer='Before 2030' AND this.Answer='After 2040' then multiply PDoom by 1.7"
  },
  {
    id: "Q7",
    question: "When will international treaties with effective verification mechanisms be established to regulate advanced AI development?",
    category: "Governance & Regulation",
    reasoning: "Effective international governance is necessary to prevent competitive races to the bottom",
    answers: [
      { text: "Before 2030", pdoom_increase: 0, weight: 0.8 },
      { text: "2030-2040", pdoom_increase: 2, weight: 1.0 },
      { text: "After 2040", pdoom_increase: 4, weight: 1.2 },
      { text: "Never or >100 years", pdoom_increase: 6, weight: 1.5 }
    ],
    depends_on: ["Q1", "Q3"],
    dependency_rule: "If Q1.Answer='Before 2030' AND this.Answer='After 2040' then multiply PDoom by 1.5"
  },
  {
    id: "Q8",
    question: "How likely is it that we will have a 'warning shot' catastrophe (major AI-caused disaster with <1 million deaths) before superintelligent AI?",
    category: "Risk Scenarios",
    reasoning: "Warning shots could either accelerate safety measures or be ignored",
    answers: [
      { text: "Very likely (>80%)", pdoom_increase: 2, weight: 1.0 },
      { text: "Somewhat likely (40-80%)", pdoom_increase: 3, weight: 1.0 },
      { text: "Somewhat unlikely (20-40%)", pdoom_increase: 4, weight: 1.0 },
      { text: "Very unlikely (<20%)", pdoom_increase: 5, weight: 1.0 }
    ],
    depends_on: ["Q7"],
    dependency_rule: "If Q7.Answer='Never or >100 years' AND this.Answer='Very unlikely (<20%)' then multiply PDoom by 1.3"
  },
  {
    id: "Q9",
    question: "How likely is it that AI systems will develop deceptive behaviors as they become more capable?",
    category: "Risk Scenarios",
    reasoning: "Deception is a convergent instrumental goal for many AI objectives",
    answers: [
      { text: "Very likely (>80%)", pdoom_increase: 5, weight: 1.2 },
      { text: "Somewhat likely (40-80%)", pdoom_increase: 3, weight: 1.0 },
      { text: "Somewhat unlikely (20-40%)", pdoom_increase: 1, weight: 0.8 },
      { text: "Very unlikely (<20%)", pdoom_increase: 0, weight: 0.5 }
    ],
    depends_on: ["Q4", "Q6"],
    dependency_rule: "If Q4.Answer='Very unlikely (<20%)' AND Q6.Answer='Never or >100 years' then multiply PDoom by 1.7"
  },
  {
    id: "Q10",
    question: "How intense will the competitive race for AI capabilities be in the next decade?",
    category: "Strategic Considerations",
    reasoning: "Competitive pressures can lead to cutting corners on safety",
    answers: [
      { text: "Extreme competition with few safety considerations", pdoom_increase: 6, weight: 1.5 },
      { text: "Strong competition with some safety considerations", pdoom_increase: 4, weight: 1.2 },
      { text: "Moderate competition with significant safety considerations", pdoom_increase: 2, weight: 1.0 },
      { text: "Collaborative development with strong safety focus", pdoom_increase: 0, weight: 0.8 }
    ],
    depends_on: ["Q7", "Q8"],
    dependency_rule: "If Q7.Answer='Never or >100 years' AND Q8.Answer='Very unlikely (<20%)' then multiply PDoom by 1.3"
  }
];

// Export experts data from experts_pdoom.csv
export interface Expert {
  name: string;
  estimate: number;
  categories: string;
  lowerBound?: number;
  upperBound?: number;
  pdoom_2035_percent?: number;
  pdoom_2050_percent?: number;
  pdoom_2100_percent?: number;
}

export const experts: Expert[] = [
  { name: "Eliezer Yudkowsky", estimate: 99, categories: "Alignment Difficulty, Compute Overhang, Racing Dynamics", lowerBound: 99, upperBound: 100 },
  { name: "Shane Legg", estimate: 50, categories: "Self-improvement, Control Issues", lowerBound: 40, upperBound: 60 },
  { name: "Geoffrey Hinton", estimate: 50, categories: "Capability Growth, Control Issues", lowerBound: 50, upperBound: 70 },
  { name: "Stuart Russell", estimate: 40, categories: "Misaligned Objectives, Control Issues", lowerBound: 40, upperBound: 60 },
  { name: "Sam Altman", estimate: 33, categories: "Misuse, Control Issues", lowerBound: 25, upperBound: 40 },
  { name: "Nick Bostrom", estimate: 30, categories: "Control Problem, Misaligned Objectives", lowerBound: 20, upperBound: 40 },
  { name: "Jaan Tallinn", estimate: 30, categories: "Self-improvement, Control Issues", lowerBound: 20, upperBound: 40 },
  { name: "Paul Christiano", estimate: 20, categories: "Alignment Difficulty, Governance Failure", lowerBound: 15, upperBound: 25 },
  { name: "Ilya Sutskever", estimate: 15, categories: "Alignment Challenges, Capability Growth", lowerBound: 10, upperBound: 20 },
  { name: "Dario Amodei", estimate: 15, categories: "Alignment Challenges, Safety Research", lowerBound: 10, upperBound: 20 },
  { name: "Elon Musk", estimate: 15, categories: "Racing Dynamics, Governance Failure", lowerBound: 10, upperBound: 20 },
  { name: "Anders Sandberg", estimate: 10, categories: "Existential Risk, Future of Humanity", lowerBound: 5, upperBound: 15 },
  { name: "Toby Ord", estimate: 10, categories: "Existential Risk, Long-term Future", lowerBound: 5, upperBound: 15 },
  { name: "Ben Goertzel", estimate: 10, categories: "Design Solutions, Safety Engineering", lowerBound: 5, upperBound: 15 },
  { name: "Max Tegmark", estimate: 10, categories: "Governance, Long-term Risk", lowerBound: 5, upperBound: 15 },
  { name: "Yoshua Bengio", estimate: 10, categories: "Safety Research, Governance", lowerBound: 5, upperBound: 15 },
  { name: "Demis Hassabis", estimate: 10, categories: "Safety Solutions, Governance", lowerBound: 5, upperBound: 15 },
  { name: "Grady Booch", estimate: 5, categories: "Engineering Solutions, Governance", lowerBound: 1, upperBound: 5 },
  { name: "Melanie Mitchell", estimate: 5, categories: "Technical Limitations, Skepticism", lowerBound: 0, upperBound: 5 },
  { name: "Francesca Rossi", estimate: 5, categories: "Governance, Ethics", lowerBound: 1, upperBound: 5 },
  { name: "Gary Marcus", estimate: 5, categories: "Technical Limitations, Safety Solutions", lowerBound: 2, upperBound: 10 },
  { name: "Rodney Brooks", estimate: 1, categories: "Technical Limitations, Timeline Skepticism", lowerBound: 0, upperBound: 1 },
  { name: "Timnit Gebru", estimate: 1, categories: "Present Harms, Technical Limitations", lowerBound: 0, upperBound: 1 },
  { name: "Yann LeCun", estimate: 1, categories: "Technical Limitations, Skepticism", lowerBound: 0, upperBound: 1 },
  { name: "Andrew Ng", estimate: 1, categories: "Technical Limitations, Present Focus", lowerBound: 0, upperBound: 1 }
];

// Function to evaluate dependency rule for conditional P(doom) calculation
export function evaluateDependencyRule(rule: string, answers: Record<string, string>): number {
  if (!rule) {
    return 1.0; // No rule, no effect
  }
  
  // Extract the condition and multiplier parts
  const conditionPart = rule.split('then')[0].trim();
  const multiplierPart = rule.split('then')[1].trim();
  
  // Extract multiplier value
  const multiplier = parseFloat(multiplierPart.split('by')[1].trim());
  
  // Parse conditions
  let allConditionsMet = true;
  
  if (conditionPart.includes('AND')) {
    // Multiple conditions
    const conditions = conditionPart.split('AND').map(c => c.trim());
    
    for (const condition of conditions) {
      if (condition.includes('this.')) {
        // Handle self-reference (these are evaluated separately)
        continue;
      }
      
      const qId = condition.split('.')[0].trim();
      const expectedAnswer = condition.split('=')[1].trim().replace(/'/g, '');
      
      if (!answers[qId] || answers[qId] !== expectedAnswer) {
        allConditionsMet = false;
        break;
      }
    }
  } else {
    // Single condition
    if (!conditionPart.includes('this.')) {
      const qId = conditionPart.split('.')[0].trim();
      const expectedAnswer = conditionPart.split('=')[1].trim().replace(/'/g, '');
      
      if (!answers[qId] || answers[qId] !== expectedAnswer) {
        allConditionsMet = false;
      }
    }
  }
  
  return allConditionsMet ? multiplier : 1.0;
}

// Function to find similar experts
export function findSimilarExperts(userPdoom: number, year: string = '2035'): Expert[] {
  if (userPdoom === null || userPdoom === undefined) {
    return [];
  }
  
  // Get the relevant estimate based on year
  const getRelevantEstimate = (expert: Expert): number => {
    const yearField = `pdoom_${year}_percent` as keyof Expert;
    if (expert[yearField] !== undefined) {
      return expert[yearField] as number;
    }
    return expert.estimate; // Fallback to main estimate
  };
  
  // Sort experts by how close their estimate is to user's
  const sortedExperts = [...experts].sort((a, b) => {
    const aDiff = Math.abs(getRelevantEstimate(a) - userPdoom);
    const bDiff = Math.abs(getRelevantEstimate(b) - userPdoom);
    return aDiff - bDiff;
  });
  
  // Return top 3 closest experts
  return sortedExperts.slice(0, 3);
}

// Function to format probability range
export function formatProbRange(prob: number, delta: number = 5): string {
  if (prob === null || prob === undefined) {
    return "N/A";
  }
  const lower = Math.max(0, prob - delta);
  const upper = Math.min(100, prob + delta);
  return `${lower.toFixed(0)}%-${upper.toFixed(0)}%`;
}

// Calculate final P(doom) with dependency rules
export function calculatePdoom(answers: Record<string, AnswerDetail>): { finalPdoom: number, answerDetails: Record<string, AnswerDetail> } {
  // Create a deep copy to avoid mutating the original
  const answersCopy: Record<string, AnswerDetail> = JSON.parse(JSON.stringify(answers));
  
  // First pass - apply dependency rules
  Object.values(answersCopy).forEach((answer) => {
    // Apply dependency rules if any
    // ... logic for dependencies would go here
  });
  
  // Calculate final P(doom)
  const finalPdoom = Object.values(answersCopy).reduce((total, answer) => {
    return total + (answer.finalIncrease || answer.weightedIncrease);
  }, 0);
  
  return {
    finalPdoom,
    answerDetails: answersCopy
  };
}

// Define the interface for answer details
export interface AnswerDetail {
  questionId: string;
  question: string;
  answer: string;
  baseIncrease: number;
  weight: number;
  weightedIncrease: number;
  finalIncrease?: number;
  category: string;
  conditionalMultiplier?: number;
} 