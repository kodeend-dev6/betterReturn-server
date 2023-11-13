const axios = require("axios");
const config = require("../config/config");
const soccerTable = config.db.soccerTableUrl;
const csgoTable = config.db.csgoTableUrl;
const valorantTable = config.db.valorantTableUrl;
const apiKey = config.key.apiKey;

const searchGame = async (req, res) => {
    try {
        let gameName = req.query.game;

        gameName = gameName.replace(/\s+/g, ' ');

        const escapedGame = gameName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        // Use Axios to fetch data from Airtable tables
        const [data1, data2, data3] = await Promise.all([
            axios.get(soccerTable, {
                headers: { Authorization: `Bearer ${apiKey}` },
                params: {
                    filterByFormula: `OR(
                        REGEX_MATCH(LOWER({HomeTeam}), LOWER('${escapedGame}')),
                        REGEX_MATCH(LOWER({AwayTeam}), LOWER('${escapedGame}')),
                        REGEX_MATCH(LOWER({LeagueName}), LOWER('${escapedGame}'))
                       
                       )`,
                },
            }),
            axios.get(csgoTable, {
                headers: { Authorization: `Bearer ${apiKey}` },
                params: {
                    filterByFormula: `OR(
                        REGEX_MATCH(LOWER({Team1}), LOWER('${escapedGame}')),
                        REGEX_MATCH(LOWER({Team2}), LOWER('${escapedGame}'))
                    )`,
                },
            }),
            axios.get(valorantTable, {
                headers: { Authorization: `Bearer ${apiKey}` },
                params: {
                    filterByFormula: `OR(
                        REGEX_MATCH(LOWER({Team1}), LOWER('${escapedGame}')),
                        REGEX_MATCH(LOWER({Team2}), LOWER('${escapedGame}'))
                    )`,
                },
            }),
        ]);

        let combinedData = [...data1.data.records, ...data2.data.records, ...data3.data.records];

        res.json(combinedData);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal Server Error');
    }
};

module.exports = { searchGame }
