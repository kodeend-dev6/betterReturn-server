const config = require("../config/config");
const userTable = config.db.userTableUrl;
const apiKey = config.key.apiKey;
const axios = require('axios');

// Function to check if a user with a specific email exists
async function isUserEmailExists(email) {
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
    isUserEmailExists,
};