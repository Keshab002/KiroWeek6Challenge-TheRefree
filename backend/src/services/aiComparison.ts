/**
 * AI-Powered Comparison Service
 * Uses Groq (free), Gemini for intelligent comparisons
 */

import { ComparisonResult, Constraints, TradeOffExplanation, PivotResult } from '../types';

interface AIComparisonResult {
  summary: string;
  recommendation: string;
  decisionGuidance: string;
  personalizedInsights?: string[];
  detailedAnalysis: {
    optionName: string;
    pros: string[];
    cons: string[];
    bestFor: string;
  }[];
  pivotStatement: string;
  confidenceScore: number;
}

interface IntegrationSuggestion {
  name: string;
  category: string;
  reason: string;
}

/**
 * Call Groq API (FREE - very fast)
 */
async function callGroqAPI(prompt: string): Promise<string | null> {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return null;
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Groq API error:', response.status, errorText);
      return null;
    }

    const data = await response.json() as {
      choices?: { message?: { content?: string } }[];
    };

    return data.choices?.[0]?.message?.content || null;
  } catch (error) {
    console.error('Groq API failed:', error);
    return null;
  }
}

/**
 * Call Google Gemini API (fallback)
 */
async function callGeminiAPI(prompt: string): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return null;
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
        }),
      }
    );

    if (!response.ok) return null;

    const data = await response.json() as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };

    return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
  } catch (error) {
    console.error('Gemini API failed:', error);
    return null;
  }
}

/**
 * Build comparison prompt with user context
 */
function buildComparisonPrompt(
  comparison: ComparisonResult,
  constraints: Constraints,
  additionalContext?: string
): string {
  const options = comparison.options;
  const opt1 = options[0]?.name || 'Option 1';
  const opt2 = options[1]?.name || 'Option 2';

  const optionDetails = options.map(opt => 
    `${opt.name}: Cost=${opt.attributes.costModel.value}, Scalability=${opt.attributes.scalability.value}, Complexity=${opt.attributes.complexity.value}`
  ).join('\n');

  const userContext = additionalContext || 'general developer';

  return `Compare ${opt1} vs ${opt2} for a ${userContext}.
Priority: Scalability=${constraints.scalabilityPriority}

${optionDetails}

Return ONLY this JSON with DETAILED explanations:

{
  "summary": "2-3 sentences comparing both options, highlighting key differences and trade-offs",
  "recommendation": "${opt1} or ${opt2} with a detailed explanation of why (2-3 sentences)",
  "decisionGuidance": "Detailed guidance on when to pick each option (3-4 sentences covering different scenarios)",
  "personalizedInsights": [
    "Detailed insight 1 with specific advice (1-2 sentences)",
    "Detailed insight 2 with actionable recommendation (1-2 sentences)",
    "Detailed insight 3 with context-specific tip (1-2 sentences)"
  ],
  "detailedAnalysis": [
    {
      "optionName": "${opt1}",
      "pros": ["Detailed pro 1 explaining the benefit (1-2 sentences)", "Detailed pro 2 (1-2 sentences)", "Detailed pro 3 (1-2 sentences)"],
      "cons": ["Detailed con 1 explaining the drawback (1-2 sentences)", "Detailed con 2 (1-2 sentences)"],
      "bestFor": "Detailed description of ideal use cases and scenarios (2-3 sentences)"
    },
    {
      "optionName": "${opt2}",
      "pros": ["Detailed pro 1 explaining the benefit (1-2 sentences)", "Detailed pro 2 (1-2 sentences)", "Detailed pro 3 (1-2 sentences)"],
      "cons": ["Detailed con 1 explaining the drawback (1-2 sentences)", "Detailed con 2 (1-2 sentences)"],
      "bestFor": "Detailed description of ideal use cases and scenarios (2-3 sentences)"
    }
  ],
  "pivotStatement": "Clear decision statement: ${opt1} for [specific scenarios], ${opt2} for [other scenarios] (1-2 sentences)",
  "confidenceScore": 85
}

RULES: Provide DETAILED, INFORMATIVE responses. Each point should be thorough and helpful. Return ONLY valid JSON.`;
}

/**
 * Parse AI response
 */
