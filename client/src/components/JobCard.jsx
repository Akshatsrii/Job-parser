function NA() {
  return <span className="na">Not mentioned</span>;
}

function MetaItem({ label, icon, value }) {
  return (
    <div className="meta-item">
      <div className="meta-label">{icon} {label}</div>
      <div className="meta-val">{value || <NA />}</div>
    </div>
  );
}

function Section({ title, children, icon }) {
  return (
    <div className="section">
      <div className="section-title">{icon && <span>{icon}</span>} {title}</div>
      {children}
    </div>
  );
}

function BulletList({ items }) {
  if (!items || items.length === 0) return <NA />;
  return (
    <ul className="bullet-list">
      {items.map((item, i) => <li key={i}>{item}</li>)}
    </ul>
  );
}

const METHOD_LABEL = {
  'json-ld': { text: 'Structured Data', color: '#22c55e' },
  'json-ld+ai': { text: 'Structured + AI', color: '#3b82f6' },
  'ai': { text: 'AI Extracted', color: '#f59e0b' },
};

export default function JobCard({ job }) {
  if (!job) return null;

  const method = METHOD_LABEL[job._method] || {};

  return (
    <div className="job-card">

      {/* Header */}
      <div className="card-header">
        <div className="badges-row">
          {job.source && <span className="source-badge">{job.source}</span>}
          {method.text && (
            <span className="method-badge" style={{ background: method.color + '20', color: method.color, border: `1px solid ${method.color}40` }}>
              {method.text}
            </span>
          )}
        </div>
        <h2 className="job-title">{job.title || 'Title not found'}</h2>
        <div className="company-name">🏢 {job.company || <NA />}</div>
      </div>

      {/* Meta grid */}
      <div className="meta-grid">
        <MetaItem label="Location"        icon="📍" value={job.location} />
        <MetaItem label="Salary"          icon="💰" value={job.salary} />
        <MetaItem label="Experience"      icon="🕒" value={job.experience} />
        <MetaItem label="Employment type" icon="📋" value={job.employmentType} />
        <MetaItem label="Work mode"       icon="🏠" value={job.workMode} />
        <MetaItem label="Education"       icon="🎓" value={job.education} />
      </div>

      {/* Description */}
      <Section title="Description" icon="📄">
        <p className="section-body">{job.description || <NA />}</p>
      </Section>

      {/* Responsibilities */}
      {job.responsibilities?.length > 0 && (
        <Section title="Responsibilities" icon="✅">
          <BulletList items={job.responsibilities} />
        </Section>
      )}

      {/* Requirements */}
      {job.requirements?.length > 0 && (
        <Section title="Requirements" icon="📌">
          <BulletList items={job.requirements} />
        </Section>
      )}

      {/* Skills */}
      <Section title="Skills" icon="🛠">
        {job.skills && job.skills.length > 0 ? (
          <div className="skills-wrap">
            {job.skills.map((s, i) => (
              <span key={i} className="skill-chip">{s}</span>
            ))}
          </div>
        ) : <NA />}
      </Section>

      {/* Benefits */}
      {job.benefits?.length > 0 && (
        <Section title="Benefits" icon="⭐">
          <BulletList items={job.benefits} />
        </Section>
      )}

      {/* Footer */}
      <div className="card-footer">
        <div>
          {job.postedDate && <div className="posted-date">📅 Posted: {job.postedDate}</div>}
        </div>
        {job.applyUrl ? (
          <a href={job.applyUrl} target="_blank" rel="noreferrer" className="apply-btn">
            Apply Now →
          </a>
        ) : (
          <span className="na">Apply link not found</span>
        )}
      </div>
    </div>
  );
}