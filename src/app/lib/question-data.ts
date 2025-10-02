import { NodeState } from './bayes-network';

// Types for question options
export type QuestionOption = {
  label: string;
  value: NodeState | number;
};

export type Question = {
  id: string;
  level: number;
  text: string;
  node: string;
  isPriorBelief?: boolean;
  isEpistemicUncertainty?: boolean;
  options: QuestionOption[];
};

// Define the questions based on the Python implementation
export const questions: Question[] = [
  {
    id: 'Q0_Epistemic',
    level: 0,
    text: "How confident are you that our current understanding of AI risk factors is fundamentally correct? (This reflects model uncertainty - the possibility we'll discover something that changes the picture entirely)",
    node: 'ModelConfidence',
    isEpistemicUncertainty: true,
    options: [
      { label: 'Very confident (80-100%) - Framework is solid', value: 0.90 },
      { label: 'Moderately confident (60-80%) - Mostly correct', value: 0.70 },
      { label: 'Uncertain (40-60%) - Equal chance of major shifts', value: 0.50 },
      { label: 'Low confidence (20-40%) - Likely missing key factors', value: 0.30 },
      { label: 'Very low confidence (<20%) - Framework probably wrong', value: 0.10 }
    ]
  },
  {
    id: 'Q14',
    level: 1,
    text: "Broadly, when do you expect AI systems to significantly surpass human cognitive abilities?",
    node: 'Timeline',
    options: [
      { label: 'Before 2035', value: 'Early' },
      { label: '2035-2050', value: 'Mid' },
      { label: '2050-2070', value: 'Late' },
      { label: 'After 2070 / Never', value: 'Late' }
    ]
  },
  {
    id: 'Q15',
    level: 1,
    text: "What is your general intuition about the potential for AI to pose an existential risk (by 2035)?",
    node: 'P_doom_2035',
    isPriorBelief: true,
    options: [
      { label: 'Very Low (<5%)', value: 0.03 },
      { label: 'Low (5-15%)', value: 0.10 },
      { label: 'Moderate (15-35%)', value: 0.25 },
      { label: 'High (35-60%)', value: 0.50 },
      { label: 'Very High (>60%)', value: 0.80 }
    ]
  },
  {
    id: 'Q16',
    level: 1,
    text: "How optimistic are you about humanity's general ability to cooperate effectively on AI safety?",
    node: 'Coordination',
    options: [
      { label: 'Very Optimistic', value: 'Good' },
      { label: 'Somewhat Optimistic', value: 'Good' },
      { label: 'Neutral / Mixed', value: 'Med' },
      { label: 'Somewhat Pessimistic', value: 'Poor' },
      { label: 'Very Pessimistic', value: 'Poor' }
    ]
  },
  {
    id: 'Q4',
    level: 1,
    text: "How likely are robust technical solutions to AI alignment BEFORE superintelligence?",
    node: 'AlignmentSolvability',
    options: [
      { label: 'Very likely (>80%)', value: 'Easy' },
      { label: 'Somewhat likely (40-80%)', value: 'Med' },
      { label: 'Somewhat unlikely (20-40%)', value: 'Hard' },
      { label: 'Very unlikely (<20%)', value: 'Hard' }
    ]
  },
  {
    id: 'Q6',
    level: 2,
    text: "When will labs implement robust, verifiable INTERPRETABILITY techniques?",
    node: 'Interpretability',
    options: [
      { label: 'Before 2035', value: 'Good' },
      { label: '2035-2050', value: 'Med' },
      { label: 'After 2050 / Never', value: 'Poor' }
    ]
  },
  {
    id: 'Q1_Control',
    level: 2,
    text: "When will AI autonomously replicate its own R&D cycle? (Proxy for Control Loss)",
    node: 'ControlLossRisk',
    options: [
      { label: 'Before 2030', value: 'High' },
      { label: '2030-2040', value: 'High' },
      { label: 'After 2040', value: 'Med' },
      { label: 'Never/>100 years', value: 'Low' }
    ]
  },
  {
    id: 'Q2_Misuse',
    level: 2,
    text: "How likely are novel dangerous capabilities (e.g., autonomous bioweapons) from AI before 2035?",
    node: 'MisusePotential',
    options: [
      { label: 'Very Unlikely', value: 'Low' },
      { label: 'Possible', value: 'Med' },
      { label: 'Likely', value: 'High' },
      { label: 'Almost Certain', value: 'High' }
    ]
  },
  {
    id: 'Q10',
    level: 2,
    text: "How likely will capable AI systems develop DECEPTIVE behaviors by 2035?",
    node: 'DeceptionRisk',
    options: [
      { label: 'Very likely (>80%)', value: 'High' },
      { label: 'Somewhat likely (40-80%)', value: 'High' },
      { label: 'Somewhat unlikely (20-40%)', value: 'Med' },
      { label: 'Very unlikely (<20%)', value: 'Low' }
    ]
  },
  {
    id: 'Q13',
    level: 2,
    text: "How likely are AI systems deployed with capability to SELF-REPLICATE online by 2035?",
    node: 'SelfReplication',
    options: [
      { label: 'Very likely (>80%)', value: 'High' },
      { label: 'Somewhat likely (40-80%)', value: 'High' },
      { label: 'Somewhat unlikely (20-40%)', value: 'Med' },
      { label: 'Very unlikely (<20%)', value: 'Low' }
    ]
  },
  {
    id: 'Q11',
    level: 3,
    text: "How intense will the COMPETITIVE race for AI capabilities be leading up to 2035?",
    node: 'Competition',
    options: [
      { label: 'Extreme competition, few safety considerations', value: 'High' },
      { label: 'Strong competition, some safety considerations', value: 'High' },
      { label: 'Moderate competition, significant safety', value: 'Med' },
      { label: 'Collaborative development, strong safety focus', value: 'Low' }
    ]
  },
  {
    id: 'Q8_Reg',
    level: 3,
    text: "How likely are binding COMPUTE governance frameworks by 2035?",
    node: 'Regulation',
    options: [
      { label: 'Very likely (>80%)', value: 'High' },
      { label: 'Somewhat likely (40-80%)', value: 'High' },
      { label: 'Somewhat unlikely (20-40%)', value: 'Med' },
      { label: 'Very unlikely (<20%)', value: 'Low' }
    ]
  },
  {
    id: 'Q12',
    level: 3,
    text: "How likely is significant POWER CONCENTRATION in AI development by 2035?",
    node: 'PowerConcentration',
    options: [
      { label: 'Very likely (>80%)', value: 'High' },
      { label: 'Somewhat likely (40-80%)', value: 'High' },
      { label: 'Somewhat unlikely (20-40%)', value: 'Med' },
      { label: 'Very unlikely (<20%)', value: 'Low' }
    ]
  },
  {
    id: 'Q9',
    level: 3,
    text: "How likely is a major 'WARNING SHOT' catastrophe before AI surpasses humans (relevant before 2035)?",
    node: 'WarningShot',
    options: [
      { label: 'Very likely (>80%)', value: 'High' },
      { label: 'Somewhat likely (40-80%)', value: 'High' },
      { label: 'Somewhat unlikely (20-40%)', value: 'Med' },
      { label: 'Very unlikely (<20%)', value: 'Low' }
    ]
  },
  {
    id: 'Q17_Datacenter',
    level: 2,
    text: "How concerned are you about the impact of AI datacenter growth on electricity prices and grid stability?",
    node: 'DatacenterImpact',
    options: [
      { label: 'Very concerned - major crisis likely', value: 'High' },
      { label: 'Moderately concerned', value: 'Med' },
      { label: 'Slightly concerned', value: 'Low' },
      { label: 'Not concerned', value: 'Low' }
    ]
  },
  {
    id: 'Q18_Energy',
    level: 2,
    text: "Do you think energy demands from AI will significantly affect global infrastructure by 2035?",
    node: 'EnergyDemand',
    options: [
      { label: 'Yes, catastrophic impact', value: 'High' },
      { label: 'Yes, significant strain', value: 'Med' },
      { label: 'Some impact but manageable', value: 'Low' },
      { label: 'Minimal to no impact', value: 'Low' }
    ]
  },
  {
    id: 'Q19_RedTeam',
    level: 3,
    text: "Have you tried red teaming AI system prompts (jailbreaking, prompt injection)?",
    node: 'RedTeamExperience',
    options: [
      { label: 'Yes, extensively', value: 'High' },
      { label: 'Yes, a few times', value: 'Med' },
      { label: 'No, but I understand the concept', value: 'Low' },
      { label: 'No, unfamiliar with this', value: 'Low' }
    ]
  },
  {
    id: 'Q20_FineTune',
    level: 3,
    text: "Have you fine-tuned or trained your own language models?",
    node: 'FineTuneExperience',
    options: [
      { label: 'Yes, multiple times', value: 'High' },
      { label: 'Yes, once or twice', value: 'Med' },
      { label: 'No, but I understand the process', value: 'Low' },
      { label: 'No, unfamiliar', value: 'Low' }
    ]
  },
  {
    id: 'Q21_Uncensored',
    level: 3,
    text: "Have you used uncensored/unaligned LLMs?",
    node: 'UncensoredExperience',
    options: [
      { label: 'Yes, regularly', value: 'High' },
      { label: 'Yes, occasionally', value: 'Med' },
      { label: 'No, but aware they exist', value: 'Low' },
      { label: 'No, unfamiliar', value: 'Low' }
    ]
  },
  {
    id: 'Q22_DeepLearning',
    level: 3,
    text: "What is your experience with deep learning architectures (CNNs, RNNs, Transformers)?",
    node: 'DeepLearningExperience',
    options: [
      { label: 'Extensive - built and trained models', value: 'High' },
      { label: 'Moderate - used pre-trained models', value: 'Med' },
      { label: 'Basic - theoretical understanding', value: 'Low' },
      { label: 'None', value: 'Low' }
    ]
  },
  {
    id: 'Q23_EvolutionaryAI',
    level: 3,
    text: "Have you worked with evolutionary algorithms, genetic algorithms, or cellular automata?",
    node: 'EvolutionaryExperience',
    options: [
      { label: 'Yes, implemented from scratch', value: 'High' },
      { label: 'Yes, used existing libraries', value: 'Med' },
      { label: 'No, but understand the concepts', value: 'Low' },
      { label: 'No, unfamiliar', value: 'Low' }
    ]
  }
];

// Group questions by level
export function getQuestionsByLevel(): Record<number, Question[]> {
  const grouped: Record<number, Question[]> = {};
  
  for (const question of questions) {
    if (!grouped[question.level]) {
      grouped[question.level] = [];
    }
    grouped[question.level].push(question);
  }
  
  return grouped;
}

// Sort questions by level and ID
export function getSortedQuestions(): Question[] {
  return [...questions].sort((a, b) => {
    if (a.level !== b.level) {
      return a.level - b.level;
    }
    return a.id.localeCompare(b.id);
  });
} 