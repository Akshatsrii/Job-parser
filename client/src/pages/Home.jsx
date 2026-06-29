import { useState } from 'react';
import InputBox from '../components/InputBox';
import JobCard from '../components/JobCard';
import Loader from '../components/Loader';
import { parseJob } from '../services/api';

export default function Home() {
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleExtract(input) {
    setLoading(true);
    setError('');
    setJob(null);
    try {
      const data = await parseJob(input);
      setJob(data);
    } catch (e) {
      setError(e.message || 'Kuch galat ho gaya. Dobara try karo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container">
      <div className="page-header">
        <h1>Job Parser</h1>
        <p>AmbitionBox, Naukri, LinkedIn — kisi bhi job ka data structured format mein</p>
      </div>

      <InputBox onExtract={handleExtract} loading={loading} />

      {loading && <Loader />}

      {error && <div className="error-box">{error}</div>}

      {job && <JobCard job={job} />}
    </main>
  );
}