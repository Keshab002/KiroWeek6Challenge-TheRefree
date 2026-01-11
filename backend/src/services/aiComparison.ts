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
        max_tokens: 2048,
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

  return `Compare ${opt1} vs ${opt2}.
Scalability: ${constraints.scalabilityPriority}
User Background: "${userContext}"

${optionDetails}

Return this EXACT JSON structure. Each pro/con MUST be 15-25 words (2-3 lines of text):

{
  "summary": "2-3 sentences comparing both options clearly",
  "recommendation": "Pick [option] because [detailed reason in 2 sentences]",
  "decisionGuidance": "Write 5-7 detailed sentences explaining: 1) When to choose the first option and why, 2) When to choose the second option and why, 3) Key trade-offs to consider, 4) What factors should influence the decision, 5) Any important caveats or considerations. Make this comprehensive and helpful for decision-making.",
  "personalizedInsights": [
    "Detailed tip 1 for ${userContext} - explain why this matters (15-20 words)",
    "Detailed tip 2 with specific actionable advice (15-20 words)",
    "Detailed tip 3 about learning path or next steps (15-20 words)",
    "Detailed tip 4 about common mistakes to avoid (15-20 words)"
  ],
  "detailedAnalysis": [
    {
      "optionName": "${opt1}",
      "pros": [
        "First strength explained in detail - what it means and why it matters for your project (15-25 words)",
        "Second strength with practical benefits and real-world impact on development (15-25 words)",
        "Third strength describing a specific advantage with examples (15-25 words)"
      ],
      "cons": [
        "First weakness explained clearly - what challenges you might face and how to handle them (15-25 words)",
        "Second weakness with context about when this becomes a problem (15-25 words)"
      ],
      "bestFor": "Detailed description of ideal use cases and project types (20-30 words)"
    },
    {
      "optionName": "${opt2}",
      "pros": [
        "First strength explained in detail - what it means and why it matters for your project (15-25 words)",
        "Second strength with practical benefits and real-world impact on development (15-25 words)",
        "Third strength describing a specific advantage with examples (15-25 words)"
      ],
      "cons": [
        "First weakness explained clearly - what challenges you might face and how to handle them (15-25 words)",
        "Second weakness with context about when this becomes a problem (15-25 words)"
      ],
      "bestFor": "Detailed description of ideal use cases and project types (20-30 words)"
    }
  ],
  "pivotStatement": "Choose ${opt1} if [specific condition], otherwise choose ${opt2} if [specific condition]",
  "confidenceScore": 85
}

CRITICAL RULES:
1. Each pro/con MUST be 15-25 words (2-3 lines), NOT just 1-2 words
2. personalizedInsights MUST have 4 detailed tips (15-20 words each)
3. decisionGuidance MUST be 5-7 sentences with comprehensive analysis
4. Use simple language a beginner can understand
5. Return ONLY valid JSON`;
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
