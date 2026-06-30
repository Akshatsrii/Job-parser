const { GoogleGenAI } = require("@google/genai");

// ─────────────────────────────────────────────────────────────
// Gemini Setup
// ─────────────────────────────────────────────────────────────

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// ─────────────────────────────────────────────────────────────
// Helpers─
// ────────────────────────────────────────────────────────────

const stripHtml = (text) => {
  if (!text) return null;
  return text
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, " ")
    .trim();
};

function firstMatch(html, ...patterns) {
  for (const pattern of patterns) {
    const m = html.match(pattern);
    if (m && m[1]) return m[1].trim();
  }
  return null;
}

function allMatches(html, pattern) {
  const results = [];
  let m;
  const regex = new RegExp(pattern.source, pattern.flags);
  while ((m = regex.exec(html)) !== null) {
    if (m[1]) results.push(m[1].trim());
  }
  return results;
}

function detectSource(input) {
  if (!input) return "Unknown";
  const lower = input.toLowerCase();
  if (lower.includes("amazon.jobs")) return "Amazon";
  if (lower.includes("ambitionbox")) return "AmbitionBox";
  if (lower.includes("linkedin")) return "LinkedIn";
  if (lower.includes("naukri")) return "Naukri";
  if (lower.includes("indeed")) return "Indeed";
  if (lower.includes("internshala")) return "Internshala";
  if (lower.includes("foundit")) return "Foundit";
  if (lower.includes("glassdoor")) return "Glassdoor";
  if (lower.includes("shine.com")) return "Shine";
  if (lower.includes("monster")) return "Monster";
  if (lower.includes("unstop")) return "Unstop";
  if (lower.includes("wellfound")) return "Wellfound";
  if (lower.includes("hirist")) return "HiRist";
  if (lower.includes("cutshort")) return "Cutshort";
  if (lower.includes("angel") || lower.includes("angellist")) return "AngelList";
  return "Unknown";
}

function mergeData(base, extra) {
  if (!extra) return base;
  const result = { ...base };
  for (const key of Object.keys(extra)) {
    if (key === "_method") continue;
    const baseVal = result[key];
    const extraVal = extra[key];
    if (Array.isArray(baseVal)) {
      result[key] = baseVal.length ? baseVal : (extraVal || []);
    } else {
      result[key] = baseVal || extraVal || null;
    }
  }
  return result;
}

// ─────────────────────────────────────────────────────────────
// Fetch Strategy 1 — HTTP with browser-like headers
// Works on: Naukri, Indeed, Internshala, AmbitionBox, Foundit
// Fails on: LinkedIn, Amazon (bot protection)
// ─────────────────────────────────────────────────────────────

async function fetchWithHeaders(url) {
  const userAgents = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  ];
  for (const ua of userAgents) {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": ua,
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
          "Accept-Encoding": "gzip, deflate, br",
          "Cache-Control": "no-cache",
          "Pragma": "no-cache",
          "Upgrade-Insecure-Requests": "1",
          "Sec-Fetch-Dest": "document",
          "Sec-Fetch-Mode": "navigate",
          "Sec-Fetch-Site": "none",
        },
      });
      if (res.ok) {
        console.log("HTTP fetch success");
        return await res.text();
      }
      console.log(`HTTP fetch got ${res.status} from ${url}`);
    } catch (err) {
      console.log(`HTTP fetch error: ${err.message}`);
    }
  }
  return null;
}

// ─────────────────────────────────────────────────────────────
// Fetch Strategy 2 — Playwright (real headless browser)
// Works on: Amazon, LinkedIn, Glassdoor, JS-heavy sites
// Setup:  npm install playwright
//         npx playwright install chromium
// ─────────────────────────────────────────────────────────────

async function fetchWithPlaywright(url) {
  let playwright;
  try {
    playwright = require("playwright");
  } catch (_) {
    console.log("Playwright not installed — skipping");
    return null;
  }

  let browser = null;
  try {
    browser = await playwright.chromium.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-blink-features=AutomationControlled",
        "--disable-web-security",
      ],
    });

    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      viewport: { width: 1366, height: 768 },
      locale: "en-US",
      extraHTTPHeaders: { "Accept-Language": "en-US,en;q=0.9" },
    });

    const page = await context.newPage();

    await page.addInitScript(() => {
      Object.defineProperty(navigator, "webdriver", { get: () => false });
    });

    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(2500);

    const html = await page.content();
    console.log("Playwright fetch success");
    return html;
  } catch (err) {
    console.log(`Playwright error: ${err.message}`);
    return null;
  } finally {
    if (browser) await browser.close();
  }
}

