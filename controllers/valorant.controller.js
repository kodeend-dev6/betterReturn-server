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

const createNewValorantMatch = async (req, res) => {

  const { fields } = req.body;
  const data = { fields };

  try {
    const response = await axios.post(valorantTable, data, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });
    console.log('Record added successfully:', response.data);
    res.status(201).json({
      success: true,
      message: "Successfully added.."
    });
  } catch (error) {
    console.error('Error adding record:', error);
    res.status(500).send('Error adding record to Airtable.');
  }
};


const updateOneValorantMatch = async (req, res) => {
  const { recordId } = req.params;
  const {fields} = req.body;
  

  try {
    const airtableURL = `${valorantTable}/${recordId}`;
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

const deleteOneValorantMatch = async (req, res) => {
  const { recordId } = req.params;

  try {
    const airtableURL = `${valorantTable}/${recordId}`;
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




module.exports = { getAllValorantMatches, getSingleValorantMatch, getAllValorantMatchesByDate, createNewValorantMatch, updateOneValorantMatch, deleteOneValorantMatch}