const config = require("../config/config");
const csgoTable = config.db.csgoTableUrl;
const apiKey = config.key.apiKey
const axios = require('axios');


const getAllCsgoMatches = async (req, res) => {
  try {

    const headers = {
      'Authorization': `Bearer ${apiKey}`,
    };

    const response = await axios.get(csgoTable, { headers });
    const data = response.data;

    // Process and send the data as a JSON response
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch data from Airtable' });
  }
}


const getAllCsgoMatchesByDate = async (req, res) => {
  try {

    const { value } = req.query;
    const field = "Date";


    if (!field || !value) {
      return res.status(400).json({ error: 'Both field and value parameters are required.' });
    }

    const url = `${csgoTable}?filterByFormula=({${field}}='${value}')`;
    const headers = {
      Authorization: `Bearer ${apiKey}`,
    };

    const response = await axios.get(url, { headers });
    const allData = response.data.records;

    const filteredData = allData.filter((item) => item.fields.upload === true)


    res.json(filteredData);
  } catch (error) {
    console.error('Error fetching data from Airtable:', error);
    res.status(500).json({ error: 'An error occurred while fetching data.' });
  }
};

const getSingleCsgoMatch = async (req, res) => {
  try {

    const matchID = req.params.matchID;

    const url = `${csgoTable}/${matchID}`;
    const headers = {
      Authorization: `Bearer ${apiKey}`,
    };

    const response = await axios.get(url, { headers });
    const data = response.data;


    res.json(data);
  } catch (error) {
    console.error('Error fetching data from Airtable:', error);
    res.status(500).json({ error: 'An error occurred while fetching data.' });
  }
};


module.exports = { getAllCsgoMatches, getSingleCsgoMatch, getAllCsgoMatchesByDate}