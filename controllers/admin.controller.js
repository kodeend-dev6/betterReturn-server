const axios = require('axios');
const moment = require('moment');
const config = require('../config/config');
const apiKey = config.key.apiKey;
const soccerTable = config.db.soccerTableUrl;
const csgoTable = config.db.csgoTableUrl;
const valorantTable = config.db.valorantTableUrl;
const catchAsync = require('../utils/errors/catchAsync');
const sendResponse = require('../utils/sendResponse');

const DAYS_PER_REQUEST = 10;


const groupDataByDate = (data, dateFormat, game) => {
    const groupedByDate = {};
    data.forEach((record) => {
        const date = moment(record.fields.Date, dateFormat).toISOString().split('T')[0];
        if (!groupedByDate[date]) {
            groupedByDate[date] = { matches: [], accuracy: 0 };
        }
        groupedByDate[date].matches.push(record);

        if (game === 'csgo') {
            if (record?.fields.Results === record?.fields.Prediction) {
                groupedByDate[date].accuracy += 1;
            }
        } else if (game === 'valorant') {
            if (record.fields.Result === record.fields.Prediction) {
                groupedByDate[date].accuracy += 1;
            }
        } else {
            if (record.fields.Results === 'TRUE') {
                groupedByDate[date].accuracy += 1;
            }
        }
    });

    // Calculate accuracy percentage for each day
    Object.keys(groupedByDate).forEach((date) => {
        const totalMatches = groupedByDate[date].matches.length;
        groupedByDate[date].accuracy = ((groupedByDate[date].accuracy / totalMatches) * 100).toFixed(2);
    });

    return groupedByDate;
};

const groupDataByWeek = (data, dateFormat, game) => {
    const groupedByWeek = {};
    data.forEach((record) => {
        const date = moment(record.fields.Date, dateFormat);
        const year = date.year();
        const weekNumber = getWeekNumber(date);

        const key = `${year}-W${weekNumber}`;
        if (!groupedByWeek[key]) {
            groupedByWeek[key] = { matches: [], accuracy: 0 };
        }
        groupedByWeek[key].matches.push(record);

        if (game === 'csgo') {
            if (record?.fields.Results === record?.fields.Prediction) {
                groupedByWeek[key].accuracy += 1;
            }
        } else if (game === 'valorant') {
            if (record.fields.Result === record.fields.Prediction) {
                groupedByWeek[key].accuracy += 1;
            }
        }
        else {
            if (record.fields.Results === 'TRUE') {
                groupedByWeek[key].accuracy += 1;
            }
        }
    });

    // Calculate accuracy percentage for each week
    Object.keys(groupedByWeek).forEach((week) => {
        const totalMatches = groupedByWeek[week].matches.length;
        groupedByWeek[week].accuracy = ((groupedByWeek[week].accuracy / totalMatches) * 100).toFixed(2);
    });

    return groupedByWeek;
};

const groupDataByMonth = (data, dateFormat, game) => {
    const groupedByMonth = {};
    data.forEach((record) => {
        const date = moment(record.fields.Date, dateFormat);
        const year = date.year();
        const month = date.month() + 1;
        const key = `${year}-${month < 10 ? '0' : ''}${month}`;
        if (!groupedByMonth[key]) {
            groupedByMonth[key] = { matches: [], accuracy: 0 };
        }
        groupedByMonth[key].matches.push(record);

        if (game === 'csgo') {
            if (record?.fields.Results === record?.fields.Prediction) {
                groupedByMonth[key].accuracy += 1;
            }
        } else if (game === 'valorant') {
            if (record.fields.Result === record.fields.Prediction) {
                groupedByMonth[key].accuracy += 1;
            }
        }
        else {
            if (record.fields.Results === 'TRUE') {
                groupedByMonth[key].accuracy += 1;
            }
        }
    });

    // Calculate accuracy percentage for each month
    Object.keys(groupedByMonth).forEach((month) => {
        const totalMatches = groupedByMonth[month].matches.length;
        groupedByMonth[month].accuracy = ((groupedByMonth[month].accuracy / totalMatches) * 100).toFixed(2);
    });

    return groupedByMonth;
};


// const groupDataByDate = (data) => {
//     const groupedByDate = {};
//     data.forEach((record) => {
//         const date = new Date(record.fields.Date).toISOString().split('T')[0];
//         console.log(date)
//         if (!groupedByDate[date]) {
//             groupedByDate[date] = { matches: [], accuracy: 0 };
//         }
//         groupedByDate[date].matches.push(record);


//         if (record.fields.Results === 'TRUE') {
//             groupedByDate[date].accuracy += 1;
//         }
//     });

//     // Calculate accuracy percentage for each day
//     Object.keys(groupedByDate).forEach((date) => {
//         const totalMatches = groupedByDate[date].matches.length;
//         groupedByDate[date].accuracy = ((groupedByDate[date].accuracy / totalMatches) * 100).toFixed(2);
//     });

