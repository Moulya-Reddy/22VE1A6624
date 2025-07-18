
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const shortid = require('shortid');
const path = require('path');

const app = express();
const PORT = 3000;

// Middlewares
app.use(cors());
app.use(bodyParser.json());
app.use(morgan('dev'));

// In-memory storage
let urlStore = {};

// Home page with HTML form
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>URL Shortener</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; margin-top: 50px; }
          input, button { padding: 10px; width: 300px; margin: 10px; }
        </style>
      </head>
      <body>
        <h1>URL Shortener</h1>
        <form id="shorten-form">
          <input type="text" id="longUrl" placeholder="Enter Long URL" required /><br />
          <input type="text" id="shortcode" placeholder="Custom Shortcode (optional)" /><br />
          <input type="number" id="validity" placeholder="Validity in minutes (default 30)" /><br />
          <button type="submit">Shorten</button>
        </form>
        <p id="result"></p>
        <script>
          document.getElementById('shorten-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const longUrl = document.getElementById('longUrl').value;
            const shortcode = document.getElementById('shortcode').value;
            const validity = document.getElementById('validity').value;

            const res = await fetch('/api/shorten', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ longUrl, shortcode, validity }),
            });

            const data = await res.json();
            if (res.ok) {
              document.getElementById('result').innerHTML = 
                \`Short URL: <a href="\${data.shortUrl}" target="_blank">\${data.shortUrl}</a>\`;
            } else {
              document.getElementById('result').textContent = data.error;
            }
          });
        </script>
      </body>
    </html>
  `);
});

// Create a short URL
app.post('/api/shorten', (req, res) => {
  const { longUrl, validity = 30, shortcode } = req.body;

  if (!longUrl || !/^https?:\/\/.+\..+/.test(longUrl)) {
    return res.status(400).json({ error: 'Invalid URL format' });
  }

  const code = shortcode || shortid.generate();

  if (urlStore[code]) {
    return res.status(409).json({ error: 'Shortcode already in use' });
  }

  const now = new Date();
  const expiry = new Date(now.getTime() + validity * 60000);

  urlStore[code] = {
    longUrl,
    createdAt: now,
    expiry,
    clicks: [],
  };

  res.status(201).json({ shortUrl: `http://localhost:${PORT}/${code}`, code, expiresAt: expiry.toISOString() });
});

// Redirect to the long URL
app.get('/:code', (req, res) => {
  const code = req.params.code;
  const data = urlStore[code];

  if (!data || new Date() > new Date(data.expiry)) {
    return res.status(404).send('<h2>URL expired or not found</h2>');
  }

  data.clicks.push({
    timestamp: new Date(),
    source: req.get('Referer') || 'direct',
    location: req.ip,
  });

  res.redirect(data.longUrl);
});

// Get analytics for a short URL
app.get('/api/stats/:code', (req, res) => {
  const data = urlStore[req.params.code];
  if (!data) return res.status(404).json({ error: 'Shortcode not found' });
  res.json(data);
});

// Start server
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
