const config = require("../config/config");
const soccerTable = config.db.soccerTableUrl;
const apiKey = config.key.apiKey;
const axios = require('axios');


const getAllSoccerMatches = async (req, res) => {
  try {

    const headers = {
      'Authorization': `Bearer ${apiKey}`,
    };

    const response = await axios.get(soccerTable, { headers });
    const data = response.data;

    // Process and send the data as a JSON response
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch data from Airtable' });
  }
}


const getAllSoccerMatchesByDate = async (req, res) => {
  try {

    const { value } = req.query;
    const field = "Date";


    if (!field || !value) {
      return res.status(400).json({ error: 'Both field and value parameters are required.' });
    }

    const url = `${soccerTable}?filterByFormula=({${field}}='${value}')`;
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

const getSingleSoccerMatch = async (req, res) => {
  try {

    const matchID = req.params.matchID;

    const url = `${soccerTable}/${matchID}`;
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


const createNewMatch = async (req, res) => {
  const { fields } = req.body;

  const data = { fields }

  try {
    const response = await axios.post(soccerTable, data, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('Record added successfully:', response.data);
    res.status(201).send('Record added successfully to Airtable.');
  } catch (error) {
    console.error('Error adding record:', error);
    res.status(500).send('Error adding record to Airtable.');
  }
};


const deleteOneMatch = async (req, res) => {
  const { recordId } = req.params;

  try {
    const airtableURL = `${soccerTable}/${recordId}`;
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

const updateOneMatch = async (req, res) => {
  const { recordId } = req.params;
  const { fields } = req.body;


  try {
    const airtableURL = `${soccerTable}/${recordId}`;
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



module.exports = { getAllSoccerMatches, getSingleSoccerMatch, getAllSoccerMatchesByDate, createNewMatch, deleteOneMatch, updateOneMatch }