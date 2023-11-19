const config = require("../config/config");
const soccerTable = config.db.soccerTableUrl;
const apiKey = config.key.apiKey;
const axios = require('axios');
const moment = require('moment');
const moment2 = require('moment-timezone');


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


// const getAllSoccerMatchesByDate = async (req, res) => {
//   try {

//     const { value } = req.query;
//     const field = "Date";


//     if (!field || !value) {
//       return res.status(400).json({ error: 'Both field and value parameters are required.' });
//     }

//     const url = `${soccerTable}?filterByFormula=({${field}}='${value}')`;
//     const headers = {
//       Authorization: `Bearer ${apiKey}`,
//     };

//     const response = await axios.get(url, { headers });
//     const allData = response.data.records;

//     const filteredData = allData.filter((item) => item.fields.upload === true)


//     res.json(filteredData);
//   } catch (error) {
//     console.error('Error fetching data from Airtable:', error);
//     res.status(500).json({ error: 'An error occurred while fetching data.' });
//   }
// };


const getAllSoccerMatchesByDate = async (req, res) => {
  try {
    const { value, timeZone } = req.query;
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

    const desiredTimeZone = `${timeZone}`; // Change to your desired timezone

    const convertedData = allData.map(item => {
      // Convert date
      if (item.fields.Date) {
        const swedenDate = item.fields.Date; // Get the date value
        const convertedDate = moment2.tz(swedenDate, 'YYYY-MM-DD', 'Europe/Stockholm').tz(desiredTimeZone);
        item.fields.Date = convertedDate.format('YYYY-MM-DD'); // Update the date field in the data
      }

      // Convert time
      if (item.fields.Time) {
        const swedenTime = item.fields.Time; // Get the time value
        const convertedTime = moment2.tz(swedenTime, 'h:mm A', 'Europe/Stockholm').tz(desiredTimeZone);
        item.fields.Time = convertedTime.format('hh:mm'); // Update the time field in the data
      }

      return item;
    });

    const filteredData = convertedData.filter(item => item.fields.upload === true);
    console.log(filteredData);

    res.json(filteredData);
  } catch (error) {
    console.error('Error fetching data from Airtable:', error);
    res.status(500).json({ error: 'An error occurred while fetching data.' });
  }
};


const getAllFinishedSoccerMatches = async (req, res) => {
  try {
    const selectedDay = req.query.selectedDay;
    const threeDaysAgo = moment(selectedDay).subtract(3, 'days').format('YYYY-MM-DD');

    const field = 'Date';

    const url = `${soccerTable}?filterByFormula=AND({${field}}<='${selectedDay}', {${field}}>'${threeDaysAgo}')&sort%5B0%5D%5Bfield%5D=${field}&sort%5B0%5D%5Bdirection%5D=desc`;

    const headers = {
      Authorization: `Bearer ${apiKey}`,
    };

    const response = await axios.get(url, { headers });
    const allData = response.data.records;

    const filteredData = allData.filter((item) => item.fields.upload === true);

    res.json(filteredData);
  } catch (error) {
    console.error('Previous match get error', error);
    res.status(500).json({ error: 'An error occurred while fetching data.' });
  }
};

const getAllNextSoccerMatches = async (req, res) => {
  try {
    const selectedDay = req.query.selectedDay;
    const threeDaysNext = moment(selectedDay).add(3, 'days').format('YYYY-MM-DD');

    const field = 'Date';

    const url = `${soccerTable}?filterByFormula=AND({${field}}>='${selectedDay}', {${field}}<='${threeDaysNext}')&sort%5B0%5D%5Bfield%5D=${field}&sort%5B0%5D%5Bdirection%5D=asc`;

    const headers = {
      Authorization: `Bearer ${apiKey}`,
    };

    const response = await axios.get(url, { headers });
    const allData = response.data.records;

    const filteredData = allData.filter((item) => item.fields.upload === true);

    res.json(filteredData);
  } catch (error) {
    console.error('Previous match get error', error);
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
    res.status(201).json({
      success: true,
      message: "Successfully added.."
    });
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



module.exports = { getAllSoccerMatches, getSingleSoccerMatch, getAllSoccerMatchesByDate, createNewMatch, deleteOneMatch, updateOneMatch, getAllFinishedSoccerMatches, getAllNextSoccerMatches }