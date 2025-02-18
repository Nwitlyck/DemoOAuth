const express = require('express');
const axios = require('axios');
const cors = require('cors');
const https = require('https');
require("dotenv").config({ path: './oauthconfig.env' });

const app = express();
const port = 3000;

const agent = new https.Agent({
    rejectUnauthorized: false
});

app.use(cors());

const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;
const redirect_uri = process.env.REDIRECT_URI;
const authorization_url = process.env.AUTHORIZATION_URL;
const token_url = process.env.TOKEN_URL;
const scope = process.env.SCOPE;
const acr_values = process.env.ACR_VALUES;

app.get('/login', (req, res) => {
  const authUrl = `${authorization_url}?response_type=code&client_id=${client_id}&scope=${scope}&redirect_uri=${redirect_uri}&acr_values=${acr_values}`;
  res.redirect(authUrl);
});

app.get('/callback', async (req, res) => {
    const authorization_code = req.query.code;
  
    if (!authorization_code) {
      return res.status(400).json({ error: 'Authorization code not provided' });
    }
  
    try {
      const response = await axios.post(token_url, new URLSearchParams({
        grant_type: 'authorization_code',
        code: authorization_code,
        redirect_uri: redirect_uri,
        client_id: client_id,
        client_secret: client_secret
      }),{ httpsAgent: agent });
  
      const { access_token, id_token, token_type } = response.data;
  
      res.send(`
        <html>
          <head>
            <title>OAuth 2.0 - Done</title>
          </head>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h1 style="font-size: 50px; color: green;">Done!</h1>
            <p style="font-size: 20px;">OAuth Process Completed Successfully.</p>
            <div style="margin-top: 20px;">
              <p style="font-size: 18px;">Access Token: <strong>${access_token}</strong></p>
              <p style="font-size: 18px;">ID Token: <strong>${id_token || 'No ID token received'}</strong></p>
              <p style="font-size: 18px;">Token Type: <strong>${token_type || 'Bearer'}</strong></p>
            </div>
          </body>
        </html>
      `);
    } catch (error) {
      console.error('Error exchanging authorization code for token:', error.response?.data || error.message);
      res.status(500).json({ error: 'Failed to obtain token', details: error.response?.data || error.message });
    }
});

app.get('/', (req, res) => {
    res.send(`
      <html>
        <head>
          <title>OAuth Login</title>
        </head>
        <body style="font-family: Arial, sans-serif; padding: 20px; text-align: center;">
          <h1>Welcome to the OAuth Example</h1>
          <p>Click the button below to login via OAuth:</p>
          <a href="/login">
            <button style="padding: 10px 20px; font-size: 16px; cursor: pointer;">Login with OAuth</button>
          </a>
        </body>
      </html>
    `);
});  

app.listen(port, () => {
  console.log(`OAuth 2.0 server listening at http://localhost:${port}`);
});
