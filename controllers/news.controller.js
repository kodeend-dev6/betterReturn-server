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
        const field = 'Date';

        if (!field || !value) {
            return res.status(404).json({ message: 'Date is incoorect.' });
        }

        const url = `${newsTable}?filterByFormula=({${field}}='${value}`;
        const headers = {
            Authorization : `Bearer ${apiKey}`
        }

    } catch (error) {
        console.error(error.message);
        res.status(500).json({message:"Canl't fetch news from airtable"});
    }

}


module.exports = { allNews, getNewsByDate }