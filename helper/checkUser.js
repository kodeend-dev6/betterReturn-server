const axios = require('axios');
const config = require("../config/config");
const userTable = config.db.userTableUrl;
const apiKey = config.key.apiKey;


async function verifyUser(email, password) {
    try {
        const response = await axios.get(userTable,
            {
                headers: {
                    Authorization: `Bearer ${apiKey}`
                }
            },

        );

        // console.log(response.data.records)

        const existsUser = response.data.records.find(user => user.fields.Email === email)

        if (existsUser) return true;
    } catch (error) {
        console.error('Airtable API error:', error);
        throw error;
    }
}

module.exports = {
  verifyUser,
};



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