function parseAIResponse(response: string): AIComparisonResult | null {
  try {
    let jsonStr = response;
    if (jsonStr.includes('```json')) {
      jsonStr = jsonStr.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    } else if (jsonStr.includes('```')) {
      jsonStr = jsonStr.replace(/```\s*/g, '');
    }

    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON found in response');
      return null;
    }

    const parsed = JSON.parse(jsonMatch[0]) as AIComparisonResult;
    
    if (!parsed.summary || !parsed.recommendation || !parsed.detailedAnalysis) {
      console.error('Missing required fields in parsed response');
      return null;
    }

    return parsed;
  } catch (error) {
    console.error('Failed to parse AI response:', error);
    return null;
  }
}

/**
 * Generate full AI comparison
 */
export async function generateFullAIComparison(
  comparison: ComparisonResult,
  constraints: Constraints,
  additionalContext?: string
): Promise<AIComparisonResult | null> {
  const prompt = buildComparisonPrompt(comparison, constraints, additionalContext);

  let aiResponse = await callGroqAPI(prompt);
  if (!aiResponse) {
    aiResponse = await callGeminiAPI(prompt);
  }

  if (!aiResponse) {
    return null;
  }

  return parseAIResponse(aiResponse);
}

/**
 * Generate AI suggestions for integrations
 */
export async function suggestIntegrations(
  optionName: string,
  useCase: string
): Promise<IntegrationSuggestion[]> {
  const prompt = `Suggest 5 integrations/tools that work well with ${optionName} for: ${useCase}

Return ONLY valid JSON array:
[
  {"name": "Tool Name", "category": "category", "reason": "One sentence why this integration is useful"},
  ...
]

Categories: storage, monitoring, orchestration, containerization, infrastructure, ci_cd, security, analytics`;

  let response = await callGroqAPI(prompt);
  if (!response) response = await callGeminiAPI(prompt);
  if (!response) return [];

  try {
    let jsonStr = response;
    if (jsonStr.includes('```')) {
      jsonStr = jsonStr.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    }
    const match = jsonStr.match(/\[[\s\S]*\]/);
    if (!match) return [];
    return JSON.parse(match[0]) as IntegrationSuggestion[];
  } catch {
    return [];
  }
}

/**
 * Auto-fill option details with AI
 */
export async function generateOptionDetails(name: string): Promise<{
  description: string;
  category: string;
  attributes: {
    cost_model: { value: string; rating: 'low' | 'medium' | 'high'; description: string };
    scalability: { value: string; rating: 'low' | 'medium' | 'high'; description: string };
    complexity: { value: string; rating: 'low' | 'medium' | 'high'; description: string };
    maintenance: { value: string; rating: 'low' | 'medium' | 'high'; description: string };
  };
} | null> {
  const prompt = `Generate details for technology: ${name}

Return ONLY valid JSON:
{
  "description": "2-3 sentences describing what ${name} is and its main purpose",
  "category": "one of: compute, database, cache, storage, messaging, frontend, backend, devops",
  "attributes": {
    "cost_model": {"value": "pricing model (e.g., Pay-per-use, Subscription)", "rating": "low/medium/high", "description": "One sentence about cost"},
    "scalability": {"value": "scaling approach", "rating": "low/medium/high", "description": "One sentence about scaling"},
    "complexity": {"value": "complexity level", "rating": "low/medium/high", "description": "One sentence about complexity"},
    "maintenance": {"value": "maintenance needs", "rating": "low/medium/high", "description": "One sentence about maintenance"}
  }
}`;

  let response = await callGroqAPI(prompt);
  if (!response) response = await callGeminiAPI(prompt);
  if (!response) return null;

  try {
    let jsonStr = response;
    if (jsonStr.includes('```')) {
      jsonStr = jsonStr.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    }
    const match = jsonStr.match(/\{[\s\S]*\}/);
    if (!match) return null;
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

/**
 * Enhance existing comparison with AI insights
 */
export async function enhanceWithAI(
  comparison: ComparisonResult,
  constraints: Constraints,
  existingExplanation: TradeOffExplanation,
  existingPivot: PivotResult,
  additionalContext?: string
): Promise<{
  explanation: TradeOffExplanation;
  pivot: PivotResult;
  aiEnhanced: boolean;
  aiAnalysis?: AIComparisonResult;
}> {
  const aiResult = await generateFullAIComparison(comparison, constraints, additionalContext);

  if (!aiResult) {
    return {
      explanation: existingExplanation,
      pivot: existingPivot,
      aiEnhanced: false,
    };
  }

  const enhancedExplanation: TradeOffExplanation = {
    ...existingExplanation,
    summary: aiResult.summary,
    optionAnalysis: existingExplanation.optionAnalysis.map((analysis, index) => {
      const aiAnalysis = aiResult.detailedAnalysis[index];
      if (aiAnalysis) {
        return {
          ...analysis,
          strengths: aiAnalysis.pros,
          weaknesses: aiAnalysis.cons,
          fitReason: aiAnalysis.bestFor,
        };
      }
      return analysis;
    }),
  };

  return {
    explanation: enhancedExplanation,
    pivot: { ...existingPivot, statement: aiResult.pivotStatement },
    aiEnhanced: true,
    aiAnalysis: aiResult,
  };
}
