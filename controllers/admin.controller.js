const axios = require('axios');
const config = require('../config/config');
const apiKey = config.key.apiKey;
const soccerTable = config.db.soccerTableUrl;
const catchAsync = require('../utils/errors/catchAsync');
const sendResponse = require('../utils/sendResponse');

const DAYS_PER_REQUEST = 10;

const getDashboardData = catchAsync(async (req, res) => {
    try {
        const { days, league, team, country } = req.query;

        const escapedLeagueName = league?.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") || "";
        const escapedTeamName = team?.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") || "";
        const escapedCountryName = country?.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") || "";


        const today = new Date();
        const allData = [];

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
                    fields: ['Date', 'LeagueName', 'Country', 'HomeTeam', 'AwayTeam', 'Results', 'PredictedOdds', 'Season'],
                    filterByFormula: `AND(
                        OR(
                            REGEX_MATCH(LOWER({HomeTeam}), LOWER('${escapedTeamName}')),
                            REGEX_MATCH(LOWER({AwayTeam}), LOWER('${escapedTeamName}'))
                        ),
                        REGEX_MATCH(LOWER({LeagueName}), LOWER('${escapedLeagueName}')),
                        REGEX_MATCH(LOWER({Country}), LOWER('${escapedCountryName}')),
                        NOT({MatchResults} = BLANK()),
                        NOT({Prediction} = BLANK()),
                        {Date} >= '${formattedStartDate}',
                        {Date} <= '${formattedEndDate}'
                    )`,
                    sort: [{ field: 'Date', direction: 'desc' }]
                },
            });

            allData.push(...response.data.records);
        }

        const totalWinMatch = allData?.filter(m => m.fields.Results === 'TRUE');
        const winMatch = totalWinMatch?.length;
        const lostMatch = allData?.length - winMatch;
        const total = winMatch + lostMatch

        let winOdds = 0;
        for (let i = 0; i < winMatch; i++) {
            winOdds += totalWinMatch[i].fields.PredictedOdds;
        }

        const avgOdds = (winOdds / winMatch).toFixed(2);
        const winParc = (winMatch / total * 100).toFixed(2);

        const soccerData = { winMatch, lostMatch, avgOdds, winParc, total }

        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: "Get Dashboard data Successful",
            data: { soccerData },
            meta: {
                total: allData?.length || 0
            }
        });
    } catch (error) {
        sendResponse(res, {
            statusCode: 500,
            success: false,
            message: "Error in fetching admin dashboard data",
            error: error.message
        });
    }
});

module.exports = { getDashboardData };
