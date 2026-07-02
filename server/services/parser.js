const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// ─────────────────────────────────────────────────────────────
// GARBAGE VALIDATOR — Root cause fix for wrong values
// Rejects: image URLs, JSON blobs, raw HTML attributes
// ─────────────────────────────────────────────────────────────

function isGarbage(val) {
  if (!val || typeof val !== "string") return true;
  const v = val.trim();
  if (v.length === 0) return true;
  if (/^https?:\/\//i.test(v)) return true;           // http://...
  if (/^\/\/[a-z]/i.test(v)) return true;             // //static.ambitionbox.com/...
  if (/\.(png|jpg|jpeg|svg|gif|webp|ico)/i.test(v)) return true;  // image path
  if (v.includes('{"') || v.includes('"name"') || v.includes('"count"')) return true; // JSON
  if (v.startsWith("{") || v.startsWith("[")) return true;
  if (v.includes("data-testid") || v.includes("truncate")) return true; // raw HTML
  if (v.includes("class=") || v.includes("href=") || v.includes("src=")) return true;
  if (v.includes("<") && v.includes(">")) return true;
  if (v.length > 120) return true;
  return false;
}

function clean(val) {
  if (!val) return null;
  const v = typeof val === "string" ? val : String(val);
  const stripped = v
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, " ")
    .trim();
  return isGarbage(stripped) ? null : stripped;
}

const stripHtml = clean;

function firstMatch(html, ...patterns) {
  for (const p of patterns) {
    const m = html.match(p);
    if (m && m[1]) {
      const v = m[1].trim();
      if (!isGarbage(v)) return v;
    }
  }
  return null;
}

function allMatches(html, pattern) {
  const results = [];
  let m;
  const r = new RegExp(pattern.source, pattern.flags);
  while ((m = r.exec(html)) !== null) {
    if (m[1]) results.push(m[1].trim());
  }
  return results;
}

function detectSource(input) {
  if (!input) return "Unknown";
  const l = input.toLowerCase();
  if (l.includes("amazon.jobs")) return "Amazon";
  if (l.includes("ambitionbox")) return "AmbitionBox";
  if (l.includes("linkedin")) return "LinkedIn";
  if (l.includes("naukri")) return "Naukri";
  if (l.includes("indeed")) return "Indeed";
  if (l.includes("internshala")) return "Internshala";
  if (l.includes("foundit")) return "Foundit";
  if (l.includes("glassdoor")) return "Glassdoor";
  if (l.includes("shine.com")) return "Shine";
  if (l.includes("monster")) return "Monster";
  if (l.includes("unstop")) return "Unstop";
  if (l.includes("wellfound")) return "Wellfound";
  if (l.includes("hirist")) return "HiRist";
  if (l.includes("cutshort")) return "Cutshort";
  if (l.includes("angel") || l.includes("angellist")) return "AngelList";
  return "Unknown";
}

function mergeData(base, extra) {
  if (!extra) return base;
  const result = { ...base };
  for (const key of Object.keys(extra)) {
    if (key === "_method") continue;
    const bv = result[key];
    const ev = extra[key];
    if (Array.isArray(bv)) result[key] = bv.length ? bv : (ev || []);
    else result[key] = bv || ev || null;
  }
  return result;
}

// ─────────────────────────────────────────────────────────────
// Fetch Strategy 1 — HTTP with browser headers
// ─────────────────────────────────────────────────────────────

async function fetchWithHeaders(url) {
  const uas = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  ];
  for (const ua of uas) {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": ua,
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
          "Cache-Control": "no-cache",
          "Upgrade-Insecure-Requests": "1",
          "Sec-Fetch-Dest": "document",
          "Sec-Fetch-Mode": "navigate",
          "Sec-Fetch-Site": "none",
        },
      });
      if (res.ok) { console.log("HTTP fetch success"); return await res.text(); }
      console.log("HTTP " + res.status + " from " + url);
    } catch (e) { console.log("HTTP error: " + e.message); }
  }
  return null;
}

// ─────────────────────────────────────────────────────────────
// Fetch Strategy 2 — Playwright (real browser)
// npm install playwright && npx playwright install chromium
// ─────────────────────────────────────────────────────────────

