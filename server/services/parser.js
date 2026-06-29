const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function extractJobData(input) {
  const isUrl = input.startsWith('http://') || input.startsWith('https://');

  let content = input;

  // If URL — fetch page HTML first
  if (isUrl) {
    const res = await fetch(input, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; JobParser/1.0)' }
    });
    if (!res.ok) throw new Error(`URL fetch failed: ${res.status}`);
    content = await res.text();
  }

  const prompt = `You are a job data extractor. Extract ALL available job details from the following content (raw HTML, page source, or plain text from AmbitionBox, Naukri, LinkedIn, Indeed, etc.).

Return ONLY a valid JSON object with these exact keys (use null for missing fields, empty array [] for missing lists):
{
  "title": "Job title",
  "company": "Company name",
  "location": "City/Location",
  "salary": "Salary range or CTC",
  "experience": "Required experience",
  "employmentType": "Full-time/Part-time/Contract etc",
  "workMode": "Remote/Hybrid/On-site",
  "education": "Educational qualification required",
  "skills": ["skill1", "skill2"],
  "description": "2-4 sentence job summary",
  "responsibilities": ["point1", "point2"],
  "requirements": ["req1", "req2"],
  "benefits": ["benefit1"],
  "postedDate": "When posted",
  "applyUrl": "Direct apply URL if found",
  "source": "Website name (AmbitionBox/Naukri/LinkedIn/etc)"
}

Extract as much detail as possible. For skills, list individual technologies/tools as separate array items. Return ONLY the JSON, no explanation.

Content:
${content.substring(0, 14000)}`;

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  const raw = message.content.map(b => b.text || '').join('');
  const clean = raw.replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
}

module.exports = { extractJobData };