const config = require("../config/config");
const catchAsync = require("../utils/errors/catchAsync");
const sendResponse = require("../utils/sendResponse");
const fetcher = require("../utils/fetcher/airTableFetcher");
const soccerTable = config.db.soccerTableUrl;

const getRoi = catchAsync(async (req, res) => {
    const { startDate, endDate, initialBalance, percent, filter } = req.query;

    if (filter) {
        try {
            const startedDate = new Date(startDate);
            let currentDate = new Date(endDate);
            let finalBalance = initialBalance;
            let dataArray = [];

            while (currentDate <= startedDate) {
                const result = await fetcher.get(soccerTable, {
                    params: {
                        fields: ["Results", "PredictedOdds"],
                        filterByFormula: `AND({Date} = '${currentDate.toISOString().slice(0, 10)}', {upload} = 1, NOT({MatchResults} = ''))`,
                        sort: [{ field: "Date", direction: "asc" }]
                    },
                });

                const records = result?.data?.records;
                const percentInvestment = percent / 100;

                if (records.length > 0) {
                    const winOdds = records.reduce((sum, record) => {
                        if (record.fields.Results === 'TRUE') {
                            return sum + (record.fields.PredictedOdds || 0);
                        }
                        return sum;
                    }, 0);

                    const winM = records.filter(record => record.fields.Results === 'TRUE').length;

                    if (winM > 0) {
                        const avgOdds = winOdds / winM;
                        finalBalance = (finalBalance - (finalBalance * percentInvestment)) + (avgOdds * (winM / records.length) * finalBalance * percentInvestment);
                    }
                }

                // Push date and finalBalance into dataArray as an object
                dataArray.push({ date: currentDate.toISOString().slice(0, 10), finalBalance });

                currentDate.setDate(currentDate.getDate() + 1);
            }

            sendResponse(res, {
                statusCode: 200,
                success: true,
                message: "Roi calculation is successful",
                data: { roi: finalBalance, dataArray },
                meta: {
                    total: dataArray.length || 0
                }
            });
        } catch (error) {
            sendResponse(res, {
                statusCode: 500,
                success: false,
                message: "Error in fetching ROI data",
                error: error.message
            });
        }
    } else {
        try {
            let currentDate = new Date(); // Current date
            const startDate = new Date();
            startDate.setMonth(startDate.getMonth() - 1); // One month before the current date

            let finalBalance = initialBalance;
            let dataArray = [];

            while (currentDate > startDate) {
                const result = await fetcher.get(soccerTable, {
                    params: {
                        fields: ["Results", "PredictedOdds"],
                        filterByFormula: `AND({Date} = '${currentDate.toISOString().slice(0, 10)}', {upload} = 1, NOT({MatchResults} = ''))`,
                        sort: [{ field: "Date", direction: "asc" }]
                    },
                });

                const records = result?.data?.records;
                const percentInvestment = percent / 100;

                if (records.length > 0) {
                    const winOdds = records.reduce((sum, record) => {
                        if (record.fields.Results === 'TRUE') {
                            return sum + (record.fields.PredictedOdds || 0);
                        }
                        return sum;
                    }, 0);

                    const winM = records.filter(record => record.fields.Results === 'TRUE').length;

                    if (winM > 0) {
                        const avgOdds = winOdds / winM;
                        finalBalance = (finalBalance - (finalBalance * percentInvestment)) + (avgOdds * (winM / records.length) * finalBalance * percentInvestment);
                    }
                }

                // Push date and finalBalance into dataArray as an object
                dataArray.push({ date: currentDate.toISOString().slice(0, 10), finalBalance });

                currentDate.setDate(currentDate.getDate() - 1); // Decrement date by one day
            }

            sendResponse(res, {
                statusCode: 200,
                success: true,
                message: "Roi calculation is successful",
                data: { roi: finalBalance, dataArray },
                meta: {
                    total: dataArray.length || 0
                }
            });
        } catch (error) {
            sendResponse(res, {
                statusCode: 500,
                success: false,
                message: "Error in fetching ROI data",
                error: error.message
            });
        }

    }
});

module.exports = { getRoi };