async function fetchWithPlaywright(url) {
  let pw;
  try { pw = require("playwright"); }
  catch (_) { console.log("Playwright not installed"); return null; }

  let browser = null;
  try {
    browser = await pw.chromium.launch({
      headless: true,
      args: ["--no-sandbox","--disable-setuid-sandbox","--disable-blink-features=AutomationControlled"],
    });
    const ctx = await browser.newContext({
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      viewport: { width: 1366, height: 768 },
      locale: "en-US",
    });
    const page = await ctx.newPage();
    await page.addInitScript(() => { Object.defineProperty(navigator, "webdriver", { get: () => false }); });
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(2500);
    const html = await page.content();
    console.log("Playwright fetch success");
    return html;
  } catch (e) { console.log("Playwright error: " + e.message); return null; }
  finally { if (browser) await browser.close(); }
}

const NEEDS_PLAYWRIGHT = ["linkedin.com", "amazon.jobs", "glassdoor.com"];

async function smartFetch(url) {
  const needsBrowser = NEEDS_PLAYWRIGHT.some((d) => url.toLowerCase().includes(d));
  if (needsBrowser) {
    const html = await fetchWithPlaywright(url);
    if (html) return html;
    throw new Error("Bot-protected site. Run: npm install playwright && npx playwright install chromium\nOr paste the job description directly.");
  }
  const html = await fetchWithHeaders(url);
  if (html) return html;
  const ph = await fetchWithPlaywright(url);
  if (ph) return ph;
  throw new Error("Unable to fetch page. Please paste the job description text directly.");
}

// ─────────────────────────────────────────────────────────────
// Layer 1 : JSON-LD
// ─────────────────────────────────────────────────────────────

function extractFromJsonLD(html) {
  const results = [];
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    try {
      const j = JSON.parse(m[1].trim());
      for (const item of (Array.isArray(j) ? j : [j])) {
        if (item["@type"] === "JobPosting") results.push(item);
      }
    } catch (_) {}
  }
  if (!results.length) return null;
  const job = results[0];

  let salary = null;
  if (job.baseSalary) {
    const bs = job.baseSalary;
    if (typeof bs === "string") salary = bs;
    else if (bs.value) {
      const v = bs.value;
      if (v.minValue && v.maxValue) salary = ((bs.currency || "") + " " + v.minValue + " - " + v.maxValue + " / " + (v.unitText || "Year")).trim();
      else if (v.value) salary = ((bs.currency || "") + " " + v.value).trim();
    }
  }

  let location = null;
  if (job.jobLocation) {
    const loc = Array.isArray(job.jobLocation) ? job.jobLocation[0] : job.jobLocation;
    if (loc?.address) {
      const a = loc.address;
      location = [a.streetAddress, a.addressLocality, a.addressRegion, a.addressCountry].filter(Boolean).join(", ");
    }
  }

  let skills = [];
  if (job.skills) {
    skills = typeof job.skills === "string"
      ? job.skills.split(/[,;|]/).map((s) => s.trim()).filter(Boolean)
      : Array.isArray(job.skills) ? job.skills : [];
  }

  // Experience — reject objects
  let experience = null;
  if (job.experienceRequirements?.monthsOfExperience) {
    experience = Math.round(job.experienceRequirements.monthsOfExperience / 12) + " years";
  } else if (typeof job.experienceRequirements === "string") {
    experience = job.experienceRequirements;
  }
  if (isGarbage(experience)) experience = null;

  // Education — only string, not object
  let education = null;
  if (typeof job.educationRequirements?.credentialCategory === "string") {
    education = job.educationRequirements.credentialCategory;
  } else if (typeof job.educationRequirements === "string") {
    education = job.educationRequirements;
  }
  if (isGarbage(education)) education = null;

  // employmentType — reject image URLs
  let employmentType = typeof job.employmentType === "string" ? job.employmentType : null;
  if (isGarbage(employmentType)) employmentType = null;

  return {
    title: clean(job.title || job.name),
    company: clean(job.hiringOrganization?.name),
    location: clean(location),
    salary: clean(salary),
    experience,
    employmentType,
    workMode: job.jobLocationType === "TELECOMMUTE" ? "Remote" : null,
    education,
    skills,
    description: clean(job.description)?.substring(0, 800) || null,
    responsibilities: [],
    requirements: job.qualifications ? [clean(job.qualifications)].filter(Boolean) : [],
    benefits: job.jobBenefits
      ? (typeof job.jobBenefits === "string"
          ? job.jobBenefits.split(/[,;]/).map((i) => i.trim()).filter(Boolean)
          : Array.isArray(job.jobBenefits) ? job.jobBenefits : [])
      : [],
    postedDate: clean(job.datePosted),
    applyUrl: clean(job.url || job.sameAs),
    source: detectSource(html),
    _method: "json-ld",
  };
}

