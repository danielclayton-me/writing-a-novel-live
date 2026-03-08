const express = require('express');
const simpleGit = require('simple-git');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const git = simpleGit();

app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Save draft - just writes to file, no commit
app.post('/save', (req, res) => {
  const { chapter, content } = req.body;
  const filePath = path.join('chapters', `${chapter}.md`);
  try {
    fs.writeFileSync(filePath, content);
    res.json({ success: true, message: 'Draft saved' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Commit & push - saves file then does full git commit + push
app.post('/commit', async (req, res) => {
  const { chapter, content, sessionNumber, wordCount } = req.body;
  const filePath = path.join('chapters', `${chapter}.md`);
  try {
    // Write file
    fs.writeFileSync(filePath, content);

    // Git add, commit, push
    await git.add('.');
    const commitMessage = `Session ${sessionNumber} — ${chapter} — ${wordCount}w`;
    const result = await git.commit(commitMessage);
    await git.push('origin', 'main');

    res.json({ 
      success: true, 
      message: commitMessage,
      hash: result.commit 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Add note - appends to NOTES.md
app.post('/note', (req, res) => {
  const { note } = req.body;
  const timestamp = new Date().toLocaleString();
  const entry = `\n---\n${timestamp}\n${note}\n`;
  try {
    fs.appendFileSync('NOTES.md', entry);
    res.json({ success: true, message: 'Note saved' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get commit log
app.get('/log', async (req, res) => {
  try {
    const log = await git.log({ maxCount: 10 });
    res.json({ success: true, commits: log.all });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get list of chapters
app.get('/chapters', (req, res) => {
  try {
    const files = fs.readdirSync('chapters').filter(f => f.endsWith('.md'));
    res.json({ success: true, chapters: files });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Load a chapter
app.get('/chapter/:name', (req, res) => {
  const filePath = path.join('chapters', req.params.name);
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    res.json({ success: true, content });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`\n  writing-a-novel-live running at http://localhost:${PORT}\n`);
});