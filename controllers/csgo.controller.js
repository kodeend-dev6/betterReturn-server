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

    const dateComponents = value.split("-");
    const date = dateComponents[2] + "-" + dateComponents[1] + "-" + dateComponents[0];



    if (!field || !date) {
      return res.status(400).json({ error: 'Both field and value parameters are required.' });
    }

    const url = `${csgoTable}?filterByFormula=({${field}}='${date}')`;
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

const createNewCsgoMatch = async (req, res) => {

  const { fields } = req.body;
  const data = { fields };

  try {
    const response = await axios.post(csgoTable, data, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });
    res.status(201).send('Record added successfully to Airtable.');
  } catch (error) {
    console.error('Error adding record:', error);
    res.status(500).send('Error adding record to Airtable.');
  }
};

const updateOneCsgoMatch = async (req, res) => {
  const { recordId } = req.params;
  const { fields } = req.body;


  try {
    const airtableURL = `${csgoTable}/${recordId}`;
    const headers = {
      Authorization: `Bearer ${apiKey}`,
    };

    const data = { fields };

    const response = await axios.patch(airtableURL, data, { headers });

    if (response.status === 200) {
      res.status(200).json({ message: 'Record updated successfully' });
    } else {
      res.status(response.status).json(response.data);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating the record' });
  }
};

const deleteOneCsgoMatch = async (req, res) => {
  const { recordId } = req.params;

  try {
    const airtableURL = `${csgoTable}/${recordId}`;
    const headers = {
      Authorization: `Bearer ${apiKey}`,
    };

    const response = await axios.delete(airtableURL, { headers });

    if (response.status === 200) {
      res.status(204).json({ message: 'Record deleted successfully' });
    } else {
      res.status(response.status).json(response.data);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting the record' });
  }
};




module.exports = { getAllCsgoMatches, getSingleCsgoMatch, getAllCsgoMatchesByDate, createNewCsgoMatch, updateOneCsgoMatch, deleteOneCsgoMatch }