//     return groupedByDate;
// };

// Function to group data by Week


// const groupDataByWeek = (data) => {
//     const groupedByWeek = {};
//     data.forEach((record) => {
//         const date = new Date(record.fields.Date);
//         const year = date.getFullYear();
//         const weekNumber = getWeekNumber(date); // Assuming getWeekNumber function exists

//         const key = `${year}-W${weekNumber}`;
//         if (!groupedByWeek[key]) {
//             groupedByWeek[key] = { matches: [], accuracy: 0 };
//         }
//         groupedByWeek[key].matches.push(record);

//         // Calculate accuracy for the week
//         if (record.fields.Results === 'TRUE') {
//             groupedByWeek[key].accuracy += 1;
//         }
//     });

//     // Calculate accuracy percentage for each week
//     Object.keys(groupedByWeek).forEach((week) => {
//         const totalMatches = groupedByWeek[week].matches.length;
//         groupedByWeek[week].accuracy = ((groupedByWeek[week].accuracy / totalMatches) * 100).toFixed(2);
//     });
//     return groupedByWeek;
// };

// Function to group data by Month
// const groupDataByMonth = (data) => {
//     const groupedByMonth = {};
//     data.forEach((record) => {
//         const date = new Date(record.fields.Date);
//         const year = date.getFullYear();
//         const month = date.getMonth() + 1;
//         const key = `${year}-${month < 10 ? '0' : ''}${month}`;
//         if (!groupedByMonth[key]) {
//             groupedByMonth[key] = { matches: [], accuracy: 0 };
//         }
//         groupedByMonth[key].matches.push(record);

//         // Calculate accuracy for the month
//         if (record.fields.Results === 'TRUE') {
//             groupedByMonth[key].accuracy += 1;
//         }
//     });

//     // Calculate accuracy percentage for each month
//     Object.keys(groupedByMonth).forEach((month) => {
//         const totalMatches = groupedByMonth[month].matches.length;
//         groupedByMonth[month].accuracy = ((groupedByMonth[month].accuracy / totalMatches) * 100).toFixed(2);
//     });
//     return groupedByMonth;
// };

