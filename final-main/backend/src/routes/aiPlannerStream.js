const express = require('express');
const router = express.Router();
const { spawn } = require('child_process');
const path = require('path');
const readline = require('readline');

/**
 * SSE endpoint: Streams real-time agent events to the frontend.
 * Each event is a JSON object sent as an SSE "data:" line.
 */
router.get('/', (req, res) => {
    const { destination, days, budget } = req.query;

    if (!destination || !days || !budget) {
        return res.status(400).json({ error: 'destination, days, and budget are required as query params' });
    }

    // Set SSE headers
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'X-Accel-Buffering': 'no', // Disable nginx buffering if behind proxy
    });

    // Send initial connection event
    res.write(`data: ${JSON.stringify({ event: 'connected', message: 'SSE connection established' })}\n\n`);

    const aiAgentDir = path.join(__dirname, '../../ai_agent');
    const pythonScript = path.join(aiAgentDir, 'run_agent_stream.py');

    console.log(`[AI Stream] Starting streaming agent for: ${destination}, ${days} days, $${budget}`);

    // Use uv run to execute in the venv
    const child = spawn('uv', [
        'run', 'python', pythonScript,
        '--destination', destination,
        '--days', days,
        '--budget', budget
    ], {
        cwd: aiAgentDir,
        env: { ...process.env },
        stdio: ['pipe', 'pipe', 'pipe']
    });

    // Read stdout line by line (JSONL format)
    const rl = readline.createInterface({ input: child.stdout });

    rl.on('line', (line) => {
        const trimmed = line.trim();
        if (!trimmed) return;

        try {
            // Validate it's JSON before sending
            JSON.parse(trimmed);
            res.write(`data: ${trimmed}\n\n`);
        } catch (e) {
            // Not valid JSON — might be stray output, skip
            console.log(`[AI Stream] Non-JSON output: ${trimmed.substring(0, 100)}`);
        }
    });

    // Also capture stderr for debugging (don't stream to client)
    child.stderr.on('data', (data) => {
        const text = data.toString().trim();
        if (text) {
            console.log(`[AI Stream stderr] ${text.substring(0, 200)}`);
        }
    });

    child.on('close', (code) => {
        console.log(`[AI Stream] Python process exited with code ${code}`);
        res.write(`data: ${JSON.stringify({ event: 'stream_end', code })}\n\n`);
        res.end();
    });

    child.on('error', (err) => {
        console.error(`[AI Stream] Spawn error:`, err);
        res.write(`data: ${JSON.stringify({ event: 'error', error: err.message })}\n\n`);
        res.end();
    });

    // Handle client disconnect
    req.on('close', () => {
        console.log('[AI Stream] Client disconnected, killing Python process');
        child.kill('SIGTERM');
    });
});

module.exports = router;
