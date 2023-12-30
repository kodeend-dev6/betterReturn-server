const axios = require('axios');
const config = require('../config/config');
const apiKey = config.key.apiKey;
const soccerTable = config.db.soccerTableUrl;
const catchAsync = require('../utils/errors/catchAsync');
const sendResponse = require('../utils/sendResponse');

const DAYS_PER_REQUEST = 10;

const groupDataByDate = (data) => {
    const groupedByDate = {};
    data.forEach((record) => {
        const date = new Date(record.fields.Date).toISOString().split('T')[0];
        if (!groupedByDate[date]) {
            groupedByDate[date] = { matches: [], accuracy: 0 };
        }
        groupedByDate[date].matches.push(record);

        
        if (record.fields.Results === 'TRUE') {
            groupedByDate[date].accuracy += 1;
        }
    });

    // Calculate accuracy percentage for each day
    Object.keys(groupedByDate).forEach((date) => {
        const totalMatches = groupedByDate[date].matches.length;
        groupedByDate[date].accuracy = ((groupedByDate[date].accuracy / totalMatches) * 100).toFixed(2);
    });

    return groupedByDate;
};

// Function to group data by Week
const groupDataByWeek = (data) => {
    const groupedByWeek = {};
    data.forEach((record) => {
        const date = new Date(record.fields.Date);
        const year = date.getFullYear();
        const weekNumber = getWeekNumber(date); // Assuming getWeekNumber function exists

        const key = `${year}-W${weekNumber}`;
        if (!groupedByWeek[key]) {
            groupedByWeek[key] = { matches: [], accuracy: 0 };
        }
        groupedByWeek[key].matches.push(record);

        // Calculate accuracy for the week
        if (record.fields.Results === 'TRUE') {
            groupedByWeek[key].accuracy += 1;
        }
    });

    // Calculate accuracy percentage for each week
    Object.keys(groupedByWeek).forEach((week) => {
        const totalMatches = groupedByWeek[week].matches.length;
        groupedByWeek[week].accuracy = ((groupedByWeek[week].accuracy / totalMatches) * 100).toFixed(2);
    });
    return groupedByWeek;
};

// Function to group data by Month
const groupDataByMonth = (data) => {
    const groupedByMonth = {};
    data.forEach((record) => {
        const date = new Date(record.fields.Date);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const key = `${year}-${month < 10 ? '0' : ''}${month}`;
        if (!groupedByMonth[key]) {
            groupedByMonth[key] = { matches: [], accuracy: 0 };
        }
        groupedByMonth[key].matches.push(record);

        // Calculate accuracy for the month
        if (record.fields.Results === 'TRUE') {
            groupedByMonth[key].accuracy += 1;
        }
    });

    // Calculate accuracy percentage for each month
    Object.keys(groupedByMonth).forEach((month) => {
        const totalMatches = groupedByMonth[month].matches.length;
        groupedByMonth[month].accuracy = ((groupedByMonth[month].accuracy / totalMatches) * 100).toFixed(2);
    });
    return groupedByMonth;
};

// Get ISO week number from date
function getWeekNumber(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
    const week1 = new Date(d.getFullYear(), 0, 4);
    return 1 + Math.round(((d - week1) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
}

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
        let maxOdds = -1;
        let minOdds = 20;
        for (let i = 0; i < winMatch; i++) {
            winOdds += totalWinMatch[i].fields.PredictedOdds;
            if (totalWinMatch[i]?.fields?.PredictedOdds > maxOdds) {
                maxOdds = totalWinMatch[i]?.fields?.PredictedOdds
            }
            if (totalWinMatch[i]?.fields?.PredictedOdds < minOdds) {
                minOdds = totalWinMatch[i]?.fields?.PredictedOdds
            }
        }

        const avgOdds = (winOdds / winMatch).toFixed(2);
        const winParc = (winMatch / total * 100).toFixed(2);

        const soccerData = { winMatch, lostMatch, avgOdds, maxOdds, minOdds, winParc, total }

        const dataGroupedByDate = groupDataByDate(allData);
        const dataGroupedByWeek = groupDataByWeek(allData);
        const dataGroupedByMonth = groupDataByMonth(allData);

        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: "Get Dashboard data Successful",
            data: {
                soccerData,
                dataGroupedByDate,
                dataGroupedByWeek,
                dataGroupedByMonth
            },
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
