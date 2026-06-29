const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── Layer 1: JSON-LD se direct extract ──────────────────────────────────────
function extractFromJsonLD(html) {
  const results = [];
  const regex = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;

  while ((match = regex.exec(html)) !== null) {
    try {
      const json = JSON.parse(match[1].trim());
      const items = Array.isArray(json) ? json : [json];
      for (const item of items) {
        if (item['@type'] === 'JobPosting') results.push(item);
      }
    } catch (_) {}
  }

  if (results.length === 0) return null;
  const j = results[0];

  // Salary extract
  let salary = null;
  if (j.baseSalary) {
    const bs = j.baseSalary;
    if (typeof bs === 'string') {
      salary = bs;
    } else if (bs.value) {
      const v = bs.value;
      if (v.minValue && v.maxValue) {
        salary = `${bs.currency || ''} ${v.minValue} – ${v.maxValue} / ${v.unitText || 'Year'}`.trim();
      } else if (v.value) {
        salary = `${bs.currency || ''} ${v.value} / ${v.unitText || 'Year'}`.trim();
      }
    }
  }

  // Location extract
  let location = null;
  if (j.jobLocation) {
    const loc = Array.isArray(j.jobLocation) ? j.jobLocation[0] : j.jobLocation;
    if (loc?.address) {
      const a = loc.address;
      location = [a.addressLocality, a.addressRegion, a.addressCountry]
        .filter(Boolean).join(', ');
    }
  }

  // Skills extract
  let skills = [];
  if (j.skills) {
    skills = typeof j.skills === 'string'
      ? j.skills.split(/[,;|]/).map(s => s.trim()).filter(Boolean)
      : Array.isArray(j.skills) ? j.skills : [];
  }

  // Description — strip HTML tags
  const stripHtml = (str) => str
    ? str.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    : null;

  return {
    title: j.title || j.name || null,
    company: j.hiringOrganization?.name || null,
    location,
    salary,
    experience: j.experienceRequirements?.monthsOfExperience
      ? `${Math.round(j.experienceRequirements.monthsOfExperience / 12)} years`
      : (typeof j.experienceRequirements === 'string' ? j.experienceRequirements : null),
    employmentType: j.employmentType || null,
    workMode: j.jobLocationType === 'TELECOMMUTE' ? 'Remote' : null,
    education: j.educationRequirements?.credentialCategory
      || (typeof j.educationRequirements === 'string' ? j.educationRequirements : null),
    skills,
    description: stripHtml(j.description)?.substring(0, 600) || null,
    responsibilities: [],
    requirements: j.qualifications ? [stripHtml(j.qualifications)] : [],
    benefits: j.jobBenefits
      ? (typeof j.jobBenefits === 'string'
          ? j.jobBenefits.split(/[,;]/).map(s => s.trim()).filter(Boolean)
          : j.jobBenefits)
      : [],
    postedDate: j.datePosted || null,
    applyUrl: j.url || null,
    source: detectSource(html),
    _method: 'json-ld',
  };
}

// ── Layer 2: AI fallback ─────────────────────────────────────────────────────
async function extractWithAI(content, source) {
  const prompt = `You are a job data extractor. From the content below (HTML page source or plain text from a job listing on ${source || 'a job site'}), extract all job details.

Return ONLY a valid JSON object — no explanation, no markdown fences:
{
  "title": string or null,
  "company": string or null,
  "location": string or null,
  "salary": string or null,
  "experience": string or null,
  "employmentType": string or null,
  "workMode": string or null,
  "education": string or null,
  "skills": string[],
  "description": string or null (2-5 sentence summary),
  "responsibilities": string[],
  "requirements": string[],
  "benefits": string[],
  "postedDate": string or null,
  "applyUrl": string or null,
  "source": string or null
}

Rules:
- skills: individual technologies, tools, languages as separate array items
- responsibilities/requirements: separate bullet points as separate array items
- Strip all HTML tags from text values
- If a field is not found, use null or []

Content (first 13000 chars):
${content.substring(0, 13000)}`;

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  const raw = message.content.map(b => b.text || '').join('');
  const clean = raw.replace(/```json|```/g, '').trim();
  const data = JSON.parse(clean);
  data._method = 'ai';
  return data;
}

// ── Source detector ──────────────────────────────────────────────────────────
function detectSource(input) {
  const lower = input.toLowerCase();
  if (lower.includes('ambitionbox.com')) return 'AmbitionBox';
  if (lower.includes('naukri.com')) return 'Naukri';
  if (lower.includes('linkedin.com')) return 'LinkedIn';
  if (lower.includes('indeed.com')) return 'Indeed';
  if (lower.includes('foundit.in') || lower.includes('monster.com')) return 'Foundit';
  if (lower.includes('internshala.com')) return 'Internshala';
  if (lower.includes('glassdoor.com')) return 'Glassdoor';
  if (lower.includes('shine.com')) return 'Shine';
  if (lower.includes('hirist.com')) return 'Hirist';
  if (lower.includes('wellfound.com') || lower.includes('angel.co')) return 'Wellfound';
  return null;
}

// ── Main function ────────────────────────────────────────────────────────────
async function extractJobData(input) {
  const isUrl = /^https?:\/\//i.test(input.trim());
  let content = input;

  if (isUrl) {
    const res = await fetch(input.trim(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
    });
    if (!res.ok) throw new Error(`URL fetch failed: ${res.status}`);
    content = await res.text();
  }

  const source = detectSource(content) || detectSource(input);

  // Try JSON-LD first (fast, accurate)
  const fromLD = extractFromJsonLD(content);
  if (fromLD && fromLD.title) {
    // Fill source if missing
    if (!fromLD.source) fromLD.source = source;
    // If JSON-LD got title but no description/skills, supplement with AI
    if (!fromLD.description || fromLD.skills.length === 0) {
      try {
        const ai = await extractWithAI(content, source);
        return {
          ...fromLD,
          description: fromLD.description || ai.description,
          skills: fromLD.skills.length > 0 ? fromLD.skills : (ai.skills || []),
          responsibilities: fromLD.responsibilities.length > 0 ? fromLD.responsibilities : (ai.responsibilities || []),
          requirements: fromLD.requirements.length > 0 ? fromLD.requirements : (ai.requirements || []),
          benefits: fromLD.benefits.length > 0 ? fromLD.benefits : (ai.benefits || []),
          workMode: fromLD.workMode || ai.workMode,
          experience: fromLD.experience || ai.experience,
          _method: 'json-ld+ai',
        };
      } catch (_) {
        return fromLD;
      }
    }
    return fromLD;
  }

  // Fallback: pure AI extraction
  return extractWithAI(content, source);
}

module.exports = { extractJobData };