// ─────────────────────────────────────────────────────────────
// Layer 2 : Meta Tags
// ─────────────────────────────────────────────────────────────

function extractFromMetaTags(html) {
  const getMeta = (name) => {
    const v = firstMatch(
      html,
      new RegExp('<meta[^>]+(?:name|property)=["\']('+name+')["\'][^>]+content=["\']((?:[^"\']{1,300}))["\']', "i"),
      new RegExp('<meta[^>]+content=["\']((?:[^"\']{1,300}))["\'][^>]+(?:name|property)=["\']('+name+')["\']', "i")
    );
    // firstMatch returns m[1] but for two-group patterns we need the content group
    return v;
  };

  const title = firstMatch(html,
    /<meta[^>]+(?:name|property)=["']og:title["'][^>]+content=["']([^"']{3,150})["']/i,
    /<meta[^>]+content=["']([^"']{3,150})["'][^>]+(?:name|property)=["']og:title["']/i,
    /<meta[^>]+(?:name|property)=["']twitter:title["'][^>]+content=["']([^"']{3,150})["']/i,
    /<title[^>]*>([^<]{3,150})<\/title>/i
  );
  const description = firstMatch(html,
    /<meta[^>]+(?:name|property)=["']og:description["'][^>]+content=["']([^"']{3,500})["']/i,
    /<meta[^>]+content=["']([^"']{3,500})["'][^>]+(?:name|property)=["']og:description["']/i,
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']{3,500})["']/i,
    /<meta[^>]+content=["']([^"']{3,500})["'][^>]+name=["']description["']/i
  );
  const company = firstMatch(html,
    /<meta[^>]+(?:name|property)=["']og:site_name["'][^>]+content=["']([^"']{2,80})["']/i,
    /<meta[^>]+content=["']([^"']{2,80})["'][^>]+(?:name|property)=["']og:site_name["']/i
  );
  const applyUrl = firstMatch(html,
    /<meta[^>]+(?:name|property)=["']og:url["'][^>]+content=["']([^"']+)["']/i,
    /rel=["']canonical["'][^>]+href=["']([^"']+)["']/i,
    /href=["']([^"']+)["'][^>]+rel=["']canonical["']/i
  );

  if (!title && !description) return null;
  return {
    title: clean(title),
    company: clean(company),
    location: null, salary: null, experience: null,
    employmentType: null, workMode: null, education: null,
    skills: [],
    description: description ? clean(description)?.substring(0, 800) : null,
    responsibilities: [], requirements: [], benefits: [],
    postedDate: null,
    applyUrl: applyUrl || null,
    source: null,
    _method: "meta-tags",
  };
}

// ─────────────────────────────────────────────────────────────
// Layer 3 : HTML Selectors
// ─────────────────────────────────────────────────────────────

function extractFromHTML(html, source) {
  let title = null, company = null, location = null, salary = null;
  let experience = null, employmentType = null, workMode = null, education = null;
  let skills = [], description = null;
  let responsibilities = [], requirements = [], benefits = [];
  let postedDate = null, applyUrl = null;

  // Generic
  title = firstMatch(html,
    /<h1[^>]*class="[^"]*(?:job[-_]?title|position|role)[^"]*"[^>]*>([^<]{3,100})<\/h1>/i,
    /<h1[^>]*>([^<]{3,100})<\/h1>/i
  );
  company = firstMatch(html,
    /class="[^"]*(?:company[-_]?name|employer[-_]?name|org[-_]?name)[^"]*"[^>]*>([^<]{2,80})</i,
    /data-company=["']([^"']{2,80})["']/i
  );
  location = firstMatch(html,
    /class="[^"]*(?:job[-_]?location|work[-_]?location)[^"]*"[^>]*>([^<]{2,80})</i,
    /data-location=["']([^"']{2,80})["']/i,
    /Location\s*[:\-]\s*([A-Za-z][^<\n,]{2,60}(?:,\s*[A-Za-z][^<\n]{2,40})*)/i
  );
  salary = firstMatch(html,
    /([\u20B9]\s*[\d,.]+(?:\s*[-\u2013]\s*[\u20B9]?\s*[\d,.]+)?\s*(?:LPA|L\/A|Lakhs?|per\s+annum|CTC)?)/,
    /(\d+(?:\.\d+)?\s*(?:LPA|L\/A|Lakhs?)\s*(?:[-\u2013]\s*\d+(?:\.\d+)?\s*(?:LPA|L\/A|Lakhs?))?)/i,
    /(?:Salary|CTC|Package|Stipend)\s*[:\-]\s*([\u20B9$]?\s*[^<\n]{3,50})/i
  );
  experience = firstMatch(html,
    /\b(\d+\s*[-\u2013]\s*\d+\s*(?:years?|yrs?))\b/i,
    /\b(\d+\+?\s*(?:years?|yrs?)\s*(?:of\s+)?(?:experience|exp)?)\b/i,
    /(?:Experience|Exp)\s*[:\-]\s*([^<\n]{2,40})/i
  );
  employmentType = firstMatch(html,
    /(?:Job\s*Type|Employment\s*Type)\s*[:\-]\s*([A-Za-z][^<\n]{2,30})/i,
    /\b(Full[\s-]?Time|Part[\s-]?Time|Contract|Freelance|Internship|Permanent|Temporary)\b/i
  );
  workMode = firstMatch(html,
    /(?:Work\s*Mode|Work\s*Type)\s*[:\-]\s*([A-Za-z][^<\n]{2,20})/i,
    /\b(Remote|Work\s*from\s*Home|WFH|Hybrid|On[\s-]?site|In[\s-]?Office)\b/i
  );
  education = firstMatch(html,
    /(?:Education|Qualification|Degree)\s*[:\-]\s*([A-Za-z][^<\n]{3,60})/i,
    /\b(B\.?Tech|B\.?E\.?|M\.?Tech|M\.?E\.?|BCA|MCA|B\.?Sc|M\.?Sc|MBA|B\.?Com|Graduation|Bachelor|Master|PhD|Diploma)\b/i
  );
  postedDate = firstMatch(html,
    /<time[^>]+datetime=["']([0-9T:\-+Z]{6,30})["']/i,
    /(?:Posted|Published)\s*[:\-]\s*(\d{1,2}[\s\/\-]\w+[\s\/\-]\d{2,4})/i,
    /(?:Posted|Published)\s*[:\-]\s*(\d+\s*(?:hours?|days?|weeks?|months?)\s*ago)/i
  );
  applyUrl = firstMatch(html,
    /<a[^>]+href=["'](https?:[^"']{5,200})["'][^>]*>\s*[^<]*Apply[^<]*<\/a>/i,
    /data-apply-url=["'](https?:[^"']+)["']/i
  );

  // Site-specific
  if (source === "Amazon") {
    title = title || firstMatch(html, /class="[^"]*job-title[^"]*"[^>]*>([^<]{3,100})</i, /"title"\s*:\s*"([^"]{3,100})"/);
    company = "Amazon";
    location = location || firstMatch(html, /class="[^"]*location[^"]*"[^>]*>([^<]{3,80})</i, /"location"\s*:\s*"([^"]{3,80})"/);
    employmentType = employmentType || firstMatch(html, /"employmentType"\s*:\s*"([^"]{2,30})"/);
  }
  if (source === "Naukri") {
    title = title || firstMatch(html, /class="[^"]*jd-header-title[^"]*"[^>]*>([^<]{3,100})</i, /"jobTitle"\s*:\s*"([^"]{3,100})"/);
    company = company || firstMatch(html, /class="[^"]*jd-header-comp-name[^"]*"[^>]*>([^<]{2,80})</i, /"companyName"\s*:\s*"([^"]{2,80})"/);
    location = location || firstMatch(html, /class="[^"]*loc\b[^"]*"[^>]*>([^<]{2,80})</i, /"location"\s*:\s*"([^"]{2,80})"/);
    salary = salary || firstMatch(html, /"salary"\s*:\s*"([^"]{2,60})"/);
    experience = experience || firstMatch(html, /"experience"\s*:\s*"([^"]{2,40})"/);
  }
  if (source === "LinkedIn") {
    title = title || firstMatch(html, /class="[^"]*top-card-layout__title[^"]*"[^>]*>([^<]{3,100})</i);
    company = company || firstMatch(html, /class="[^"]*topcard__org-name-link[^"]*"[^>]*>([^<]{2,80})</i);
    location = location || firstMatch(html, /class="[^"]*topcard__flavor--bullet[^"]*"[^>]*>([^<]{2,80})</i);
  }
  if (source === "Internshala") {
    title = title || firstMatch(html, /class="[^"]*profile[^"]*"[^>]*>([^<]{3,100})</i);
    company = company || firstMatch(html, /class="[^"]*company-name[^"]*"[^>]*>([^<]{2,80})</i);
    salary = salary || firstMatch(html, /class="[^"]*stipend[^"]*"[^>]*>([^<]{2,50})</i);
    location = location || firstMatch(html, /class="[^"]*location_link[^"]*"[^>]*>([^<]{2,80})</i);
  }
  if (source === "Indeed") {
    title = title || firstMatch(html, /class="[^"]*jobsearch-JobInfoHeader-title[^"]*"[^>]*>([^<]{3,100})</i);
    company = company || firstMatch(html, /class="[^"]*jobsearch-InlineCompanyRating[^"]*"[^>]*>([^<]{2,80})</i);
  }
  if (source === "Glassdoor") {
    title = title || firstMatch(html, /class="[^"]*job-title[^"]*"[^>]*>([^<]{3,100})</i);
    company = company || firstMatch(html, /class="[^"]*employer-name[^"]*"[^>]*>([^<]{2,80})</i);
  }
  if (source === "AmbitionBox") {
    title = title ||
      firstMatch(html, /data-testid=["']jd-job-title["'][^>]*>([^<]{3,100})/i) ||
      firstMatch(html, /class="[^"]*designation[^"]*"[^>]*>([^<]{3,100})</i);
    company = company ||
      firstMatch(html, /data-testid=["']jd-company-name["'][^>]*>([^<]{2,80})/i) ||
      firstMatch(html, /class="[^"]*company[-_]?name[^"]*"[^>]*>([^<]{2,80})</i);
    location = location ||
      firstMatch(html, /data-testid=["']jd-location["'][^>]*>([^<]{2,80})/i);
    // Salary: only numeric pattern like ₹3.7 - ₹8 LPA
    salary = salary ||
      firstMatch(html, /([\u20B9]\s*\d+(?:\.\d+)?\s*(?:[-\u2013]\s*[\u20B9]?\s*\d+(?:\.\d+)?)?\s*(?:LPA|L\/A|Lakhs?)?)/);
    experience = experience ||
      firstMatch(html, /data-testid=["']jd-experience["'][^>]*>([^<]{2,40})/i);
    // employmentType and workMode only from data-testid — never from generic regex on AmbitionBox
    employmentType = firstMatch(html, /data-testid=["']jd-employment-type["'][^>]*>([^<]{2,30})/i) || null;
    workMode = firstMatch(html, /data-testid=["']jd-work-mode["'][^>]*>([^<]{2,20})/i) || null;
  }
  if (source === "Foundit") {
    title = title || firstMatch(html, /class="[^"]*job[-_]?title[^"]*"[^>]*>([^<]{3,100})</i);
    company = company || firstMatch(html, /class="[^"]*company[-_]?name[^"]*"[^>]*>([^<]{2,80})</i);
    location = location || firstMatch(html, /class="[^"]*location[^"]*"[^>]*>([^<]{2,80})</i);
  }

  // Skills
  const skillsRaw = firstMatch(html,
    /data-skills?=["']([^"']{3,500})["']/i,
    /"keySkills"\s*:\s*"([^"]{3,500})"/,
    /"skills"\s*:\s*\[([^\]]{3,500})\]/
  );
  if (skillsRaw) {
    skills = skillsRaw.replace(/["']/g, "").split(/[,;|]/).map((s) => s.trim()).filter((s) => s.length > 1 && !isGarbage(s));
  }
  if (skills.length === 0) {
    const kws = [
      "JavaScript","TypeScript","Python","Java","C\\+\\+","C#","Go","Rust","PHP","Ruby","Swift","Kotlin",
      "React","Angular","Vue\\.js","Node\\.js","Express","Django","Flask","Spring Boot","Laravel","FastAPI",
      "MongoDB","MySQL","PostgreSQL","Redis","Firebase","Supabase","DynamoDB","Elasticsearch",
      "AWS","Azure","GCP","Docker","Kubernetes","Terraform","Git","Linux","Jenkins","GitHub Actions",
      "REST API","GraphQL","gRPC","Tailwind","Bootstrap","Next\\.js","Nuxt\\.js",
      "Machine Learning","Deep Learning","TensorFlow","PyTorch","NLP","LangChain",
      "Figma","Adobe XD","MERN","MEAN","DevOps","CI/CD","Agile","Scrum",
    ];
    skills = kws.filter((kw) => new RegExp("\\b" + kw + "\\b", "i").test(html)).map((kw) => kw.replace(/\\/g, ""));
  }

  // Description
  const db = firstMatch(html,
    /class="[^"]*(?:job[-_]?desc(?:ription)?|jd[-_]?content|description[-_]?content)[^"]*"[^>]*>([\s\S]{100,3000}?)<\/(?:div|section)/i
  );
  if (db) description = clean(db)?.substring(0, 800) || null;

  // Responsibilities
  const rs = firstMatch(html, /(?:Responsibilities|What you.ll do|Key Duties)[^<]*<\/[^>]+>([\s\S]{0,2000}?)(?=<h[1-4]|Requirement|$)/i);
  if (rs) responsibilities = allMatches(rs, /<li[^>]*>([\s\S]*?)<\/li>/gi).map(clean).filter((s) => s && s.length > 5 && !isGarbage(s)).slice(0, 12);

  // Requirements
  const rq = firstMatch(html, /(?:Requirements?|Qualifications?|Must Have)[^<]*<\/[^>]+>([\s\S]{0,2000}?)(?=<h[1-4]|Benefit|$)/i);
  if (rq) requirements = allMatches(rq, /<li[^>]*>([\s\S]*?)<\/li>/gi).map(clean).filter((s) => s && s.length > 5 && !isGarbage(s)).slice(0, 12);

  // Benefits
  const bn = firstMatch(html, /(?:Benefits?|Perks?|What we offer)[^<]*<\/[^>]+>([\s\S]{0,1500}?)(?=<h[1-4]|$)/i);
  if (bn) benefits = allMatches(bn, /<li[^>]*>([\s\S]*?)<\/li>/gi).map(clean).filter((s) => s && s.length > 3 && !isGarbage(s)).slice(0, 8);

  if (!title && !company && !location && !salary) return null;

  return {
    title: clean(title), company: clean(company), location: clean(location),
    salary: clean(salary), experience: clean(experience),
    employmentType: clean(employmentType), workMode: clean(workMode),
    education: clean(education), skills, description,
    responsibilities, requirements, benefits,
    postedDate: clean(postedDate), applyUrl: applyUrl || null,
    source: null, _method: "html-selectors",
  };
}

// ─────────────────────────────────────────────────────────────
// Layer 4 : Gemini AI
// ─────────────────────────────────────────────────────────────

async function extractWithAI(content, source) {
  const prompt = `You are an expert Job Data Extractor.
Input may be HTML, plain text, or copied job description.
Return ONLY valid JSON — no markdown, no explanation, no code fences.

{
  "title": null, "company": null, "location": null, "salary": null,
  "experience": null, "employmentType": null, "workMode": null,
  "education": null, "skills": [], "description": null,
  "responsibilities": [], "requirements": [], "benefits": [],
  "postedDate": null, "applyUrl": null, "source": "${source || ""}"
}

STRICT rules:
- ONLY return JSON.
- null if value not clearly available — never guess.
- skills/responsibilities/requirements/benefits = arrays.
- location: city, state, country as plain text only.
- salary: e.g. "6-10 LPA" or "₹6 - ₹10 LPA".
- experience: "X years" or "X-Y years" only.
- employmentType: ONLY one of: Full-Time, Part-Time, Contract, Internship, Freelance.
- workMode: ONLY one of: Remote, Hybrid, On-site.
- education: plain degree name only e.g. "B.Tech", "MBA".
- NEVER put URLs, image paths, or JSON in any field.

Content:
${content.substring(0, 15000)}`;

  const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt });
  const raw = response.text;
  const cleaned = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
  const data = JSON.parse(cleaned);
  data._method = "ai";

  // Sanitize AI output
  for (const k of ["title","company","location","salary","experience","employmentType","workMode","education","postedDate"]) {
    if (isGarbage(data[k])) data[k] = null;
  }
  for (const k of ["skills","responsibilities","requirements","benefits"]) {
    if (!Array.isArray(data[k])) data[k] = [];
    else data[k] = data[k].filter((s) => !isGarbage(s));
  }
  return data;
}

// ─────────────────────────────────────────────────────────────
// Main Function
// ─────────────────────────────────────────────────────────────

async function extractJobData(input) {
  let content = "", originalUrl = "";

  if (input && typeof input === "object") {
    originalUrl = input.url || "";
    content = input.html || input.text || "";
    if (!content && originalUrl) content = await smartFetch(originalUrl);
  } else if (typeof input === "string") {
    if (/^https?:\/\//i.test(input.trim())) {
      originalUrl = input.trim();
      content = await smartFetch(originalUrl);
    } else {
      content = input;
    }
  }

  if (!content) throw new Error("No content. Provide a URL or paste the job description.");

  const source = detectSource(originalUrl) || detectSource(content) || "Unknown";
  const usedLayers = [];
  let result = null;

  // L1: JSON-LD
  const jld = extractFromJsonLD(content);
  if (jld && jld.title) { result = jld; result.source = result.source || source; usedLayers.push("json-ld"); }

  // L2: Meta Tags
  const meta = extractFromMetaTags(content);
  if (meta) { result = result ? mergeData(result, meta) : { ...meta, source }; if (!usedLayers.includes("meta")) usedLayers.push("meta"); }

  // L3: HTML Selectors
  const html3 = extractFromHTML(content, source);
  if (html3) { result = result ? mergeData(result, html3) : { ...html3, source }; if (!usedLayers.includes("html")) usedLayers.push("html"); }

  // L4: AI
  const needsAI = !result || !result.title || !result.description || !result.company || result.skills.length === 0 || result.responsibilities.length === 0;
  if (needsAI) {
    try {
      const aiData = await extractWithAI(content, source);
      result = result ? mergeData(result, aiData) : { ...aiData, source };
      usedLayers.push("ai");
    } catch (err) {
      console.error("AI failed:", err.message);
      if (!result) throw new Error("All layers failed.");
    }
  }

  // Final cleanup
  result._method = usedLayers.join("+");
  result.source = result.source || source;
  for (const k of ["skills","responsibilities","requirements","benefits"]) {
    if (!Array.isArray(result[k])) result[k] = [];
  }
  // Final garbage pass
  for (const k of ["title","company","location","salary","experience","employmentType","workMode","education","postedDate","applyUrl"]) {
    if (isGarbage(result[k])) result[k] = null;
  }

  return result;
}

module.exports = { extractJobData };