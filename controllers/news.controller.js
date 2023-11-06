const config = require('../config/config');
const newsTable = config.db.newsTableUrl;
const apiKey = config.key.apiKey;
const axios = require('axios')

const allNews = async (req, res) => {
    try {

        const headers = {
            'Authorization': `Bearer ${apiKey}`
        }

        const response = await axios.get(newsTable, { headers });
        const data = response.data;
        res.status(200).json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch news from airtable.' })
    }
}

const getNewsByDate = async (req, res) => {
    try {

        const { value } = req.query;
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


module.exports = { allNews, getNewsByDate, getSingleNews, createNewNews }