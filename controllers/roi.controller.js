const axios = require("axios");
const config = require("../config/config");
const catchAsync = require("../utils/errors/catchAsync");
const sendResponse = require("../utils/sendResponse");
const fetcher = require("../utils/fetcher/airTableFetcher");
const soccerTable = config.db.soccerTableUrl;

const getRoi = catchAsync(async (req, res) => {
    const { startDate, endDate, initialBalance, percent } = req.query;

    try {

        const startedDate = new Date(startDate);

        let currentDate = new Date(endDate);

        let finalBalance = initialBalance;

        while (currentDate <= startedDate) {



            const result = await fetcher.get(soccerTable, {
                params: {
                    maxRecords: 200,
                    filterByFormula: `AND({Date} = '${currentDate.toISOString().slice(0, 10)}', {upload} = 1, NOT({MatchResults} = ''))`,
                    sort: [{ field: "Date", direction: "asc" }]
                },
            });


            const records = result?.data?.records;

            const percentInvestment = percent / 100;

            if (records.length > 0) {
                let winOdds = 0;
                let winM = 0;

                for (let i = 0; i < records?.length; i++) {
                    if (records[i].fields.Results === 'TRUE') {
                        winOdds += records[i]?.fields?.PredictedOdds
                        winM++;
                    }
                }

                let avgOdds = winOdds / winM;
                let winPerc = winM / records?.length;

                finalBalance = (finalBalance - (finalBalance * percentInvestment)) + (avgOdds * winPerc * finalBalance * percentInvestment);
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }


        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: "Roi calculation is successful",
            data: { roi: finalBalance },
        });
    } catch (error) {
        sendResponse(res, {
            statusCode: 500,
            success: false,
            message: "Error in fetching ROI data",
            error: error.message
        });
    }
});

module.exports = { getRoi };