// Get ISO week number from date
function getWeekNumber(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
    const week1 = new Date(d.getFullYear(), 0, 4);
    return 1 + Math.round(((d - week1) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
}

const getDashboardData = catchAsync(async (req, res) => {
    const { days, league, team, country, game } = req.query;

    const formatDateForAirtable = (date) => moment(date).format('YYYY-MM-DDTHH:mm:ss.SSS[Z]');
    const dateFormat = game === 'csgo' ? 'DD-MM-YYYY' : 'YYYY-MM-DD';


    if (game === 'csgo') {
        try {
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

                const formattedStartDate = formatDateForAirtable(startDate);
                const formattedEndDate = formatDateForAirtable(endDate);

                // console.log(formattedStartDate, formattedEndDate)

                const response = await axios.get(csgoTable, {
                    headers: { Authorization: `Bearer ${apiKey}` },
                    params: {
                        fields: ['Date', 'Event', 'Results', 'Team1', 'Team2', 'Prediction', 'Best-odds-1', 'Best-odds-2'],
                        filterByFormula: `AND( DATETIME_PARSE({Created}, 'YYYY-MM-DDTHH:mm:ss.SSS[Z]') >= DATETIME_PARSE('${formattedStartDate}', 'YYYY-MM-DDTHH:mm:ss.SSS[Z]'),
                                        DATETIME_PARSE({Created}, 'YYYY-MM-DDTHH:mm:ss.SSS[Z]') <= DATETIME_PARSE('${formattedEndDate}', 'YYYY-MM-DDTHH:mm:ss.SSS[Z]'),
                                        NOT({Prediction} = BLANK()),
                                        NOT({Results} = BLANK()))`,

                        sort: [{ field: 'Date', direction: 'desc' }]
                    },
                });

                allData.push(...response.data.records);
            }

            const totalWinMatch = allData.filter(m => m.fields.Prediction === m.fields.Results);
            const winMatch = totalWinMatch.length;
            const lostMatch = allData.length - winMatch;
            const total = winMatch + lostMatch;

            let winOdds = 0;
            let maxOdds = -1;
            let minOdds = 20;
            for (let i = 0; i < winMatch; i++) {
                if (totalWinMatch[i]?.fields?.Prediction === '1') {
                    winOdds += totalWinMatch[i]?.fields['Best-odds-1'];

                    if (totalWinMatch[i]?.fields['Best-odds-1'] > maxOdds) {
                        maxOdds = totalWinMatch[i]?.fields['Best-odds-1']
                    }
                    if (totalWinMatch[i]?.fields['Best-odds-1'] < minOdds) {
                        minOdds = totalWinMatch[i]?.fields['Best-odds-1']
                    }

                } else if (totalWinMatch[i]?.fields?.Prediction === '2') {
                    winOdds += totalWinMatch[i]?.fields['Best-odds-2'];

                    if (totalWinMatch[i]?.fields['Best-odds-2'] > maxOdds) {
                        maxOdds = totalWinMatch[i]?.fields['Best-odds-2']
                    }
                    if (totalWinMatch[i]?.fields['Best-odds-2'] < minOdds) {
                        minOdds = totalWinMatch[i]?.fields['Best-odds-2']
                    }
                }
            }

            const avgOdds = (winOdds / winMatch).toFixed(2);
            const winParc = (winMatch / total * 100).toFixed(2);

            const accuracyData = { winMatch, lostMatch, avgOdds, maxOdds, minOdds, winParc, total }

            const dataGroupedByDate = groupDataByDate(allData, dateFormat, game);
            const dataGroupedByWeek = groupDataByWeek(allData, dateFormat, game);
            const dataGroupedByMonth = groupDataByMonth(allData, dateFormat, game);

            return sendResponse(res, {
                statusCode: 200,
                success: true,
                message: "CsGo Dashboard data get Successfully",
                data: {
                    accuracyData,
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
                message: "Error in fetching to get CsGo data for admin dashboard",
                error: error.message
            });
        }
    }
    else if (game === 'valorant') {
        try {
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

                const response = await axios.get(valorantTable, {
                    headers: { Authorization: `Bearer ${apiKey}` },
                    params: {
                        fields: ['Date', 'Team1', 'Team2', 'BestOdds1', 'BestOdds2', 'Prediction', 'Result'],
                        filterByFormula: `AND(
                            NOT({Result} = BLANK()),
                            NOT({Prediction} = BLANK()),
                            {Date} >= '${formattedStartDate}',
                            {Date} <= '${formattedEndDate}'
                        )`,
                        sort: [{ field: 'Date', direction: 'desc' }]
                    },
                });

                allData.push(...response.data.records);
            }

            const totalWinMatch = allData?.filter(m => m.fields.Result === m.fields.Prediction);
            const winMatch = totalWinMatch?.length;
            const lostMatch = allData?.length - winMatch;
            const total = winMatch + lostMatch

            // console.log(total)
            // console.log(winMatch)
            // console.log(lostMatch)

            let winOdds = 0;
            let maxOdds = -1;
            let minOdds = 20;
            for (let i = 0; i < winMatch; i++) {
                if (totalWinMatch[i]?.fields?.Prediction === 1) {
                    winOdds += totalWinMatch[i]?.fields?.BestOdds1;

                    if (totalWinMatch[i]?.fields?.BestOdds1 > maxOdds) {
                        maxOdds = totalWinMatch[i]?.fields?.BestOdds1
                    }
                    if (totalWinMatch[i]?.fields?.BestOdds1 < minOdds) {
                        minOdds = totalWinMatch[i]?.fields?.BestOdds1
                    }

                } else if (totalWinMatch[i]?.fields?.Prediction === 2) {
                    winOdds += totalWinMatch[i]?.fields?.BestOdds2;

                    if (totalWinMatch[i]?.fields?.BestOdds2 > maxOdds) {
                        maxOdds = totalWinMatch[i]?.fields?.BestOdds2
                    }
                    if (totalWinMatch[i]?.fields?.BestOdds2 < minOdds) {
                        minOdds = totalWinMatch[i]?.fields?.BestOdds2
                    }
                }
            }

            const avgOdds = (winOdds / winMatch).toFixed(2);
            const winParc = (winMatch / total * 100).toFixed(2);

            const accuracyData = { winMatch, lostMatch, avgOdds, maxOdds, minOdds, winParc, total }

            const dataGroupedByDate = groupDataByDate(allData, dateFormat, game);
            const dataGroupedByWeek = groupDataByWeek(allData, dateFormat, game);
            const dataGroupedByMonth = groupDataByMonth(allData, dateFormat, game);

            sendResponse(res, {
                statusCode: 200,
                success: true,
                message: "Valorant Dashboard data get Successfully",
                data: {
                    accuracyData,
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
                message: "Error in fetching to get CsGo data for admin dashboard",
                error: error.message
            });
        }
    }
    else {
        try {
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

            const accuracyData = { winMatch, lostMatch, avgOdds, maxOdds, minOdds, winParc, total }

            const dataGroupedByDate = groupDataByDate(allData);
            const dataGroupedByWeek = groupDataByWeek(allData);
            const dataGroupedByMonth = groupDataByMonth(allData);

            sendResponse(res, {
                statusCode: 200,
                success: true,
                message: "Get Dashboard data Successful",
                data: {
                    accuracyData,
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
    }
});

module.exports = { getDashboardData };
