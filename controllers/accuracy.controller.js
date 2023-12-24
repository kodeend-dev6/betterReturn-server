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
            fields: ["Results", "Date"],
            filterByFormula: `AND(
                NOT({MatchResults} = BLANK()),
                {Date} <= '${formattedToday}',
                {upload}=1)`,
            sort: [{ field: 'Date', direction: 'desc' }]
        },
    });

    const soccerWin = soccerResponse.data.records?.filter(item => item.fields.Results === 'TRUE').length;
    const soccerLost = soccerResponse.data.records.length - soccerWin;

    const soccerData = { soccerLost, soccerWin, total: soccerLost + soccerWin }


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

    for (let i = 0; i < handicapResponse?.data?.records.length; i++) {
        const match = handicapResponse?.data?.records[i];
        if (match?.fields?.T1CornerResult) {
            if (match?.fields?.T1CornerResult === 'True') {
                handicapWin++;
            } else {
                handicapLost++;
            }

        }
        if (match?.fields?.T2CornerResult) {
            if (match?.fields?.T2CornerResult === 'True') {
                handicapWin++;
            } else {
                handicapLost++;
            }

        }
        if (match?.fields?.TCornerResult) {
            if (match?.fields?.TCornerResult === 'True') {
                handicapWin++;
            } else {
                handicapLost++;
            }

        }
    }

    const handicapData = { handicapLost, handicapWin, total: handicapLost + handicapWin };

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
