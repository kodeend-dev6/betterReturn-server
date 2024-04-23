const axios = require("axios");
const config = require("../config/config");
const soccerTable = config.db.soccerTableUrl;
const csgoTable = config.db.csgoTableUrl;
const valorantTable = config.db.valorantTableUrl;
const handicapTable = config.db.handicapTableUrl;
const apiKey = config.key.apiKey;


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


        const soccerData = await ModifiedPrediction(data1?.data?.records);

        let combinedData = [...soccerData , ...data2.data.records, ...data3.data.records]

        res.json(combinedData);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal Server Error');
    }
};

module.exports = { getPickOfDay }


const ModifiedPrediction = async (allData) => {

    const headers = {
      Authorization: `Bearer ${apiKey}`,
    };
  
    for (let i = 0; i < allData.length; i++) {
      if (allData[i]?.fields?.HandicapMainpage) {
        const match = allData[i];
        const matchId = match?.fields?.MatchID;
        const handicapUrl = `${handicapTable}?filterByFormula=AND({MatchID}='${matchId}')`;
        const handicapResponse = await axios.get(handicapUrl, { headers });
        const handicapData = handicapResponse.data.records;
  
        if (
          handicapData[0]?.fields?.Home.trim().toLowerCase() ===
          match.fields.HandicapMainpage.trim().toLowerCase()
        ) {
          match.fields.Prediction =
            handicapData[0]?.fields?.Home +
            " Corner Kicks" +
            "(" +
            handicapData[0]?.fields?.T1CornerPredict1 +
            ")";
          match.fields.PredictedOdds = Number(handicapData[0]?.fields.T1CornerOdds);
          match.fields.Results =
            handicapData[0]?.fields.T1CornerResult?.toUpperCase();
        } else if (
          handicapData[0]?.fields?.Away.trim().toLowerCase() ===
          match.fields.HandicapMainpage.trim().toLowerCase()
        ) {
          match.fields.Prediction =
            handicapData[0]?.fields?.Away +
            " Corner Kicks" +
            "(" +
            handicapData[0]?.fields?.T2CornerPredict1 +
            ")";
          match.fields.PredictedOdds = Number(handicapData[0]?.fields?.T2CornerOdds);
          match.fields.Results =
            handicapData[0]?.fields.T2CornerResult?.toUpperCase();
        } else {
          match.fields.Prediction =
            "Total" +
            " Corner Kicks" +
            "(" +
            handicapData[0]?.fields?.TCornerPredict1 +
            ")";
          match.fields.PredictedOdds = Number(handicapData[0]?.fields?.TCornerOdds);
          match.fields.Results =
            handicapData[0]?.fields?.TCornerResult?.toUpperCase();
        }
      }
    }
  
    return allData;
  };