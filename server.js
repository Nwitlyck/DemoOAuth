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

// Configuration
const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;
const redirect_uri = process.env.REDIRECT_URI;
const authorization_url = process.env.AUTHORIZATION_URL;
const token_url = process.env.TOKEN_URL;
const scope = process.env.SCOPE;

// Route: Login
app.get('/login', (req, res) => {
  const acr_values = req.query.selectedOption;

  if (!acr_values) {
    return res.redirect('/');
  }

  const authUrl = `${authorization_url}?response_type=code&client_id=${client_id}&scope=${scope}&redirect_uri=${redirect_uri}&acr_values=${acr_values}`;
  res.redirect(authUrl);
});

// Route: Callback (OAuth 2.0)
app.get('/callback', async (req, res) => {
  const authorization_code = req.query.code;

  try {
    const response = await axios.post(token_url, new URLSearchParams({
      grant_type: 'authorization_code',
      code: authorization_code,
      redirect_uri: redirect_uri,
      client_id: client_id,
      client_secret: client_secret
    }), { httpsAgent: agent });

    const { access_token, id_token, token_type } = response.data;

    // Render Response HTML
    res.send(`
      <html>
        <head>
            <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;800&display=swap" rel="stylesheet">
          <title>Callback Demo</title>
          <style>
            /* General Styles */
            body {
              font-family: 'Roboto', sans-serif;
              background-image: url('https://www.libertyflagpoles.com/cdn/shop/products/AdobeStock_68923380.jpg?v=1670785190&width=3000');
              background-size: cover;
              background-position: center;
              background-attachment: fixed;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              text-align: center;
              color: #222; 
            }

            .content-container {
              background-color: rgba(227, 242, 253, 0.9);
              padding: 40px;
              border-radius: 12px;
              box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
              width: 100%;
              max-width: 520px;
            }

            h1 {
              font-size: 34px;
              font-weight: 700;
              color: #2C3E50;
              margin-bottom: 25px;
              font-family: 'Poppins', sans-serif;
              text-align: center; /* Keep title centered */
            }
    
            p {
              font-size: 18px;
              color: #555;
              margin-bottom: 20px;
            }
    
            .token-info p {
              font-size: 18px;
              color: #333;
              margin-top: 20px;
            }
    
            .id-token-container {
              background-color: #ffffff;
              padding: 20px;
              margin-top: 20px;
              border-radius: 8px;
              box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
              max-width: 500px; 
              word-wrap: break-word;
              white-space: pre-wrap;
              font-family: 'Courier New', Courier, monospace;
              width: 100%;
            }
  
            .token-info strong {
              font-weight: normal;
              display: block;
              word-wrap: break-word;
              white-space: pre-wrap;
              overflow-wrap: break-word;
            }
          </style>
        </head>
        <body>
          <div class="content-container">
            <h1>Success!</h1>
            <p>Identity Proofing Process Completed Successfully.</p>
            <div class="token-info">
              <p>ID Token:</p>
              <div class="id-token-container">
                <strong>${id_token || 'No ID token received'}</strong>
              </div>
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
  const descriptions = {
    step1: "Please select the preferred identity verification method and click Sign In to proceed.",
    step2: "IAL2: This option will verify your identity by cross-referencing your Driver's License with DMV records.",
    step3: "Government ID: Select this method to verify your identity using either your Driver's License or Passport."
  };

  const options = new Map([
    ["IAL2A", "IAL2"],
    ["IAL1PLUSA", "Government ID"]
  ]);

  const dropdownOptions = Array.from(options).map(([key, value]) => 
    `<option value="${key}">${value}</option>`
  ).join('');

  res.send(`
    <html>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;800&display=swap" rel="stylesheet">
        <title>Identity Proofing</title>
        <style>
          /* General Styles */
          body {
            font-family: 'Roboto', sans-serif;
            background-image: url('https://www.libertyflagpoles.com/cdn/shop/products/AdobeStock_68923380.jpg?v=1670785190&width=3000');
            background-size: cover;
            background-position: center;
            background-attachment: fixed;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            text-align: center;
            color: #222; 
          }

          .content-container {
            background-color: rgba(227, 242, 253, 0.9);
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
            width: 100%;
            max-width: 520px;
          }

          h1 {
            font-size: 34px;
            font-weight: 700;
            color: #2C3E50;
            margin-bottom: 25px;
            font-family: 'Poppins', sans-serif;
            text-align: center; /* Keep title centered */
          }

          p {
            font-size: 18px;
            color: #444;
            margin-bottom: 20px;
            line-height: 1.6;
            text-align: left; /* Align only paragraphs to the left */
          }

          /* Dropdown Styling */
          select {
            width: 220px;
            padding: 12px;
            font-size: 16px;
            background-color: #fff;
            border: 1px solid #aaa;
            border-radius: 8px;
            transition: border-color 0.3s ease;
          }

          select:focus {
            border-color: #0056b3;
            outline: none;
          }

          /* Button Styling */
          .btn {
            padding: 14px 24px;
            background-color: gray;
            color: #fff;
            border: none;
            border-radius: 8px;
            font-size: 18px;
            font-weight: 600;
            cursor: not-allowed;
            transition: background-color 0.3s ease, transform 0.2s;
          }

          .btn.enabled {
            background-color: #0056b3;
            cursor: pointer;
          }

          .btn.enabled:hover {
            background-color: #004494;
            transform: scale(1.05);
          }

        </style>
      </head>
      <body>
        <div class="content-container">
          <h1>Welcome to the NCDIT Identity Proofing Demonstration</h1>
          <p>${descriptions.step1}</p>
          <p>${descriptions.step2}</p>
          <p>${descriptions.step3}</p>
          
          <!-- Form for submitting the dropdown value -->
          <form action="/login" method="GET">
            <select id="dropdown" name="selectedOption">
              <option value="">Select an option</option>
              ${dropdownOptions}
            </select>
            <br><br>
            <button type="submit" class="btn" id="submitBtn" disabled>Submit</button>
          </form>
        </div>
        <script>
          const dropdown = document.getElementById('dropdown');
          const submitBtn = document.getElementById('submitBtn');
          
          dropdown.addEventListener('change', function() {
            if (dropdown.value) {
              submitBtn.disabled = false;
              submitBtn.classList.add('enabled');
            } else {
              submitBtn.disabled = true;
              submitBtn.classList.remove('enabled');
            }
          });
        </script>
      </body>
    </html>
  `);

});

// Start the server
app.listen(port, () => {
  console.log(`OAuth 2.0 server listening at http://localhost:${port}`);
});