// ─────────────────────────────────────────────────────────────
// Smart Fetch — HTTP first, Playwright as fallback
// ─────────────────────────────────────────────────────────────

const NEEDS_PLAYWRIGHT = ["linkedin.com", "amazon.jobs", "glassdoor.com"];

async function smartFetch(url) {
  const needsBrowser = NEEDS_PLAYWRIGHT.some((d) => url.toLowerCase().includes(d));

  if (needsBrowser) {
    console.log(`Using Playwright for bot-protected site: ${url}`);
    const html = await fetchWithPlaywright(url);
    if (html) return html;
    throw new Error(
      "This site blocks direct requests. Options:\n" +
      "1. Run: npm install playwright && npx playwright install chromium\n" +
      "2. Or paste the job description text directly"
    );
  }

  const html = await fetchWithHeaders(url);
  if (html) return html;

  console.log("HTTP failed — trying Playwright fallback");
  const playwrightHtml = await fetchWithPlaywright(url);
  if (playwrightHtml) return playwrightHtml;

  throw new Error(
    "Unable to fetch the job page. Please paste the job description text directly."
  );
}

// ─────────────────────────────────────────────────────────────
// Layer 1 : JSON-LD Extraction
// ─────────────────────────────────────────────────────────────

function extractFromJsonLD(html) {
  const results = [];
  const regex =
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;

  let match;
  while ((match = regex.exec(html)) !== null) {
    try {
      const json = JSON.parse(match[1].trim());
      const items = Array.isArray(json) ? json : [json];
      for (const item of items) {
        if (item["@type"] === "JobPosting") results.push(item);
      }
    } catch (_) {}
  }

  if (!results.length) return null;
  const job = results[0];

  let salary = null;
  if (job.baseSalary) {
    const bs = job.baseSalary;
    if (typeof bs === "string") {
      salary = bs;
    } else if (bs.value) {
      const v = bs.value;
      if (v.minValue && v.maxValue) {
        salary = `${bs.currency || ""} ${v.minValue} - ${v.maxValue} / ${v.unitText || "Year"}`.trim();
      } else if (v.value) {
        salary = `${bs.currency || ""} ${v.value}`.trim();
      }
    }
  }

  let location = null;
  if (job.jobLocation) {
    const loc = Array.isArray(job.jobLocation) ? job.jobLocation[0] : job.jobLocation;
    if (loc?.address) {
      const a = loc.address;
      location = [a.streetAddress, a.addressLocality, a.addressRegion, a.addressCountry]
        .filter(Boolean)
        .join(", ");
    }
  }

  let skills = [];
  if (job.skills) {
    skills = typeof job.skills === "string"
      ? job.skills.split(/[,;|]/).map((s) => s.trim()).filter(Boolean)
      : Array.isArray(job.skills) ? job.skills : [];
  }

  return {
    title: job.title || job.name || null,
    company: job.hiringOrganization?.name || null,
    location,
    salary,
    experience: job.experienceRequirements?.monthsOfExperience
      ? `${Math.round(job.experienceRequirements.monthsOfExperience / 12)} years`
      : typeof job.experienceRequirements === "string"
      ? job.experienceRequirements
      : null,
    employmentType: job.employmentType || null,
    workMode: job.jobLocationType === "TELECOMMUTE" ? "Remote" : null,
    education:
      job.educationRequirements?.credentialCategory ||
      (typeof job.educationRequirements === "string" ? job.educationRequirements : null),
    skills,
    description: stripHtml(job.description)?.substring(0, 800) || null,
    responsibilities: [],
    requirements: job.qualifications ? [stripHtml(job.qualifications)] : [],
    benefits: job.jobBenefits
      ? typeof job.jobBenefits === "string"
        ? job.jobBenefits.split(/[,;]/).map((i) => i.trim()).filter(Boolean)
        : job.jobBenefits
      : [],
    postedDate: job.datePosted || null,
    applyUrl: job.url || job.sameAs || null,
    source: detectSource(html),
    _method: "json-ld",
  };
}

