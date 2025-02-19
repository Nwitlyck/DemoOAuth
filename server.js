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

  if (!acr_values) {
    return res.redirect('/');
  }

  const authUrl = `${authorization_url}?response_type=code&client_id=${client_id}&scope=${scope}&redirect_uri=${redirect_uri}&acr_values=${acr_values}`;
  res.redirect(authUrl);
});

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
              display: flex;
              flex-direction: column;
              align-items: center;
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
              margin-top: 20px;
            }
    
            .id-token-container {
              background-color: #ffffff;
              padding: 20px;
              margin-top: 20px;
              border-radius: 8px;
              box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
              max-width: 500; 
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
            <h1>Done!</h1>
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

  const desc_1 = "Please select the preferred identity verification method and click Sign In to proceed.";
  const desc_2 = "•	IAL2: This option will verify your identity by cross-referencing your Driver's License with DMV records.";
  const desc_3 = "•	Government ID: Select this method to verify your identity using either your Driver's License or Passport.";

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
           background-color: gray;
           color: #fff;
           border: none;
           border-radius: 5px;
           font-size: 16px;
           cursor: not-allowed;
           transition: background-color 0.3s ease;
         }
         .btn.enabled {
           background-color: #0056b3;
           cursor: pointer;
         }
         .btn.enabled:hover {
           background-color: #004494;
         }
       </style>
     </head>
     <body>
       <div class="content-container">
         <h1>Welcome to the NCDIT Identity Proofing Demonstration</h1>
         <p>${desc_1}</p>
         <p>${desc_2}</p>
         <p>${desc_3}</p>
         
         <!-- Form for submitting the dropdown value -->
         <form action="/login" method="GET">
           <!-- Dropdown Menu -->
           <select id="dropdown" name="selectedOption" style="appearance: none; -webkit-appearance: none; -moz-appearance: none; width: 200px; padding: 12px 20px; font-size: 16px; background-color: #fff; border: 1px solid #ccc; border-radius: 8px; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1); cursor: pointer; transition: all 0.3s ease;">
             <option value="">Select an option</option>
             ${dropdownOptions}
           </select>
           
           <br><br>
           
           <!-- Submit Button -->
           <button type="submit" class="btn" id="submitBtn" disabled>Submit</button>
         </form>
       </div>
       <script>
         const dropdown = document.getElementById('dropdown');
         const submitBtn = document.getElementById('submitBtn');
         
         dropdown.addEventListener('change', function() {
           if (dropdown.value) {
             submitBtn.disabled = false;  // Enable the button if an option is selected
             submitBtn.classList.add('enabled');  // Add enabled class for styling
           } else {
             submitBtn.disabled = true;  // Disable the button if no option is selected
             submitBtn.classList.remove('enabled');  // Remove enabled class
           }
         });
       </script>
     </body>
   </html>
 `);

});

app.listen(port, () => {
  console.log(`OAuth 2.0 server listening at http://localhost:${port}`);
});
