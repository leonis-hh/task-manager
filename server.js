// server.js - Main backend server file
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { initializeDatabase, db } = require('./database');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Initialize database
initializeDatabase();

// ==================== API ROUTES ====================

// GET all tasks
app.get('/api/tasks', (req, res) => {
  const sql = 'SELECT * FROM tasks ORDER BY created_at DESC';
  
  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

// GET single task by ID
app.get('/api/tasks/:id', (req, res) => {
  const sql = 'SELECT * FROM tasks WHERE id = ?';
  
  db.get(sql, [req.params.id], (err, row) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (!row) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json(row);
  });
});

// POST create new task
app.post('/api/tasks', (req, res) => {
  const { title, description, priority, due_date } = req.body;
  
  // Validation
  if (!title || title.trim() === '') {
    return res.status(400).json({ error: 'Title is required' });
  }
  
  const sql = `
    INSERT INTO tasks (title, description, priority, due_date, status)
    VALUES (?, ?, ?, ?, 'active')
  `;
  
  const params = [
    title.trim(),
    description || '',
    priority || 'medium',
    due_date || null
  ];
  
  db.run(sql, params, function(err) {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to create task' });
    }
    
    // Return the created task
    db.get('SELECT * FROM tasks WHERE id = ?', [this.lastID], (err, row) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Task created but failed to retrieve' });
      }
      res.status(201).json(row);
    });
  });
});

// PUT update existing task
app.put('/api/tasks/:id', (req, res) => {
  const { title, description, priority, due_date, status } = req.body;
  const { id } = req.params;
  
  // Validation
  if (!title || title.trim() === '') {
    return res.status(400).json({ error: 'Title is required' });
  }
  
  const sql = `
    UPDATE tasks 
    SET title = ?, description = ?, priority = ?, due_date = ?, status = ?
    WHERE id = ?
  `;
  
  const params = [
    title.trim(),
    description || '',
    priority || 'medium',
    due_date || null,
    status || 'active',
    id
  ];
  
  db.run(sql, params, function(err) {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to update task' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    // Return updated task
    db.get('SELECT * FROM tasks WHERE id = ?', [id], (err, row) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Task updated but failed to retrieve' });
      }
      res.json(row);
    });
  });
});

// DELETE task
app.delete('/api/tasks/:id', (req, res) => {
  const sql = 'DELETE FROM tasks WHERE id = ?';
  
  db.run(sql, [req.params.id], function(err) {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to delete task' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    res.json({ message: 'Task deleted successfully', id: req.params.id });
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📊 API available at http://localhost:${PORT}/api/tasks`);
});
