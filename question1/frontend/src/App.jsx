//import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { useState } from 'react';
import { TextField, Button, Container, Typography, Box } from '@mui/material';
import axios from 'axios';

function App() {
  const [urls, setUrls] = useState([{ longUrl: '', validity: '', shortcode: '' }]);
  const [results, setResults] = useState([]);

  const handleChange = (index, field, value) => {
    const updated = [...urls];
    updated[index][field] = value;
    setUrls(updated);
  };

  const addUrl = () => {
    if (urls.length < 5) setUrls([...urls, { longUrl: '', validity: '', shortcode: '' }]);
  };

  const handleSubmit = async () => {
    const responses = [];
    for (const input of urls) {
      try {
        const res = await axios.post('http://localhost:3000/api/shorten', input);
        responses.push(res.data);
      } catch (err) {
        responses.push({ error: err.response?.data?.error || 'Failed to shorten' });
      }
    }
    setResults(responses);
  };

  return (
    <Container>
      <Typography variant="h4" mt={2}>URL Shortener</Typography>
      {urls.map((input, i) => (
        <Box key={i} mt={2}>
          <TextField label="Long URL" fullWidth value={input.longUrl}
            onChange={e => handleChange(i, 'longUrl', e.target.value)} />
          <TextField label="Validity (mins)" fullWidth value={input.validity}
            onChange={e => handleChange(i, 'validity', e.target.value)} />
          <TextField label="Custom Shortcode" fullWidth value={input.shortcode}
            onChange={e => handleChange(i, 'shortcode', e.target.value)} />
        </Box>
      ))}
      <Button onClick={addUrl} disabled={urls.length >= 5}>Add More</Button>
      <Button variant="contained" onClick={handleSubmit}>Shorten</Button>

      <Box mt={4}>
        {results.map((res, i) => (
          <Typography key={i} color={res.error ? 'error' : 'primary'}>
            {res.error || `Short URL: ${res.shortUrl}`}
          </Typography>
        ))}
      </Box>
    </Container>
  );
}

export default App;
