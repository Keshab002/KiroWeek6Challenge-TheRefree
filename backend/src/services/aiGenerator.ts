/**
 * AI-powered description generator using Groq or Gemini
 * Groq is FREE and very fast
 */

interface GeneratedOption {
  description: string;
  attributes: {
    cost_model: { value: string; rating: 'low' | 'medium' | 'high'; description: string };
    scalability: { value: string; rating: 'low' | 'medium' | 'high'; description: string };
    complexity: { value: string; rating: 'low' | 'medium' | 'high'; description: string };
    maintenance: { value: string; rating: 'low' | 'medium' | 'high'; description: string };
  };
  category: string;
}

/**
 * Generate description using Groq API (FREE)
 */
async function generateWithGroq(optionName: string): Promise<GeneratedOption | null> {
  const apiKey = process.env.GROQ_API_KEY;
  
  if (!apiKey) {
    return null;
  }

  const prompt = `You are a technical expert. Generate detailed information about the technology "${optionName}".

Provide a JSON response with this exact structure (no markdown code blocks, just raw JSON):
{
  "description": "Write 3-4 detailed sentences explaining what ${optionName} is, what problems it solves, who uses it, and its main benefits. Be specific and informative.",
  "category": "Choose one: frontend, backend, mobile, database, cache, compute, messaging, orchestration, devops, cloud, or technology",
  "attributes": {
    "cost_model": { 
      "value": "Brief pricing model (e.g., 'Open source', 'Freemium', 'Pay-per-use')", 
      "rating": "low", 
      "description": "One sentence about cost" 
    },
    "scalability": { 
      "value": "Brief scalability description", 
      "rating": "high", 
      "description": "One sentence about scaling capabilities" 
    },
    "complexity": { 
      "value": "Brief complexity level", 
      "rating": "medium", 
      "description": "One sentence about learning curve" 
    },
    "maintenance": { 
      "value": "Brief maintenance needs", 
      "rating": "low", 
      "description": "One sentence about maintenance" 
    }
  }
}

IMPORTANT: 
- rating must be exactly "low", "medium", or "high"
- For rating: low = good/easy/cheap, high = difficult/expensive/complex
- Return ONLY valid JSON, no markdown, no explanation`;

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
        temperature: 0.3,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Groq API error for description:', response.status, errorText);
      return null;
    }

    const data = await response.json() as {
      choices?: { message?: { content?: string } }[];
    };
    
    const text = data.choices?.[0]?.message?.content;
    
    if (!text) {
      return null;
    }

    // Parse JSON from response
    let jsonStr = text;
    if (jsonStr.includes('```json')) {
      jsonStr = jsonStr.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    } else if (jsonStr.includes('```')) {
      jsonStr = jsonStr.replace(/```\s*/g, '');
    }
    
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return null;
    }

    const parsed = JSON.parse(jsonMatch[0]) as GeneratedOption;
    
    if (!parsed.description || !parsed.attributes || !parsed.category) {
      return null;
    }

    return parsed;
  } catch (error) {
    return null;
  }
}

// Known technology templates (fallback if Gemini fails)
const KNOWN_TECHNOLOGIES: Record<string, Partial<GeneratedOption>> = {
  'aws lambda': {
    category: 'compute',
    attributes: {
      cost_model: { value: 'Pay-per-request', rating: 'low', description: 'Only pay for actual execution time' },
      scalability: { value: 'Auto-scaling', rating: 'high', description: 'Scales automatically from 0 to thousands' },
      complexity: { value: 'Serverless', rating: 'low', description: 'No server management required' },
      maintenance: { value: 'Fully managed', rating: 'low', description: 'AWS handles all infrastructure' },
    },
  },
  'aws ec2': {
    category: 'compute',
    attributes: {
      cost_model: { value: 'Hourly/Reserved', rating: 'medium', description: 'Pay for running instances' },
      scalability: { value: 'Auto Scaling Groups', rating: 'medium', description: 'Requires configuration' },
      complexity: { value: 'Full control', rating: 'high', description: 'Complete OS access' },
      maintenance: { value: 'Self-managed', rating: 'high', description: 'You manage OS and updates' },
    },
  },
  'dynamodb': {
    category: 'database',
    attributes: {
      cost_model: { value: 'Pay-per-request/Provisioned', rating: 'medium', description: 'Flexible pricing options' },
      scalability: { value: 'Auto-scaling', rating: 'high', description: 'Handles any scale automatically' },
      complexity: { value: 'NoSQL', rating: 'medium', description: 'Different data modeling approach' },
      maintenance: { value: 'Fully managed', rating: 'low', description: 'AWS handles everything' },
    },
  },
  'postgresql': {
    category: 'database',
    attributes: {
      cost_model: { value: 'Open source', rating: 'low', description: 'Free to use' },
      scalability: { value: 'Vertical + Replicas', rating: 'medium', description: 'Scales vertically well' },
      complexity: { value: 'SQL', rating: 'medium', description: 'Requires SQL knowledge' },
      maintenance: { value: 'Self-managed', rating: 'medium', description: 'Regular tuning needed' },
    },
  },
  'mongodb': {
    category: 'database',
    attributes: {
      cost_model: { value: 'Open source/Atlas', rating: 'medium', description: 'Free or managed options' },
      scalability: { value: 'Horizontal sharding', rating: 'high', description: 'Built-in sharding' },
      complexity: { value: 'Document DB', rating: 'low', description: 'Flexible schema' },
      maintenance: { value: 'Moderate', rating: 'medium', description: 'Index management needed' },
    },
  },
  'redis': {
    category: 'cache',
    attributes: {
      cost_model: { value: 'Memory-based', rating: 'medium', description: 'Cost scales with memory' },
      scalability: { value: 'Cluster mode', rating: 'high', description: 'Redis Cluster for scaling' },
      complexity: { value: 'Rich features', rating: 'medium', description: 'Many data structures' },
      maintenance: { value: 'Moderate', rating: 'medium', description: 'Persistence config needed' },
    },
  },
  'kubernetes': {
    category: 'orchestration',
    attributes: {
      cost_model: { value: 'Infrastructure cost', rating: 'medium', description: 'Pay for underlying infra' },
      scalability: { value: 'Horizontal Pod Autoscaler', rating: 'high', description: 'Excellent scaling' },
      complexity: { value: 'Steep learning curve', rating: 'high', description: 'Complex but powerful' },
      maintenance: { value: 'Significant', rating: 'high', description: 'Cluster management required' },
    },
  },
  'docker': {
    category: 'containerization',
    attributes: {
      cost_model: { value: 'Free/Enterprise', rating: 'low', description: 'Free for most use cases' },
      scalability: { value: 'Container-based', rating: 'medium', description: 'Scales with orchestration' },
      complexity: { value: 'Moderate', rating: 'medium', description: 'Dockerfile knowledge needed' },
      maintenance: { value: 'Image updates', rating: 'medium', description: 'Keep images updated' },
    },
  },
  'apache kafka': {
    category: 'messaging',
    attributes: {
      cost_model: { value: 'Infrastructure cost', rating: 'medium', description: 'Self-hosted or managed' },
      scalability: { value: 'Partitioning', rating: 'high', description: 'Excellent throughput' },
      complexity: { value: 'Complex setup', rating: 'high', description: 'Requires expertise' },
      maintenance: { value: 'Significant', rating: 'high', description: 'Cluster management' },
    },
  },
  'rabbitmq': {
    category: 'messaging',
    attributes: {
      cost_model: { value: 'Open source', rating: 'low', description: 'Free to use' },
      scalability: { value: 'Clustering', rating: 'medium', description: 'Good for moderate scale' },
      complexity: { value: 'Moderate', rating: 'medium', description: 'AMQP protocol' },
      maintenance: { value: 'Moderate', rating: 'medium', description: 'Queue management' },
    },
  },
  'elasticsearch': {
    category: 'search',
    attributes: {
      cost_model: { value: 'Open source/Cloud', rating: 'medium', description: 'Self-hosted or Elastic Cloud' },
      scalability: { value: 'Horizontal', rating: 'high', description: 'Sharding and replicas' },
      complexity: { value: 'Query DSL', rating: 'medium', description: 'Powerful but complex queries' },
      maintenance: { value: 'Index management', rating: 'medium', description: 'Shard balancing needed' },
    },
  },
  'nginx': {
    category: 'networking',
    attributes: {
      cost_model: { value: 'Open source', rating: 'low', description: 'Free to use' },
      scalability: { value: 'High performance', rating: 'high', description: 'Handles many connections' },
      complexity: { value: 'Config files', rating: 'medium', description: 'Configuration-based' },
      maintenance: { value: 'Low', rating: 'low', description: 'Stable and reliable' },
    },
  },
};

/**
 * Detect category from name
 */
function detectCategory(name: string): string {
  const lowerName = name.toLowerCase();
  
  // Frontend frameworks
  if (lowerName.includes('react') || lowerName.includes('vue') || lowerName.includes('angular') || 
      lowerName.includes('svelte') || lowerName.includes('next') || lowerName.includes('nuxt')) {
    return 'frontend';
  }
  // Mobile frameworks
  if (lowerName.includes('flutter') || lowerName.includes('react native') || lowerName.includes('ionic') ||
      lowerName.includes('xamarin') || lowerName.includes('swift') || lowerName.includes('kotlin')) {
    return 'mobile';
  }
  // Backend/Languages
  if (lowerName.includes('node') || lowerName.includes('python') || lowerName.includes('java') ||
      lowerName.includes('go') || lowerName.includes('rust') || lowerName.includes('php') ||
      lowerName.includes('ruby') || lowerName.includes('django') || lowerName.includes('express') ||
      lowerName.includes('spring') || lowerName.includes('fastapi') || lowerName.includes('.net')) {
    return 'backend';
  }
  if (lowerName.includes('database') || lowerName.includes('db') || lowerName.includes('sql') || lowerName.includes('mongo') || lowerName.includes('dynamo')) {
    return 'database';
  }
  if (lowerName.includes('cache') || lowerName.includes('redis') || lowerName.includes('memcache')) {
    return 'cache';
  }
  if (lowerName.includes('lambda') || lowerName.includes('function') || lowerName.includes('ec2') || lowerName.includes('compute')) {
    return 'compute';
  }
  if (lowerName.includes('kafka') || lowerName.includes('queue') || lowerName.includes('rabbit') || lowerName.includes('sqs') || lowerName.includes('sns')) {
    return 'messaging';
  }
  if (lowerName.includes('kubernetes') || lowerName.includes('k8s') || lowerName.includes('docker') || lowerName.includes('container')) {
    return 'orchestration';
  }
  if (lowerName.includes('s3') || lowerName.includes('storage') || lowerName.includes('blob')) {
    return 'storage';
  }
  if (lowerName.includes('elastic') || lowerName.includes('search') || lowerName.includes('solr')) {
    return 'search';
  }
  if (lowerName.includes('nginx') || lowerName.includes('load') || lowerName.includes('proxy') || lowerName.includes('cdn')) {
    return 'networking';
  }
  if (lowerName.includes('cloudwatch') || lowerName.includes('monitor') || lowerName.includes('grafana') || lowerName.includes('prometheus')) {
    return 'monitoring';
  }
  
  return 'technology';
}

/**
 * Generate default attributes based on category
 */
function getDefaultAttributes(category: string): GeneratedOption['attributes'] {
  const defaults: Record<string, GeneratedOption['attributes']> = {
    frontend: {
      cost_model: { value: 'Open source', rating: 'low', description: 'Free to use' },
      scalability: { value: 'Component-based', rating: 'high', description: 'Scales with architecture' },
      complexity: { value: 'Moderate', rating: 'medium', description: 'Learning curve varies' },
      maintenance: { value: 'Community driven', rating: 'medium', description: 'Regular updates needed' },
    },
    mobile: {
      cost_model: { value: 'Open source', rating: 'low', description: 'Free framework' },
      scalability: { value: 'Cross-platform', rating: 'high', description: 'Multiple platforms from one codebase' },
      complexity: { value: 'Moderate', rating: 'medium', description: 'Platform-specific knowledge helpful' },
      maintenance: { value: 'Active development', rating: 'medium', description: 'Frequent updates' },
    },
    backend: {
      cost_model: { value: 'Open source', rating: 'low', description: 'Free to use' },
      scalability: { value: 'Horizontal', rating: 'high', description: 'Can scale with load balancing' },
      complexity: { value: 'Moderate', rating: 'medium', description: 'Depends on framework' },
      maintenance: { value: 'LTS available', rating: 'low', description: 'Long-term support options' },
    },
    database: {
      cost_model: { value: 'Variable', rating: 'medium', description: 'Depends on hosting choice' },
      scalability: { value: 'Scalable', rating: 'medium', description: 'Can scale with proper setup' },
      complexity: { value: 'Moderate', rating: 'medium', description: 'Requires database knowledge' },
      maintenance: { value: 'Regular', rating: 'medium', description: 'Backups and optimization needed' },
    },
    cache: {
      cost_model: { value: 'Memory-based', rating: 'medium', description: 'Cost scales with memory' },
      scalability: { value: 'High', rating: 'high', description: 'Designed for speed and scale' },
      complexity: { value: 'Low', rating: 'low', description: 'Simple key-value operations' },
      maintenance: { value: 'Low', rating: 'low', description: 'Minimal maintenance' },
    },
    compute: {
      cost_model: { value: 'Usage-based', rating: 'medium', description: 'Pay for compute time' },
      scalability: { value: 'Scalable', rating: 'high', description: 'Can scale up/down' },
      complexity: { value: 'Moderate', rating: 'medium', description: 'Deployment knowledge needed' },
      maintenance: { value: 'Moderate', rating: 'medium', description: 'Updates and monitoring' },
    },
    messaging: {
      cost_model: { value: 'Throughput-based', rating: 'medium', description: 'Cost per message/request' },
      scalability: { value: 'High', rating: 'high', description: 'Built for high throughput' },
      complexity: { value: 'Moderate', rating: 'medium', description: 'Message patterns to learn' },
      maintenance: { value: 'Moderate', rating: 'medium', description: 'Queue monitoring needed' },
    },
    orchestration: {
      cost_model: { value: 'Infrastructure', rating: 'medium', description: 'Pay for underlying resources' },
      scalability: { value: 'Excellent', rating: 'high', description: 'Designed for scaling' },
      complexity: { value: 'High', rating: 'high', description: 'Steep learning curve' },
      maintenance: { value: 'Significant', rating: 'high', description: 'Cluster management' },
    },
    technology: {
      cost_model: { value: 'Variable', rating: 'medium', description: 'Depends on usage' },
      scalability: { value: 'Variable', rating: 'medium', description: 'Depends on architecture' },
      complexity: { value: 'Moderate', rating: 'medium', description: 'Some learning required' },
      maintenance: { value: 'Moderate', rating: 'medium', description: 'Regular updates needed' },
    },
  };
  
  return defaults[category] || defaults.technology;
}

/**
 * Generate option details - Uses Groq AI (free) for accurate descriptions
 */
export async function generateOptionDetails(optionName: string): Promise<GeneratedOption> {
  // Try Groq AI first (free & fast)
  const groqResult = await generateWithGroq(optionName);
  if (groqResult) {
    return groqResult;
  }

  // Fallback: Check known templates
  const lowerName = optionName.toLowerCase().trim();
  for (const [key, template] of Object.entries(KNOWN_TECHNOLOGIES)) {
    if (lowerName.includes(key) || key.includes(lowerName)) {
      return {
        description: `${optionName} - A technology solution for ${template.category} workloads.`,
        category: template.category!,
        attributes: template.attributes!,
      };
    }
  }
  
  // Final fallback: category detection with defaults
  const category = detectCategory(optionName);
  
  return {
    description: `${optionName} - A technology solution. Please update with accurate details.`,
    category,
    attributes: getDefaultAttributes(category),
  };
}
