const config = require('../config/config');
const newsTable = config.db.newsTableUrl;
const apiKey = config.key.apiKey;
const axios = require('axios');
const catchAsync = require('../utils/errors/catchAsync');
const sendResponse = require('../utils/sendResponse');



const allNews = catchAsync(async (req, res) => {
    const response = await axios.get(`${newsTable}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
        params: {
            sort: [{ field: "Date", direction: "desc" }],
            maxRecords: 15,
        },
    });

    const data = response.data;

    sendResponse(res, {
        statusCode: 200,
        message: "News retrieved successfully!",
        data
    })
});



const getNewsByDate = async (req, res) => {

    try {

        const { value } = req.query;
        // console.log(value)
        const field = "Date";


        if (!field || !value) {
            return res.status(400).json({ error: 'Both field and value parameters are required.' });
        }

        const url = `${newsTable}?filterByFormula=({${field}}='${value}')`;
        const headers = {
            Authorization: `Bearer ${apiKey}`,
        };

        const response = await axios.get(url, { headers });
        const allData = response.data.records;

        res.json(allData);

    } catch (error) {
        console.error('Error fetching data from Airtable:', error);
        res.status(500).json({ error: 'An error occurred while fetching data.' });
    }
};

const getSingleNews = async (req, res) => {
    try {
        const newsID = req.params.newsID;
        const url = `${newsTable}/${newsID}`;
        const headers = {
            Authorization: `Bearer ${apiKey}`
        }

        const response = await axios.get(url, { headers });
        const data = response.data;

        res.status(200).json(data);

    } catch (error) {
        console.error(error.message);
        res.status(404).json({ message: "Can't get the News.." })
    }
}

const createNewNews = async (req, res) => {
    const { fields } = req.body;
    const data = { fields };

    try {

        const response = await axios.post(newsTable, data, {
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        })
        res.status(201).send('News added successfully to Airtable.');
    } catch (error) {
        console.error('Error to adding new', error);
        res.status(500).send('Error to adding the news in airtable.')
    }
}

const updateNews = async (req, res) => {
    const { newsID } = req.params;
    const { fields } = req.body;


    try {
        const airtableURL = `${newsTable}/${newsID}`;
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

const deleteNews = async (req, res) => {
    const { newsID } = req.params;

    try {
        const airtableURL = `${newsTable}/${newsID}`;
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


module.exports = { allNews, getNewsByDate, getSingleNews, createNewNews, updateNews, deleteNews }