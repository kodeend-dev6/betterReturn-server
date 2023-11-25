const axios = require("axios");
const config = require("../config/config");
const soccerTable = config.db.soccerTableUrl;
const csgoTable = config.db.csgoTableUrl;
const valorantTable = config.db.valorantTableUrl;
const apiKey = config.key.apiKey;;


const getPickOfDay = async (req, res) => {
    try {

        const today = new Date().toISOString().split('T')[0];  // Get today's date in YYYY-MM-DD form

        const dateComponents = today.split("-");
        const csgoDate = dateComponents[2] + "-" + dateComponents[1] + "-" + dateComponents[0];

        // Use Axios to fetch data from Airtable tables
        const [data1, data2, data3] = await Promise.all([
            axios.get(soccerTable, {
                headers: { Authorization: `Bearer ${apiKey}` },
                params: {
                    filterByFormula: `AND({Date}='${today}', {PickOfTheDay}=1)`,
                },
            }),
            axios.get(csgoTable, {
                headers: { Authorization: `Bearer ${apiKey}` },
                params: {
                    filterByFormula: `AND({Date}='${csgoDate}', {PickOfTheDay}=1)`,
                },
            }),
            axios.get(valorantTable, {
                headers: { Authorization: `Bearer ${apiKey}` },
                params: {
                    filterByFormula: `AND({Date}='${today}', {PickOfTheDay}=1)`,
                },
            }),
        ]);

        const data2Formated = await data2.data.records.map((item) => {
            if (item.fields.Date) {
                const dateComponents = item.fields.Date.split("-");
                const date = dateComponents[2] + "-" + dateComponents[1] + "-" + dateComponents[0];
                item.fields.Date = date;
            }
            return item;
        })

        console.log("updated: ",data2Formated);
        console.log("previou: ",data2.data.records)

        let combinedData = [...data1.data.records, ...data2.data.records, ...data3.data.records]

        res.json(combinedData);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal Server Error');
    }
};

module.exports = { getPickOfDay }