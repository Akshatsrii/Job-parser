import { useState } from 'react';

export default function InputBox({ onExtract, loading }) {
  const [value, setValue] = useState('');

  function handleSubmit() {
    if (value.trim()) onExtract(value.trim());
  }

  return (
    <div className="input-area">
      <label className="input-label">
        Paste job URL ya page source / copied content
      </label>
      <textarea
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder="https://www.ambitionbox.com/jobs/... ya page ka HTML paste karo (Ctrl+U se)"
        rows={7}
      />
      <div className="btn-row">
        <button
          className="btn-primary"
          onClick={handleSubmit}
          disabled={loading || !value.trim()}
        >
          {loading ? 'Extracting...' : 'Extract Job'}
        </button>
        <button onClick={() => setValue('')} disabled={loading}>
          Clear
        </button>
      </div>
    </div>
  );
}