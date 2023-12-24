const axios = require("axios");
const config = require("../config/config");
const catchAsync = require("../utils/errors/catchAsync");
const sendResponse = require("../utils/sendResponse");
const soccerTable = config.db.soccerTableUrl;
const handicapTable = config.db.handicapTableUrl;
const apiKey = config.key.apiKey;

const getAccuracy = catchAsync(async (req, res) => {
    const today = new Date();
    const formattedToday = today.toISOString().split('T')[0];


    const soccerResponse = await axios.get(soccerTable, {
        headers: { Authorization: `Bearer ${apiKey}` },
        params: {
            fields: ["Results", "Date", "PredictedOdds"],
            filterByFormula: `AND(
                NOT({MatchResults} = BLANK()),
                {Date} <= '${formattedToday}',
                {upload}=1)`,
            sort: [{ field: 'Date', direction: 'desc' }]
        },
    });

    const soccerWinMatches = soccerResponse.data.records?.filter(item => item.fields.Results === 'TRUE')
    let soccerTotalOdds = 0;
    for (let i = 0; i < soccerWinMatches.length; i++) {
        soccerTotalOdds += soccerWinMatches[i].fields.PredictedOdds;
    }
    const soccerWin = soccerWinMatches.length;
    const soccerLost = soccerResponse.data.records.length - soccerWin;
    const soccerAverageOdds = (soccerTotalOdds / soccerWinMatches?.length).toFixed(2);

    const soccerData = { soccerLost, soccerWin, soccerAverageOdds, total: soccerLost + soccerWin }


    const handicapResponse = await axios.get(handicapTable, {
        headers: { Authorization: `Bearer ${apiKey}` },
        params: {
            filterByFormula: `AND({Date} <= '${formattedToday}',
                             NOT({T1CornerResult} = BLANK()),
                             {upload}=1)`,
            sort: [{ field: 'Date', direction: 'desc' }]
        },
    })

    let handicapWin = 0;
    let handicapLost = 0;
    let handicapTotalOdds = 0

    for (let i = 0; i < handicapResponse?.data?.records.length; i++) {
        const match = handicapResponse?.data?.records[i];
        if (match?.fields?.T1CornerResult) {
            if (match?.fields?.T1CornerResult === 'True') {
                handicapWin++;
                handicapTotalOdds += Number(match?.fields?.T1CornerOdds);
            } else {
                handicapLost++;
            }

        }
        if (match?.fields?.T2CornerResult) {
            if (match?.fields?.T2CornerResult === 'True') {
                handicapWin++;
                handicapTotalOdds += Number(match?.fields?.T2CornerOdds);
            } else {
                handicapLost++;
            }

        }
        if (match?.fields?.TCornerResult) {
            if (match?.fields?.TCornerResult === 'True') {
                handicapWin++;
                handicapTotalOdds += Number(match?.fields?.TCornerOdds);
            } else {
                handicapLost++;
            }

        }
    }

    const handicapAverageOdds = (handicapTotalOdds / handicapWin).toFixed(2);
    const handicapData = { handicapLost, handicapWin, handicapAverageOdds, total: handicapLost + handicapWin };

    let data = {
        soccerData,
        handicapData
    }

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Get Accuracy Successful",
        data: data
    });
});

module.exports = { getAccuracy };
