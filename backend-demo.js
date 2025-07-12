const express = require('express');
const app = express();
const port = 3000;

app.use(express.json());

// Auth endpoints
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  res.json({
    success: true,
    token: 'jwt-token-here',
    user: { id: 1, email: email, name: 'John Doe' }
  });
});

app.post('/api/auth/register', (req, res) => {
  const { email, password, name } = req.body;
  res.json({
    success: true,
    message: 'User registered successfully',
    user: { id: 2, email: email, name: name }
  });
});

// User endpoints
app.get('/api/user/profile/:id', (req, res) => {
  const { id } = req.params;
  res.json({
    id: parseInt(id),
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'user'
  });
});

app.put('/api/user/profile/:id', (req, res) => {
  const { id } = req.params;
  const { name, email } = req.body;
  res.json({
    success: true,
    message: 'Profile updated',
    user: { id: parseInt(id), name, email }
  });
});

// Data endpoints
app.get('/api/data/fetch', (req, res) => {
  const { limit = 10, offset = 0 } = req.query;
  res.json({
    data: Array.from({ length: parseInt(limit) }, (_, i) => ({
      id: parseInt(offset) + i + 1,
      title: `Item ${parseInt(offset) + i + 1}`,
      description: 'Sample data item'
    })),
    total: 100,
    limit: parseInt(limit),
    offset: parseInt(offset)
  });
});

app.post('/api/data/create', (req, res) => {
  const { title, description } = req.body;
  res.json({
    success: true,
    data: {
      id: 101,
      title: title,
      description: description,
      createdAt: new Date().toISOString()
    }
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});