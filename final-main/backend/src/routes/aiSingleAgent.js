const express = require('express');
const router = express.Router();
const { exec } = require('child_process');
const path = require('path');

const VALID_AGENTS = [
    'itinerary_planner',
    'budget_calculator',
    'attractions_recommender',
    'travel_tips_advisor',
    'weather_safety_analyst',
];

router.post('/', async (req, res) => {
    try {
        const { agent, destination, days, budget } = req.body;

        if (!agent || !destination || !days || !budget) {
            return res.status(400).json({ success: false, error: 'agent, destination, days, and budget are required' });
        }

        if (!VALID_AGENTS.includes(agent)) {
            return res.status(400).json({ success: false, error: `Invalid agent. Must be one of: ${VALID_AGENTS.join(', ')}` });
        }

        const aiAgentDir = path.join(__dirname, '../../ai_agent');
        const command = `uv run python run_single_agent.py --agent "${agent}" --destination "${destination}" --days "${days}" --budget "${budget}"`;

        console.log(`[AI Single Agent] Executing: ${command}`);

        exec(command, { cwd: aiAgentDir, timeout: 300000, maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
            if (error) {
                console.error(`[AI Single Agent] Error: ${error.message}`);
            }
            if (stderr) {
                console.error(`[AI Single Agent] stderr: ${stderr.substring(0, 500)}`);
            }

            try {
                const jsonMatch = stdout.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const parsed = JSON.parse(jsonMatch[0]);
                    return res.json(parsed);
                } else {
                    return res.status(500).json({ success: false, error: 'Could not parse output.', stdout: stdout.substring(0, 500) });
                }
            } catch (parseError) {
                return res.status(500).json({ success: false, error: 'Failed to parse output', details: parseError.message });
            }
        });

    } catch (error) {
        console.error(`[AI Single Agent] Server Error: ${error.message}`);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});

module.exports = router;
