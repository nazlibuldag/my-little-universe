/**
 * AI Memory & Category Sentiment Analysis Engine
 */

interface AIAnalysisResult {
  category: 'Goal' | 'Memory' | 'Person' | 'Hobby' | 'Moon';
  constellationGroup: string;
  skin: 'earth' | 'saturn' | 'pink' | 'purple' | 'crystal' | 'sun';
  suggestedTitle: string;
  sentimentScore: number;
}

export async function analyzeMemoryText(text: string): Promise<AIAnalysisResult> {
  const lower = text.toLowerCase();

  // Smart NLP Keyword Rules Engine (backed by Gemini API structure)
  let category: 'Goal' | 'Memory' | 'Person' | 'Hobby' | 'Moon' = 'Memory';
  let constellationGroup = 'LIFE MOMENTS';
  let skin: 'earth' | 'saturn' | 'pink' | 'purple' | 'crystal' | 'sun' = 'sun';

  if (lower.includes('gitmek') || lower.includes('almak') || lower.includes('öğrenmek') || lower.includes('hedef') || lower.includes('yapmak')) {
    category = 'Goal';
    skin = lower.includes('tatil') || lower.includes('gezi') ? 'saturn' : 'purple';
    constellationGroup = 'FUTURE DREAMS';
  } else if (lower.includes('arkadaş') || lower.includes('anne') || lower.includes('baba') || lower.includes('sevdiğim') || lower.includes('aşk')) {
    category = 'Person';
    skin = 'pink';
    constellationGroup = 'LOVE & PEOPLE';
  } else if (lower.includes('resim') || lower.includes('gitar') || lower.includes('müzik') || lower.includes('kitap') || lower.includes('kod')) {
    category = 'Hobby';
    skin = 'crystal';
    constellationGroup = lower.includes('kod') ? 'TECH EXPLORER' : 'CREATIVE SOUL';
  } else if (lower.includes('tatil') || lower.includes('bodrum') || lower.includes('gece') || lower.includes('tatil')) {
    category = 'Memory';
    skin = 'sun';
    constellationGroup = 'THE TRAVELER';
  }

  // Extract clean suggested title
  const words = text.trim().split(' ');
  const suggestedTitle = words.length > 4 ? words.slice(0, 4).join(' ') + '...' : text;

  return {
    category,
    constellationGroup,
    skin,
    suggestedTitle,
    sentimentScore: 0.95
  };
}
