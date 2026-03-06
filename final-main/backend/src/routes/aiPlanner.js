const express = require('express');
const router = express.Router();
const { exec } = require('child_process');
const path = require('path');

router.post('/', async (req, res) => {
  try {
    const { destination, days, budget } = req.body;

    if (!destination || !days || !budget) {
      return res.status(400).json({ success: false, error: 'destination, days, and budget are required' });
    }

    const aiAgentDir = path.join(__dirname, '../../ai_agent');
    // Using uv run to execute the script in the virtualenv context
    // Ensure the arguments are properly passed. We use quotes around them in case of spaces.
    const command = `uv run python run_agent.py --destination "${destination}" --days "${days}" --budget "${budget}"`;

    console.log(`[AI Planner] Executing: ${command}`);

    // Set a large timeout in case the AI agent takes a long time
    // Default 5 mins (300000 ms) should be enough for CrewAI
    exec(command, { cwd: aiAgentDir, timeout: 300000, maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
      if (error) {
        console.error(`[AI Planner] Error: ${error.message}`);
        // Sometimes valid JSON is written to stdout even if there's an error code
      }
      
      if (stderr) {
        console.error(`[AI Planner] stderror output: ${stderr}`);
      }

      // The python script should print JSON on the last line or as the only output.
      // Filter stdout to find JSON-looking response.
      try {
        const jsonMatch = stdout.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return res.json(parsed);
        } else {
          return res.status(500).json({ success: false, error: 'Could not parse JSON from AI agent output.', stdout });
        }
      } catch (parseError) {
        return res.status(500).json({ success: false, error: 'Failed to parse AI output', details: parseError.message });
      }
    });

  } catch (error) {
    console.error(`[AI Planner] Server Error: ${error.message}`);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

module.exports = router;
