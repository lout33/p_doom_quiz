'use client';

import { Expert } from '../lib/data-service';

interface ExpertModalProps {
  expert: Expert | null;
  isOpen: boolean;
  onClose: () => void;
  year: 2035 | 2040 | 2060;
}

// Expert information and sources
const expertInfo: Record<string, { bio: string; sources: string[] }> = {
  "Eliezer Yudkowsky": {
    bio: "Research fellow at the Machine Intelligence Research Institute (MIRI), known for his work on AI alignment and safety. Prominent voice in AI existential risk discussions.",
    sources: [
      "AGI Ruin: A List of Lethalities (2022)",
      "Various LessWrong posts on AI safety",
      "Interviews and podcast appearances discussing P(doom)"
    ]
  },
  "Paul Christiano": {
    bio: "Head of Alignment Team at OpenAI (former), researcher focused on AI alignment and iterated amplification approaches.",
    sources: [
      "AI Alignment Forum posts",
      "Interviews discussing AI risk timelines",
      "Technical alignment research papers"
    ]
  },
  "Sam Altman": {
    bio: "CEO of OpenAI, leading the development of GPT models and AGI research.",
    sources: [
      "Public interviews and statements",
      "Blog posts on AI safety and governance",
      "Congressional testimonies on AI"
    ]
  },
  "Geoffrey Hinton": {
    bio: "Pioneer in deep learning, Turing Award winner, former Google researcher. Recently left Google to speak more freely about AI risks.",
    sources: [
      "Public interviews after leaving Google (2023)",
      "Statements on AI existential risk",
      "Academic papers on neural networks"
    ]
  },
  "Stuart Russell": {
    bio: "Professor at UC Berkeley, co-author of 'Artificial Intelligence: A Modern Approach', prominent AI safety researcher.",
    sources: [
      "Human Compatible: AI and the Problem of Control (2019)",
      "TED talks and public lectures on AI safety",
      "Academic research on value alignment"
    ]
  },
  "Demis Hassabis": {
    bio: "CEO and co-founder of DeepMind (Google), leading AGI research with emphasis on safety.",
    sources: [
      "DeepMind safety research papers",
      "Public talks and interviews",
      "Statements on responsible AI development"
    ]
  },
  "Yoshua Bengio": {
    bio: "Turing Award winner, professor at University of Montreal, pioneer in deep learning and advocate for AI safety research.",
    sources: [
      "Academic papers and position statements",
      "Public statements on AI risks",
      "Interviews on AI governance"
    ]
  },
  "Andrew Ng": {
    bio: "Co-founder of Google Brain, former Chief Scientist at Baidu, Stanford professor. Generally optimistic about AI development.",
    sources: [
      "Coursera lectures and courses",
      "Public statements on AI progress",
      "Interviews on AI safety concerns"
    ]
  },
  "Yann LeCun": {
    bio: "Chief AI Scientist at Meta, Turing Award winner, pioneer in convolutional neural networks. Skeptical of short-term AGI risks.",
    sources: [
      "Twitter/X discussions on AI safety",
      "Academic papers on deep learning",
      "Public debates on AI existential risk"
    ]
  },
  "Helen Toner": {
    bio: "Director of Strategy at Georgetown's Center for Security and Emerging Technology (CSET), former OpenAI board member.",
    sources: [
      "CSET research publications",
      "Policy papers on AI governance",
      "Congressional testimonies"
    ]
  },
  "Nick Bostrom": {
    bio: "Philosopher at Oxford University, author of 'Superintelligence', founding director of the Future of Humanity Institute.",
    sources: [
      "Superintelligence: Paths, Dangers, Strategies (2014)",
      "Academic papers on existential risk",
      "Public lectures and interviews"
    ]
  },
  "Eric Schmidt": {
    bio: "Former CEO of Google, chair of the National Security Commission on AI, technology advisor and investor.",
    sources: [
      "The Age of AI book (co-authored)",
      "National Security Commission on AI reports",
      "Public statements on AI governance"
    ]
  },
  "Rob Miles": {
    bio: "AI safety researcher and educator, known for YouTube videos explaining AI alignment problems and existential risks.",
    sources: [
      "YouTube channel on AI safety",
      "Collaborations with AI safety organizations",
      "Educational content on alignment challenges"
    ]
  }
};

export default function ExpertModal({ expert, isOpen, onClose, year }: ExpertModalProps) {
  if (!isOpen || !expert) return null;

  const info = expertInfo[expert.name] || { bio: "Information not available.", sources: [] };
  const pdoomValue = expert[`pdoom_${year}_percent`];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-700 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-900 to-blue-800 p-6 rounded-t-lg border-b border-gray-700">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">{expert.name}</h2>
              <div className="text-blue-200 text-lg">
                P(doom) {year}: <span className="font-bold">{pdoomValue !== null ? `${pdoomValue}%` : 'N/A'}</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-300 hover:text-white transition-colors"
              aria-label="Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Bio */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-100 mb-2">Background</h3>
            <p className="text-gray-300 leading-relaxed">{info.bio}</p>
          </div>

          {/* P(doom) estimates for all years */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-100 mb-3">P(doom) Estimates</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                <div className="text-sm text-gray-400 mb-1">2035</div>
                <div className="text-2xl font-bold text-blue-400">
                  {expert.pdoom_2035_percent !== null ? `${expert.pdoom_2035_percent}%` : 'N/A'}
                </div>
              </div>
              <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                <div className="text-sm text-gray-400 mb-1">2040</div>
                <div className="text-2xl font-bold text-purple-400">
                  {expert.pdoom_2040_percent !== null ? `${expert.pdoom_2040_percent}%` : 'N/A'}
                </div>
              </div>
              <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                <div className="text-sm text-gray-400 mb-1">2060</div>
                <div className="text-2xl font-bold text-pink-400">
                  {expert.pdoom_2060_percent !== null ? `${expert.pdoom_2060_percent}%` : 'N/A'}
                </div>
              </div>
            </div>
          </div>

          {/* Sources */}
          {info.sources.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-100 mb-3">Sources & Evidence</h3>
              <ul className="space-y-2">
                {info.sources.map((source, index) => (
                  <li key={index} className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400 mr-2 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-300">{source}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-6 p-4 bg-gray-900 rounded-lg border border-gray-700">
            <p className="text-sm text-gray-400 italic">
              Note: These estimates are compiled from various public statements, interviews, and writings. 
              Exact values may be approximations based on available information.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}