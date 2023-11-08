const config = require("../config/config");
const userTable = config.db.userTableUrl;
const apiKey = config.key.apiKey;
const axios = require('axios');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid')
const emailCheck = require('../helper/emailCheck');

const createNewUser = async (req, res) => {
    const { fields } = req.body;
    
    const { Email, Name, Password } = fields;

    if (!Email || !Name || !Password) {
        return res.status(400).json({ error: 'Missing email, name, or password' });
    }

    const hashedPassword = await bcrypt.hash(Password, 10)

    fields.Password = hashedPassword

    try {
        // Check if the email already exists
        const emailExists = await emailCheck.isUserEmailExists(Email);

        if (emailExists) {
            return res.status(400).json({ error: 'Email already exists' });
        }

        const data = {fields}

        const response = await axios.post(userTable, data, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        })

        return res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// const apiKey = 'YOUR_AIRTABLE_API_KEY';
// const baseId = 'YOUR_AIRTABLE_BASE_ID';
// const tableName = 'Users'; // Change this to your Airtable table name

// // Define Airtable API endpoint
// const airtableUrl = `https://api.airtable.com/v0/${baseId}/${tableName}`;

// Middleware to check if a user is authenticated
const authenticateUser = async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(401).json({ message: 'Email and password are required.' });
  }

  try {
    // Fetch user data from Airtable based on the provided username
    const response = await axios.get(userTable, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      params: {
        filterByFormula: `Eamil = "${email}"`,
      },
    });

    const user = response.data.records[0];

    if (!user) {
      return res.status(401).json({ message: 'User not found.' });
    }

    // Compare the hashed password
    if (await bcrypt.compare(password, user.fields.Password)) {
      // User is authenticated
      next();
    } else {
      return res.status(401).json({ message: 'Authentication failed. Incorrect password.' });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

// Login endpoint
// app.post('/login', authenticateUser, (req, res) => {
//   // Authentication successful, you can perform further actions here
//   res.json({ message: 'Login successful!' });
// });

const userLogin = authenticateUser;  (req, res) =>{

    res.json({ message: 'Login successful!' });
}


const getAllUser = async (req, res) => {
    try {
        const response = await axios.get(userTable, {
            headers: {
                Authorization: `Bearer ${apiKey}`
            }
        })
        const data = await response.data.records;
        res.status(200).json(data);
    } catch (error) {
        console.error("Cant't fetch user from airtable.", error);
        res.status(500).json({ message: "Can't fetch all user." });
    }
}


module.exports = { createNewUser, getAllUser, userLogin }