// ─────────────────────────────────────────────────────────────
// Layer 2 : Meta Tags Extraction
// ─────────────────────────────────────────────────────────────

function extractFromMetaTags(html) {
  const getMeta = (name) =>
    firstMatch(
      html,
      new RegExp(`<meta[^>]+(?:name|property)=["']${name}["'][^>]+content=["']([^"']+)["']`, "i"),
      new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:name|property)=["']${name}["']`, "i")
    );

  const title =
    getMeta("og:title") ||
    getMeta("twitter:title") ||
    firstMatch(html, /<title[^>]*>([^<]+)<\/title>/i);

  const description =
    getMeta("og:description") ||
    getMeta("twitter:description") ||
    getMeta("description");

  const company = getMeta("og:site_name") || getMeta("author");

  const applyUrl =
    getMeta("og:url") ||
    firstMatch(html, /rel=["']canonical["'][^>]+href=["']([^"']+)["']/i) ||
    firstMatch(html, /href=["']([^"']+)["'][^>]+rel=["']canonical["']/i);

  if (!title && !description) return null;

  return {
    title: title ? stripHtml(title) : null,
    company: company ? stripHtml(company) : null,
    location: null,
    salary: null,
    experience: null,
    employmentType: null,
    workMode: null,
    education: null,
    skills: [],
    description: description ? stripHtml(description)?.substring(0, 800) : null,
    responsibilities: [],
    requirements: [],
    benefits: [],
    postedDate: null,
    applyUrl,
    source: null,
    _method: "meta-tags",
  };
}

// ─────────────────────────────────────────────────────────────
// Layer 3 : HTML Selector / Pattern Extraction
// ─────────────────────────────────────────────────────────────

function extractFromHTML(html, source) {
  let title = null;
  let company = null;
  let location = null;
  let salary = null;
  let experience = null;
  let employmentType = null;
  let workMode = null;
  let education = null;
  let skills = [];
  let description = null;
  let responsibilities = [];
  let requirements = [];
  let benefits = [];
  let postedDate = null;
  let applyUrl = null;

  // Generic patterns
  title = firstMatch(html,
    /<h1[^>]*class="[^"]*(?:job[-_]?title|position|role)[^"]*"[^>]*>([^<]+)<\/h1>/i,
    /<h1[^>]*>([^<]{5,100})<\/h1>/i
  );
  company = firstMatch(html,
    /class="[^"]*(?:company[-_]?name|employer|org[-_]?name|hiring[-_]?org)[^"]*"[^>]*>([^<]{2,80})</i,
    /data-company=["']([^"']+)["']/i
  );
  location = firstMatch(html,
    /class="[^"]*(?:job[-_]?location|location|city)[^"]*"[^>]*>([^<]{2,100})</i,
    /(?:Location|Place of Work)[^:]*:\s*<\/[^>]+>\s*([^<]{2,100})/i,
    /data-location=["']([^"']+)["']/i
  );
  salary = firstMatch(html,
    /([\u20B9$\u00A3\u20AC]\s*[\d,.]+\s*(?:[-\u2013]\s*[\u20B9$\u00A3\u20AC]\s*[\d,.]+)?\s*(?:LPA|L\/A|Lakhs?|per\s+annum|\/year|CTC|\/month)?)/i,
    /(\d+(?:\.\d+)?\s*(?:LPA|L\/A|Lakhs?)\s*(?:[-\u2013]\s*\d+(?:\.\d+)?\s*(?:LPA|L\/A|Lakhs?))?)/i,
    /(?:Salary|CTC|Package|Stipend)[^:]*:\s*([^<\n]{3,60})/i,
    /class="[^"]*(?:salary|ctc|compensation|stipend)[^"]*"[^>]*>([^<]{3,60})</i
  );
  experience = firstMatch(html,
    /(\d+\s*[-\u2013]\s*\d+\s*(?:years?|yrs?))/i,
    /(\d+\+?\s*(?:years?|yrs?)\s*(?:of\s+)?(?:experience|exp)?)/i,
    /(?:Experience|Exp)[^:]*:\s*([^<\n]{2,50})/i
  );
  employmentType = firstMatch(html,
    /(?:Job\s*Type|Employment\s*Type|Contract\s*Type)[^:]*:\s*([^<\n]{2,40})/i,
    /\b(Full[\s-]?Time|Part[\s-]?Time|Contract|Freelance|Internship|Permanent|Temporary)\b/i
  );
  workMode = firstMatch(html,
    /(?:Work\s*Mode|Work\s*Type|Job\s*Mode)[^:]*:\s*([^<\n]{2,30})/i,
    /\b(Remote|Work\s*from\s*Home|WFH|Hybrid|On[\s-]?site|In[\s-]?Office)\b/i
  );
  education = firstMatch(html,
    /(?:Education|Qualification|Degree)[^:]*:\s*([^<\n]{3,80})/i,
    /\b(B\.?Tech|B\.?E\.?|M\.?Tech|M\.?E\.?|BCA|MCA|B\.?Sc|M\.?Sc|MBA|B\.?Com|Graduation|Bachelor|Master|PhD)\b/i
  );
  postedDate = firstMatch(html,
    /(?:Posted|Date Posted|Published)[^:]*:\s*([^<\n]{3,40})/i,
    /<time[^>]*datetime=["']([^"']+)["']/i
  );
  applyUrl = firstMatch(html,
    /<a[^>]+href=["']([^"']+)["'][^>]*>(?:[^<]*Apply[^<]*)<\/a>/i,
    /data-apply-url=["']([^"']+)["']/i
  );

  // Site-specific overrides
  if (source === "Amazon") {
    title = title || firstMatch(html, /class="[^"]*job-title[^"]*"[^>]*>([^<]+)</i, /"title"\s*:\s*"([^"]+)"/);
    company = "Amazon";
    location = location || firstMatch(html, /class="[^"]*location[^"]*"[^>]*>([^<]+)</i, /"location"\s*:\s*"([^"]+)"/);
    employmentType = employmentType || firstMatch(html, /"employmentType"\s*:\s*"([^"]+)"/);
  }
  if (source === "Naukri") {
    title = title || firstMatch(html, /class="[^"]*jd-header-title[^"]*"[^>]*>([^<]+)</i, /"jobTitle"\s*:\s*"([^"]+)"/);
    company = company || firstMatch(html, /class="[^"]*jd-header-comp-name[^"]*"[^>]*>([^<]+)</i, /"companyName"\s*:\s*"([^"]+)"/);
    location = location || firstMatch(html, /class="[^"]*loc[^"]*"[^>]*>([^<]+)</i, /"location"\s*:\s*"([^"]+)"/);
    salary = salary || firstMatch(html, /"salary"\s*:\s*"([^"]+)"/);
    experience = experience || firstMatch(html, /"experience"\s*:\s*"([^"]+)"/);
  }
  if (source === "LinkedIn") {
    title = title || firstMatch(html, /class="[^"]*top-card-layout__title[^"]*"[^>]*>([^<]+)</i);
    company = company || firstMatch(html, /class="[^"]*topcard__org-name-link[^"]*"[^>]*>([^<]+)</i);
    location = location || firstMatch(html, /class="[^"]*topcard__flavor--bullet[^"]*"[^>]*>([^<]+)</i);
  }
  if (source === "Internshala") {
    title = title || firstMatch(html, /class="[^"]*profile[^"]*"[^>]*>([^<]+)</i);
    company = company || firstMatch(html, /class="[^"]*company-name[^"]*"[^>]*>([^<]+)</i);
    salary = salary || firstMatch(html, /class="[^"]*stipend[^"]*"[^>]*>([^<]+)</i);
    location = location || firstMatch(html, /class="[^"]*location_link[^"]*"[^>]*>([^<]+)</i);
  }
  if (source === "Indeed") {
    title = title || firstMatch(html, /class="[^"]*jobsearch-JobInfoHeader-title[^"]*"[^>]*>([^<]+)</i);
    company = company || firstMatch(html, /class="[^"]*jobsearch-InlineCompanyRating[^"]*"[^>]*>([^<]+)</i);
  }
  if (source === "Glassdoor") {
    title = title || firstMatch(html, /class="[^"]*job-title[^"]*"[^>]*>([^<]+)</i);
    company = company || firstMatch(html, /class="[^"]*employer-name[^"]*"[^>]*>([^<]+)</i);
  }
  if (source === "AmbitionBox") {
    title = title || firstMatch(html, /class="[^"]*designation[^"]*"[^>]*>([^<]+)</i);
    company = company || firstMatch(html, /class="[^"]*company-name[^"]*"[^>]*>([^<]+)</i);
    salary = salary || firstMatch(html, /class="[^"]*salary[^"]*"[^>]*>([^<]+)</i);
  }

  // Skills
  const skillsRaw = firstMatch(html,
    /data-skills?=["']([^"']+)["']/i,
    /"keySkills"\s*:\s*"([^"]+)"/,
    /"skills"\s*:\s*\[([^\]]+)\]/
  );
  if (skillsRaw) {
    skills = skillsRaw.replace(/["']/g, "").split(/[,;|]/).map((s) => s.trim()).filter(Boolean);
  }
  if (skills.length === 0) {
    const kwList = [
      "JavaScript","TypeScript","Python","Java","C\\+\\+","C#","Go","Rust","PHP","Ruby","Swift","Kotlin",
      "React","Angular","Vue\\.js","Node\\.js","Express","Django","Flask","Spring Boot","Laravel","FastAPI",
      "MongoDB","MySQL","PostgreSQL","Redis","Firebase","Supabase","DynamoDB","Elasticsearch",
      "AWS","Azure","GCP","Docker","Kubernetes","Terraform","Git","Linux","Jenkins","GitHub Actions",
      "REST API","GraphQL","gRPC","Tailwind","Bootstrap","Next\\.js","Nuxt\\.js",
      "Machine Learning","Deep Learning","TensorFlow","PyTorch","NLP","LangChain",
      "Figma","Adobe XD","MERN","MEAN","DevOps","CI/CD","Agile","Scrum",
    ];
    skills = kwList
      .filter((kw) => new RegExp("\\b" + kw + "\\b", "i").test(html))
      .map((kw) => kw.replace(/\\/g, ""));
  }

  // Description block
  const descBlock = firstMatch(html,
    /class="[^"]*(?:job[-_]?desc(?:ription)?|jd[-_]?content|description[-_]?content)[^"]*"[^>]*>([\s\S]{100,3000}?)<\/(?:div|section)/i,
    /id="[^"]*(?:job[-_]?desc(?:ription)?|description)[^"]*"[^>]*>([\s\S]{100,3000}?)<\/(?:div|section)/i
  );
  if (descBlock) description = stripHtml(descBlock)?.substring(0, 800) || null;

  // Responsibilities
  const respSection = firstMatch(html,
    /(?:Responsibilities|What you.ll do|Key Duties|Your Role)[^<]*<\/[^>]+>([\s\S]{0,2000}?)(?=<h[1-4]|Requirement|Qualification|$)/i
  );
  if (respSection) {
    responsibilities = allMatches(respSection, /<li[^>]*>([\s\S]*?)<\/li>/gi)
      .map(stripHtml).filter((s) => s && s.length > 5).slice(0, 12);
  }

  // Requirements
  const reqSection = firstMatch(html,
    /(?:Requirements?|Qualifications?|What we.re looking for|Must Have|Skills Required)[^<]*<\/[^>]+>([\s\S]{0,2000}?)(?=<h[1-4]|Responsibilit|Benefit|$)/i
  );
  if (reqSection) {
    requirements = allMatches(reqSection, /<li[^>]*>([\s\S]*?)<\/li>/gi)
      .map(stripHtml).filter((s) => s && s.length > 5).slice(0, 12);
  }

  // Benefits
  const benSection = firstMatch(html,
    /(?:Benefits?|Perks?|What we offer|Why join us)[^<]*<\/[^>]+>([\s\S]{0,1500}?)(?=<h[1-4]|$)/i
  );
  if (benSection) {
    benefits = allMatches(benSection, /<li[^>]*>([\s\S]*?)<\/li>/gi)
      .map(stripHtml).filter((s) => s && s.length > 3).slice(0, 8);
  }

  if (!title && !company && !location && !salary) return null;

  return {
    title: title ? stripHtml(title) : null,
    company: company ? stripHtml(company) : null,
    location: location ? stripHtml(location) : null,
    salary: salary ? stripHtml(salary) : null,
    experience: experience ? stripHtml(experience) : null,
    employmentType: employmentType ? stripHtml(employmentType) : null,
    workMode: workMode ? stripHtml(workMode) : null,
    education: education ? stripHtml(education) : null,
    skills,
    description,
    responsibilities,
    requirements,
    benefits,
    postedDate: postedDate ? stripHtml(postedDate) : null,
    applyUrl,
    source: null,
    _method: "html-selectors",
  };
}

// ─────────────────────────────────────────────────────────────
// Layer 4 : Gemini AI Extraction
// ─────────────────────────────────────────────────────────────

async function extractWithAI(content, source) {
  const prompt = `You are an expert Job Data Extractor.

The input may be HTML source, plain text, or copied job description.
Extract ALL available job information and return ONLY valid JSON.
No markdown, no explanation, no code fences — just raw JSON.

{
  "title": null,
  "company": null,
  "location": null,
  "salary": null,
  "experience": null,
  "employmentType": null,
  "workMode": null,
  "education": null,
  "skills": [],
  "description": null,
  "responsibilities": [],
  "requirements": [],
  "benefits": [],
  "postedDate": null,
  "applyUrl": null,
  "source": "${source || ""}"
}

Rules:
- Return only JSON, nothing else.
- Use null if value is unavailable.
- skills, responsibilities, requirements, benefits must be arrays.
- For location extract city, state, country.
- For salary include currency and period.
- For experience use "X years" or "X-Y years" format.

Content:

${content.substring(0, 15000)}`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });

  const raw = response.text;
  const clean = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
  const data = JSON.parse(clean);
  data._method = "ai";
  return data;
}

