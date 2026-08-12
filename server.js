const express = require('express');
const path = require('path');
const axios = require('axios');
const https = require('https');

const app = express();
const PORT = 8080;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

app.get('/api-internal/user-info', (req, res) => {
  res.json({
    email: req.headers['remote-email'] || 'user@example.com',
    // Pangolin sends Remote-Role; Remote-Groups is a fallback.
    groups: req.headers['remote-role'] || req.headers['remote-groups'] || 'staff',
  });
});

// Client-supplied expiry code -> [Date method suffix, amount]. Unknown/missing -> 1 year.
const EXPIRY = {
  '1w': ['Date', 7], '2w': ['Date', 14],
  '1m': ['Month', 1], '6m': ['Month', 6],
  '1y': ['FullYear', 1], '3y': ['FullYear', 3],
};

function expiryDate(code, from = new Date()) {
  const [unit, amount] = EXPIRY[code] || EXPIRY['1y'];
  const d = new Date(from);
  d[`set${unit}`](d[`get${unit}`]() + amount);
  return d;
}

// PacketFence wants local-time 'YYYY-MM-DD HH:mm:ss'. sv-SE formats exactly that.
const pfDate = (d) => d.toLocaleString('sv-SE');

app.post('/api-internal/create-user', async (req, res) => {
  const { username, password, email, category, expiry } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Missing username or password' });
  }

  const pfUser = process.env.VUE_APP_PACKETFENCE_USERNAME;
  const pfPassword = process.env.VUE_APP_PACKETFENCE_PASSWORD;
  const pfBaseUrl = process.env.VUE_APP_PACKETFENCE_API_URL;
  if (!pfUser || !pfPassword || !pfBaseUrl) {
    console.error('[api] Missing env: VUE_APP_PACKETFENCE_{USERNAME,PASSWORD,API_URL}');
    return res.status(500).json({ success: false, message: 'Server configuration error.' });
  }

  const config = {
    httpsAgent: new https.Agent({ rejectUnauthorized: process.env.PACKETFENCE_IGNORE_SSL !== 'true' }),
    timeout: 30000,
  };

  try {
    const login = await axios.post(`${pfBaseUrl}/login`, { username: pfUser, password: pfPassword }, config);
    if (!login.data?.token) throw new Error('PacketFence login returned no token');
    config.headers = { Authorization: login.data.token, 'Content-Type': 'application/json' };

    await axios.post(`${pfBaseUrl}/users`, {
      email: email || `${username}@example.com`,
      notes: 'Created via McK Self-Service',
      pid: username,
      sponsor: pfUser,
    }, config);

    const expires = expiryDate(expiry);
    await axios.post(`${pfBaseUrl}/user/${encodeURIComponent(username)}/password`, {
      category: category || '503',
      unregdate: pfDate(expires),
      login_remaining: 0,
      password,
      pid: username,
    }, config);

    console.log(`[api] created ${username}, expires ${pfDate(expires)}`);
    res.json({ success: true, message: 'User created successfully', expiresAt: expires.toISOString() });
  } catch (err) {
    const status = err.response?.status || 500;
    console.error(`[api] create ${username} failed (${status}):`, err.response?.data || err.message);
    res.status(status).json({
      success: false,
      message: err.response?.data?.message || `User creation failed (${status})`,
    });
  }
});

if (require.main === module) {
  app.listen(PORT, () => console.log(`Listening on ${PORT}, serving ${path.join(__dirname, 'dist')}`));
}

module.exports = { app, expiryDate, pfDate };
