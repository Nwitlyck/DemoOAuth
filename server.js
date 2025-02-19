const express = require('express');
const axios = require('axios');
const cors = require('cors');
const https = require('https');
const { arch } = require('os');
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

app.get('/login', (req, res) => {
  const acr_values = req.query.selectedOption;
  
  if(!acr_values){
    return res.redirect('/');
  }
  
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
    }), { httpsAgent: agent });

    const { access_token, id_token, token_type } = response.data;

    res.send(`
        <html>
          <head>
            <title>OAuth 2.0 - Done</title>
            <style>
              /* General Styles */
              body {
                font-family: 'Arial', sans-serif;
                background-color: #f2f2f2;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                margin: 0;
                text-align: center;
              }
      
              .content-container {
                background-color: #e3f2fd;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                width: 100%;
                max-width: 600px;
              }
      
              h1 {
                font-size: 50px;
                color: green;
                margin-bottom: 20px;
              }
      
              p {
                font-size: 18px;
                color: #555;
                margin-bottom: 20px;
              }
      
              .token-info p {
                font-size: 18px;
                color: #333;
              }
      
              .token-info strong {
                font-weight: bold;
              }
            </style>
          </head>
          <body>
            <div class="content-container">
              <h1>Done!</h1>
              <p>OAuth Process Completed Successfully.</p>
              <div class="token-info">
                <p>ID Token: <strong>${id_token || 'No ID token received'}</strong></p>
              </div>
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

  const options = new Map([
    ["IAL2A", "IAL2"],
    ["IAL1PLUSA", "Secure identity proofing"]
  ]);

  const dropdownOptions = Array.from(options).map(([key, value]) =>
    `<option value="${key}">${value}</option>`
  ).join('');

  res.send(`
    <html>
      <head>
        <title>Simple Page</title>
        <style>
          body {
            font-family: 'Arial', sans-serif;
            background-color: #f2f2f2;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            text-align: center;
          }

          .content-container {
            background-color: #e3f2fd;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            width: 100%;
            max-width: 500px;
          }

          h1 {
            font-size: 32px;
            margin-bottom: 20px;
            color: #333;
          }

          p {
            font-size: 18px;
            color: #555;
            margin-bottom: 30px;
          }

          .btn {
            padding: 12px 20px;
            background-color: #0056b3;
            color: #fff;
            border: none;
            border-radius: 5px;
            font-size: 16px;
            cursor: pointer;
            transition: background-color 0.3s ease;
          }

          .btn:hover {
            background-color: #004494;
          }
        </style>
      </head>
      <body>
        <div class="content-container">
          <h1>Welcome to Our Page</h1>
          <p>This is a simple page with a title, description, and a dropdown before the button.</p>
          
          <!-- Form for submitting the dropdown value -->
          <form action="/login" method="GET">
            <!-- Dropdown Menu -->
            <select id="dropdown" name="selectedOption">
              <option value="">Select an option</option>
              ${dropdownOptions}
            </select>
            
            <br><br>
            
            <!-- Submit Button -->
            <button type="submit" class="btn">Submit</button>
          </form>
        </div>
      </body>
    </html>   
  `);

});

app.listen(port, () => {
  console.log(`OAuth 2.0 server listening at http://localhost:${port}`);
});
