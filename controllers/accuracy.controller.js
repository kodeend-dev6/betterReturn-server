const axios = require("axios");
const config = require("../config/config");
const catchAsync = require("../utils/errors/catchAsync");
const sendResponse = require("../utils/sendResponse");
const soccerTable = config.db.soccerTableUrl;
const handicapTable = config.db.handicapTableUrl;
const apiKey = config.key.apiKey;


const DAYS_PER_REQUEST = 10;

const getAccuracy = catchAsync(async (req, res) => {

    const { days } = req.query;

    const today = new Date();

    const allSoccerData = [];

    for (let i = 0; i < parseInt(days); i += DAYS_PER_REQUEST) {
        const startDay = i;
        const endDay = Math.min(i + DAYS_PER_REQUEST - 1, parseInt(days) - 1);
        const startDate = new Date(today);
        startDate.setDate(startDate.getDate() - endDay);
        const endDate = new Date(today);
        endDate.setDate(endDate.getDate() - startDay);

        const formattedStartDate = startDate.toISOString().split('T')[0];
        const formattedEndDate = endDate.toISOString().split('T')[0];

        const response = await axios.get(soccerTable, {
            headers: { Authorization: `Bearer ${apiKey}` },
            params: {
                fields: ["Results", "Date", "PredictedOdds"],
                filterByFormula: `AND(
                    NOT({MatchResults} = BLANK()),
                    NOT({Prediction} = BLANK()),
                    {Date} >= '${formattedStartDate}',
                    {Date} <= '${formattedEndDate}'
                )`,
                sort: [{ field: 'Date', direction: 'desc' }]
            },
        });

        allSoccerData.push(...response.data.records);
    }

    const soccerTotalWinMatch = allSoccerData?.filter(m => m.fields.Results === 'TRUE');
    const soccerWin = soccerTotalWinMatch?.length;
    const soccerLost = allSoccerData?.length - soccerWin;
    const soccerTotal = soccerWin + soccerLost

    let winOdds = 0;
    for (let i = 0; i < soccerWin; i++) {
        winOdds += soccerTotalWinMatch[i].fields.PredictedOdds;
    }

    const soccerAverageOdds = (winOdds / soccerWin).toFixed(2);
    const winParc = (soccerWin / soccerTotal * 100).toFixed(2);

    const soccerData = { soccerWin, soccerLost, soccerAverageOdds, soccerDays: days, winParc, total: soccerTotal }


    // handicap part
    const allHandicapData = [];
    for (let i = 0; i < parseInt(days); i += DAYS_PER_REQUEST) {
        const startDay = i;
        const endDay = Math.min(i + DAYS_PER_REQUEST - 1, parseInt(days) - 1);
        const startDate = new Date(today);
        startDate.setDate(startDate.getDate() - endDay);
        const endDate = new Date(today);
        endDate.setDate(endDate.getDate() - startDay);

        const formattedStartDate = startDate.toISOString().split('T')[0];
        const formattedEndDate = endDate.toISOString().split('T')[0];

        const response = await axios.get(handicapTable, {
            headers: { Authorization: `Bearer ${apiKey}` },
            params: {
                filterByFormula: `AND(
                    NOT({T1CornerResult} = BLANK()),
                    {Date} >= '${formattedStartDate}',
                    {Date} <= '${formattedEndDate}'
                )`,
                sort: [{ field: 'Date', direction: 'desc' }]
            },
        });

        allHandicapData.push(...response.data.records);
    }

    let handicapWin = 0;
    let handicapLost = 0;
    let handicapTotalOdds = 0

    for (let i = 0; i < allHandicapData?.length; i++) {
        const match = allHandicapData[i];
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

        if (match?.fields?.T1GoalUOResult) {
            if (match?.fields?.T1GoalUOResult === 'True') {
                handicapWin++;
                handicapTotalOdds += Number(match?.fields?.T1GoalUOOdds);
            } else {
                handicapLost++;
            }

        }
        if (match?.fields?.T2GoalUOResult) {
            if (match?.fields?.T2GoalUOResult === 'True') {
                handicapWin++;
                handicapTotalOdds += Number(match?.fields?.T2GoalUOOdds);
            } else {
                handicapLost++;
            }

        }
        if (match?.fields?.TGoalUOResult) {
            if (match?.fields?.TGoalUOResult === 'True') {
                handicapWin++;
                handicapTotalOdds += Number(match?.fields?.TGoalUOOdds);
            } else {
                handicapLost++;
            }

        }
    }

    const handicapTotal = handicapWin + handicapLost;

    const handicapWinParc = (handicapWin / handicapTotal * 100).toFixed(2);
    const handicapAverageOdds = (handicapTotalOdds / handicapWin).toFixed(2);
    const handicapData = { handicapLost, handicapWin, handicapAverageOdds, handicapDays: days, winParc: handicapWinParc, total: handicapTotal };

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
