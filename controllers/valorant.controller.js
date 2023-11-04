const config = require("../config/config");
const valorantTable = config.db.valorantTableUrl;
const apiKey = config.key.apiKey
const axios = require('axios');


const getAllValorantMatches = async (req, res) => {
  try {

    const headers = {
      'Authorization': `Bearer ${apiKey}`,
    };

    const response = await axios.get(valorantTable, { headers });
    const data = response.data;

    // Process and send the data as a JSON response
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch data from Airtable' });
  }
}


const getAllValorantMatchesByDate = async (req, res) => {
  try {

    const { value } = req.query;
    const field = "Date";


    if (!field || !value) {
      return res.status(400).json({ error: 'Both field and value parameters are required.' });
    }

    const url = `${valorantTable}?filterByFormula=({${field}}='${value}')`;
    const headers = {
      Authorization: `Bearer ${apiKey}`,
    };

    const response = await axios.get(url, { headers });
    const allData = response.data.records;

    const filteredData = allData.filter((item) => item.fields.upload === true)
    console.log(filteredData)


    res.json(filteredData);
  } catch (error) {
    console.error('Error fetching data from Airtable:', error);
    res.status(500).json({ error: 'An error occurred while fetching data.' });
  }
};

const getSingleValorantMatch = async (req, res) => {
  try {

    const matchID = req.params.matchID;
    console.log(matchID)

    const url = `${valorantTable}/${matchID}`;
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


module.exports = { getAllValorantMatches, getSingleValorantMatch, getAllValorantMatchesByDate}