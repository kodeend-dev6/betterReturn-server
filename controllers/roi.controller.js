const axios = require('axios')
const config = require("../config/config");
const catchAsync = require("../utils/errors/catchAsync");
const sendResponse = require("../utils/sendResponse");
const fetcher = require("../utils/fetcher/airTableFetcher");
const soccerTable = config.db.soccerTableUrl;
const apiKey = config.key.apiKey

const DAYS_PER_REQUEST = 10;



const groupDataByWeek = (data) => {
  const groupedByWeek = {};
  data.forEach((record) => {
    const date = new Date(record.fields.Date);
    const year = date.getFullYear();
    const weekNumber = getWeekNumber(date);

    const key = `${year}-W${weekNumber}`;
    if (!groupedByWeek[key]) {
      groupedByWeek[key] = { days: {} };
    }

    // Group data by Day inside each Week
    const dayKey = date.toISOString().split('T')[0];
    if (!groupedByWeek[key].days[dayKey]) {
      groupedByWeek[key].days[dayKey] = [];
    }
    groupedByWeek[key].days[dayKey].push(record);
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
            filterByFormula: `AND({Date} = '${currentDate
              .toISOString()
              .slice(0, 10)}', {upload} = 1, NOT({MatchResults} = ''))`,
            sort: [{ field: "Date", direction: "asc" }],
          },
        });

        const records = result?.data?.records;
        const percentInvestment = percent / 100;

        if (records.length > 0) {
          const winOdds = records.reduce((sum, record) => {
            if (record.fields.Results === "TRUE") {
              return sum + (record.fields.PredictedOdds || 0);
            }
            return sum;
          }, 0);

          const winM = records.filter(
            (record) => record.fields.Results === "TRUE"
          ).length;

          if (winM > 0) {
            const avgOdds = winOdds / winM;
            finalBalance =
              finalBalance -
              finalBalance * percentInvestment +
              avgOdds *
              (winM / records.length) *
              finalBalance *
              percentInvestment;
          }
        }

        // Push date and finalBalance into dataArray as an object
        dataArray.push({
          date: currentDate.toISOString().slice(0, 10),
          finalBalance,
        });

        currentDate.setDate(currentDate.getDate() + 1);
      }

      sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Roi calculation is successful",
        data: { roi: finalBalance, dataArray },
        meta: {
          total: dataArray.length || 0,
        },
      });
    } catch (error) {
      sendResponse(res, {
        statusCode: 500,
        success: false,
        message: "Error in fetching ROI data",
        error: error.message,
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
            filterByFormula: `AND({Date} = '${currentDate
              .toISOString()
              .slice(0, 10)}', {upload} = 1, NOT({MatchResults} = ''))`,
            sort: [{ field: "Date", direction: "asc" }],
          },
        });

        const records = result?.data?.records;
        const percentInvestment = percent / 100;

        if (records.length > 0) {
          const winOdds = records.reduce((sum, record) => {
            if (record.fields.Results === "TRUE") {
              return sum + (record.fields.PredictedOdds || 0);
            }
            return sum;
          }, 0);

          const winM = records.filter(
            (record) => record.fields.Results === "TRUE"
          ).length;

          if (winM > 0) {
            const avgOdds = winOdds / winM;
            finalBalance =
              finalBalance -
              finalBalance * percentInvestment +
              avgOdds *
              (winM / records.length) *
              finalBalance *
              percentInvestment;
          }
        }

        // Push date and finalBalance into dataArray as an object
        dataArray.push({
          date: currentDate.toISOString().slice(0, 10),
          finalBalance,
        });

        currentDate.setDate(currentDate.getDate() - 1); // Decrement date by one day
      }

      sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Roi calculation is successful",
        data: { roi: finalBalance, dataArray },
        meta: {
          total: dataArray.length || 0,
        },
      });
    } catch (error) {
      sendResponse(res, {
        statusCode: 500,
        success: false,
        message: "Error in fetching ROI data",
        error: error.message,
      });
    }
  }
});

const getSoccerRoi = catchAsync(async (req, res) => {
  try {
    const { year } = req.query;
    const startDate = new Date(year, 11, 1); // Start date of the year
    const endDate = new Date(year, 11, 31); // End date of the year

    const allData = [];

    for (let currentDate = new Date(startDate); currentDate <= endDate; currentDate.setDate(currentDate.getDate() + DAYS_PER_REQUEST)) {
      const formattedStartDate = currentDate.toISOString().split('T')[0];
      const nextDate = new Date(currentDate);
      nextDate.setDate(nextDate.getDate() + DAYS_PER_REQUEST - 1);
      const formattedEndDate = nextDate <= endDate ? nextDate.toISOString().split('T')[0] : endDate.toISOString().split('T')[0];

      const response = await axios.get(soccerTable, {
        headers: { Authorization: `Bearer ${apiKey}` },
        params: {
          fields: ['Date', 'Results', 'PredictedOdds'],
          filterByFormula: `AND(
            NOT({MatchResults} = BLANK()),
            NOT({Prediction} = BLANK()),
            {Date} >= '${formattedStartDate}',
            {Date} <= '${formattedEndDate}'
          )`,
          sort: [{ field: 'Date', direction: 'asc' }]
        },
      });

      allData.push(...response.data.records);
    }


    const dataGroupedByWeek = groupDataByWeek(allData);
    // const dataGroupedByMonth = groupDataByMonth(allData);


    // Object.entries(dataGroupedByWeek).forEach(([key, value]) => {
    //   console.log(value)
    // })

    Object.entries(dataGroupedByWeek).map(([key, value]) => {
      console.log(key)
    })



    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Get Dashboard data Successful",
      data: {
        dataGroupedByWeek,
        // dataGroupedByMonth
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


module.exports = { getRoi, getSoccerRoi };
