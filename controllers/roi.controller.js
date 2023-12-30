const axios = require('axios')
const config = require("../config/config");
const catchAsync = require("../utils/errors/catchAsync");
const sendResponse = require("../utils/sendResponse");
const fetcher = require("../utils/fetcher/airTableFetcher");
const soccerTable = config.db.soccerTableUrl;
const apiKey = config.key.apiKey

const DAYS_PER_REQUEST = 10;

const calculateROIForWeek = (weekData) => {
  let initialBalance = 1000;
  const percent = 15;
  let finalBalance = initialBalance;
  const dataArray = [];

  Object.keys(weekData).forEach((dayKey) => {
    const records = weekData[dayKey];
    const percentInvestment = percent / 100;


    let winOdds = 0;
    let winM = 0;

    records.forEach((record) => {
      if (record.fields.Results === "TRUE") {
        winOdds += record.fields.PredictedOdds || 0;
        winM++;
      }
    });

    if (winM > 0) {
      const avgOdds = winOdds / winM;
      finalBalance =
        finalBalance -
        finalBalance * percentInvestment +
        avgOdds * (winM / records.length) * finalBalance * percentInvestment;
    }
    dataArray.push({
      date: dayKey,
      finalBalance: Number(finalBalance).toFixed(2),
    });
  });

  return {
    roi: finalBalance,
    dataArray,
  };
};

const calculateROIForMonth = (monthData) => {
  let initialBalance = 1000; // Initial investment
  const percent = 15; // Percentage to invest
  let finalBalance = initialBalance;
  const dataArray = [];

  Object.keys(monthData).forEach((dayKey) => {
    const records = monthData[dayKey];
    const percentInvestment = percent / 100;

    // Your existing ROI calculation logic based on records for the day within the month
    // Example calculation logic:

    let winOdds = 0;
    let winM = 0;

    records.forEach((record) => {
      if (record.fields.Results === 'TRUE') {
        winOdds += record.fields.PredictedOdds || 0;
        winM++;
      }
    });

    if (winM > 0) {
      const avgOdds = winOdds / winM;
      finalBalance =
        finalBalance -
        finalBalance * percentInvestment +
        avgOdds * (winM / records.length) * finalBalance * percentInvestment;
    }

    // Push date and finalBalance into dataArray as an object
    dataArray.push({
      date: dayKey,
      finalBalance: Number(finalBalance).toFixed(2),
    });
  });

  return {
    roi: finalBalance,
    dataArray,
  };
};

const groupDataByWeek = (data) => {
  const groupedByWeek = {};

  data.forEach((record) => {
    const date = new Date(record.fields.Date);
    const year = date.getFullYear();
    const weekNumber = getWeekNumber(date);

    const key = `${year}-W${weekNumber}`;
    if (!groupedByWeek[key]) {
      groupedByWeek[key] = {};
      groupedByWeek[key].days = {};
    }

    // Group data by Day inside each Week
    const dayKey = date.toISOString().split('T')[0];
    if (!groupedByWeek[key].days[dayKey]) {
      groupedByWeek[key].days[dayKey] = [];
    }
    groupedByWeek[key].days[dayKey].push(record);
  });

  // Calculate ROI for each week
  Object.keys(groupedByWeek).forEach((weekKey) => {
    groupedByWeek[weekKey] = calculateROIForWeek(groupedByWeek[weekKey].days);
  });

  return groupedByWeek;
};


const groupDataByMonth = (data) => {
  const groupedByMonth = {};

  data.forEach((record) => {
    const date = new Date(record.fields.Date);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const key = `${year}-${month < 10 ? '0' : ''}${month}`;
    if (!groupedByMonth[key]) {
      groupedByMonth[key] = { days: {} };
    }

    const dayKey = date.toISOString().split('T')[0];
    if (!groupedByMonth[key].days[dayKey]) {
      groupedByMonth[key].days[dayKey] = [];
    }
    groupedByMonth[key].days[dayKey].push(record);
  });

  Object.keys(groupedByMonth).forEach((monthKey) => {
    groupedByMonth[monthKey] = calculateROIForMonth(groupedByMonth[monthKey].days);
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
    const { year, type, weekNumber } = req.query;
    let startDate;
    let endDate;

    if (type === 'weekly') {
      startDate = new Date(year, 0, 1); // January 1st of the year
      const firstDayOfYear = startDate.getDay(); // Day of the week (0 - 6)

      // Calculate the first day of the specified week
      startDate.setDate(startDate.getDate() + (7 * (weekNumber - 1)) - firstDayOfYear);

      // Calculate the last day of the specified week (assuming weeks start on Monday and end on Sunday)
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6);
    }

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
    const dataGroupedByMonth = groupDataByMonth(allData);

    // Filter data only for the requested weekNumber
    const filteredDataByWeek = Object.keys(dataGroupedByWeek).reduce((filtered, key) => {
      if (key.includes(`-W${weekNumber}`)) {
        filtered[key] = dataGroupedByWeek[key];
      }
      return filtered;
    }, {});

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Get Dashboard data Successful",
      data: {
        dataGroupedByWeek: filteredDataByWeek,
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



module.exports = { getRoi, getSoccerRoi };