// ─────────────────────────────────────────────────────────────
// Main Function
// ─────────────────────────────────────────────────────────────

// Input formats accepted:
//   { url, html }  — frontend ne HTML pehle se fetch kar ke bheja (CORS proxy)
//   { url }        — server smartFetch karega (HTTP -> Playwright)
//   { text }       — copied job description / plain text
//   "string"       — URL ya plain text

async function extractJobData(input) {
  let content = "";
  let originalUrl = "";

  if (input && typeof input === "object") {
    originalUrl = input.url || "";
    content = input.html || input.text || "";
    if (!content && originalUrl) {
      content = await smartFetch(originalUrl);
    }
  } else if (typeof input === "string") {
    const isUrl = /^https?:\/\//i.test(input.trim());
    if (isUrl) {
      originalUrl = input.trim();
      content = await smartFetch(originalUrl);
    } else {
      content = input;
    }
  }

  if (!content) {
    throw new Error("No content to parse. Provide a URL or paste the job description.");
  }

  const source = detectSource(originalUrl) || detectSource(content) || "Unknown";
  const usedLayers = [];
  let result = null;

  // Layer 1: JSON-LD
  const jsonLD = extractFromJsonLD(content);
  if (jsonLD && jsonLD.title) {
    result = jsonLD;
    result.source = result.source || source;
    usedLayers.push("json-ld");
  }

  // Layer 2: Meta Tags
  const metaData = extractFromMetaTags(content);
  if (metaData) {
    result = result ? mergeData(result, metaData) : { ...metaData, source };
    if (!usedLayers.includes("meta")) usedLayers.push("meta");
  }

  // Layer 3: HTML Selectors
  const htmlData = extractFromHTML(content, source);
  if (htmlData) {
    result = result ? mergeData(result, htmlData) : { ...htmlData, source };
    if (!usedLayers.includes("html")) usedLayers.push("html");
  }

  // Layer 4: AI — when key fields are still missing
  const needsAI =
    !result ||
    !result.title ||
    !result.description ||
    !result.company ||
    result.skills.length === 0 ||
    result.responsibilities.length === 0;

  if (needsAI) {
    try {
      const aiData = await extractWithAI(content, source);
      result = result ? mergeData(result, aiData) : { ...aiData, source };
      usedLayers.push("ai");
    } catch (err) {
      console.error("AI extraction failed:", err.message);
      if (!result) throw new Error("All extraction layers failed.");
    }
  }

  // Final cleanup
  result._method = usedLayers.join("+");
  result.source = result.source || source;

  for (const key of ["skills", "responsibilities", "requirements", "benefits"]) {
    if (!Array.isArray(result[key])) result[key] = [];
  }
  for (const key of Object.keys(result)) {
    if (result[key] === "") result[key] = null;
  }

  return result;
}

module.exports = { extractJobData };