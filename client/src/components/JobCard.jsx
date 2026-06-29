function NA() {
  return <span className="na">Not mentioned</span>;
}

function MetaItem({ label, value }) {
  return (
    <div className="meta-item">
      <div className="meta-label">{label}</div>
      <div className="meta-val">{value || <NA />}</div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="section">
      <div className="section-title">{title}</div>
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

export default function JobCard({ job }) {
  if (!job) return null;

  return (
    <div className="job-card">
      {/* Header */}
      <div className="card-header">
        {job.source && <span className="source-badge">{job.source}</span>}
        <h2 className="job-title">{job.title || 'Title not found'}</h2>
        <div className="company-name">{job.company || <NA />}</div>
      </div>

      {/* Meta grid */}
      <div className="meta-grid">
        <MetaItem label="Location" value={job.location} />
        <MetaItem label="Salary" value={job.salary} />
        <MetaItem label="Experience" value={job.experience} />
        <MetaItem label="Employment type" value={job.employmentType} />
        <MetaItem label="Work mode" value={job.workMode} />
        <MetaItem label="Education" value={job.education} />
      </div>

      {/* Description */}
      <Section title="Description">
        <p className="section-body">{job.description || <NA />}</p>
      </Section>

      {/* Responsibilities */}
      <Section title="Responsibilities">
        <BulletList items={job.responsibilities} />
      </Section>

      {/* Requirements */}
      <Section title="Requirements">
        <BulletList items={job.requirements} />
      </Section>

      {/* Skills */}
      <Section title="Skills">
        {job.skills && job.skills.length > 0 ? (
          <div className="skills-wrap">
            {job.skills.map((s, i) => (
              <span key={i} className="skill-chip">{s}</span>
            ))}
          </div>
        ) : <NA />}
      </Section>

      {/* Benefits */}
      {job.benefits && job.benefits.length > 0 && (
        <Section title="Benefits">
          <BulletList items={job.benefits} />
        </Section>
      )}

      {/* Footer */}
      <div className="card-footer">
        {job.postedDate && (
          <span className="posted-date">Posted: {job.postedDate}</span>
        )}
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