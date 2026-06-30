const { extractJobData } = require('../services/parser');

async function parseJob(req, res) {
  try {
    const { input } = req.body;
    if (!input || !input.trim()) {
      return res.status(400).json({ error: 'Input required' });
    }
    const job = await extractJobData(input.trim());
    res.json({ success: true, data: job });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Extraction failed', message: err.message });
  }
}

module.exports = { parseJob };