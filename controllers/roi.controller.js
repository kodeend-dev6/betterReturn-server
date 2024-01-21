const axios = require("axios");
const config = require("../config/config");
const catchAsync = require("../utils/errors/catchAsync");
const sendResponse = require("../utils/sendResponse");
const fetcher = require("../utils/fetcher/airTableFetcher");
const soccerTable = config.db.soccerTableUrl;
const csgoTable = config.db.csgoTableUrl;
const valorantTable = config.db.valorantTableUrl;
const apiKey = config.key.apiKey;
const moment = require('moment');

const DAYS_PER_REQUEST = 10;

const calculateROIForWeek = (weekData) => {
  const percent = 15;
  let finalBalanceForOneThousand = 1000;
  let finalBalanceForThreeThousand = 3000;
  let finalBalanceForFiveThousand = 5000;
  const dataArray = [];
  let totalMatch = 0;
  let winMatch = 0;

  Object.keys(weekData).forEach((dayKey) => {
    const records = weekData[dayKey];
    const percentInvestment = percent / 100;

    let winOdds = 0;
    let winM = 0;

    records.forEach((record) => {
      totalMatch++;
      if (record.fields.Results === "TRUE") {
        winOdds += record.fields.PredictedOdds || 0;
        winM++;
        winMatch++;
      }
    });

    if (winM > 0) {
      const avgOdds = winOdds / winM;
      finalBalanceForOneThousand =
        finalBalanceForOneThousand -
        finalBalanceForOneThousand * percentInvestment +
        avgOdds * (winM / records.length) * finalBalanceForOneThousand * percentInvestment;

      finalBalanceForThreeThousand =
        finalBalanceForThreeThousand -
        finalBalanceForThreeThousand * percentInvestment +
        avgOdds * (winM / records.length) * finalBalanceForThreeThousand * percentInvestment;

      finalBalanceForFiveThousand =
        finalBalanceForFiveThousand -
        finalBalanceForFiveThousand * percentInvestment +
        avgOdds * (winM / records.length) * finalBalanceForFiveThousand * percentInvestment;
    }
    dataArray.push({
      date: dayKey,
      finalBalance: Number(finalBalanceForOneThousand).toFixed(2),
      finalBalanceForThreeThousand: Number(finalBalanceForThreeThousand).toFixed(2),
      finalBalanceForFiveThousand: Number(finalBalanceForFiveThousand).toFixed(2),
    });
  });

  return {
    roi: finalBalanceForOneThousand,
    roiForThreeThousand: finalBalanceForThreeThousand,
    roiForFiveThousand: finalBalanceForFiveThousand,
    winParc: Number(winMatch / totalMatch * 100).toFixed(2),
    dataArray,
  };
};

const calculateROIForMonth = (monthData) => {
  const percent = 15;
  let finalBalanceForOneThousand = 1000;
  let finalBalanceForThreeThousand = 3000;
  let finalBalanceForFiveThousand = 5000;
  const dataArray = [];
  let totalMatch = 0;
  let winMatch = 0;

  Object.keys(monthData).forEach((dayKey) => {
    const records = monthData[dayKey];
    const percentInvestment = percent / 100;

    let winOdds = 0;
    let winM = 0;

    records.forEach((record) => {
      totalMatch++;
      if (record.fields.Results === "TRUE") {
        winOdds += record.fields.PredictedOdds || 0;
        winM++;
        winMatch++;
      }
    });

    if (winM > 0) {
      const avgOdds = winOdds / winM;
      finalBalanceForOneThousand =
        finalBalanceForOneThousand -
        finalBalanceForOneThousand * percentInvestment +
        avgOdds * (winM / records.length) * finalBalanceForOneThousand * percentInvestment;

      finalBalanceForThreeThousand =
        finalBalanceForThreeThousand -
        finalBalanceForThreeThousand * percentInvestment +
        avgOdds * (winM / records.length) * finalBalanceForThreeThousand * percentInvestment;

      finalBalanceForFiveThousand =
        finalBalanceForFiveThousand -
        finalBalanceForFiveThousand * percentInvestment +
        avgOdds * (winM / records.length) * finalBalanceForFiveThousand * percentInvestment;
    }

    // Push date and finalBalance into dataArray as an object
    dataArray.push({
      date: dayKey,
      finalBalance: Number(finalBalanceForOneThousand).toFixed(2),
      finalBalanceForThreeThousand: Number(finalBalanceForThreeThousand).toFixed(2),
      finalBalanceForFiveThousand: Number(finalBalanceForFiveThousand).toFixed(2),
    });
  });

  return {
    roi: finalBalanceForOneThousand,
    roiForThreeThousand: finalBalanceForThreeThousand,
    roiForFiveThousand: finalBalanceForFiveThousand,
    winParc: Number(winMatch / totalMatch * 100).toFixed(2),
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
    const dayKey = date.toISOString().split("T")[0];
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
    const key = `${year}-${month < 10 ? "0" : ""}${month}`;
    if (!groupedByMonth[key]) {
      groupedByMonth[key] = { days: {} };
    }

    const dayKey = date.toISOString().split("T")[0];
    if (!groupedByMonth[key].days[dayKey]) {
      groupedByMonth[key].days[dayKey] = [];
    }
    groupedByMonth[key].days[dayKey].push(record);
  });

  Object.keys(groupedByMonth).forEach((monthKey) => {
    groupedByMonth[monthKey] = calculateROIForMonth(
      groupedByMonth[monthKey].days
    );
  });

  return groupedByMonth;
};

// Get ISO week number from date
function getWeekNumber(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  return (
    1 +
    Math.round(((d - week1) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7)
  );
}

const getRoi = catchAsync(async (req, res) => {

  const { startDate, endDate, initialBalance, percent, filter, game } = req.query;

  const formatDateForAirtable = (date) => moment(date).format('DD-MM-YYYY');

  if (game === 'csgo') {
    if (filter) {
      try {
        const startedDate = new Date(startDate);
        let currentDate = new Date(endDate);
        let finalBalance = initialBalance;
        let dataArray = [];

        while (currentDate <= startedDate) {
          let formatedDate = formatDateForAirtable(currentDate)

          const result = await fetcher.get(csgoTable, {
            params: {
              fields: ["Results", "True/false", "Best-odds-1", "Best-odds-2"],
              filterByFormula: `AND({Date}='${formatedDate}', {upload}=1, NOT(BLANK({Results})))`,
              sort: [{ field: "Date", direction: "asc" }],
            },
          });

          const records = result?.data?.records;
          const percentInvestment = percent / 100;

          if (records.length > 0) {
            const winOdds = records.reduce((sum, record) => {
              if (record.fields["True/false"] === "true") {
                if (record.fields.Results === '1') {
                  return sum + (record.fields["Best-odds-1"] || 0);
                } else if (record.fields.Results === '2') {
                  return sum + (record.fields["Best-odds-2"] || 0);
                }
              }
              return sum;
            }, 0);

            const winM = records.filter(
              (record) => record.fields["True/false"] === "true"
            ).length;

            if (winM > 0) {
              const avgOdds = winOdds / winM;
              finalBalance =
                (finalBalance -
                  finalBalance * percentInvestment +
                  avgOdds *
                  (winM / records.length) *
                  finalBalance *
                  percentInvestment).toFixed(2);
            }
          }

          // Push date and finalBalance into dataArray as an object
          dataArray.push({
            date: currentDate.toISOString().slice(0, 10),
            finalBalance: parseFloat(finalBalance),
          });

          currentDate.setDate(currentDate.getDate() + 1);
        }

        return sendResponse(res, {
          statusCode: 200,
          success: true,
          message: "CSGO Roi calculation is successful",
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
                .slice(0, 10)}', {upload} = 1, NOT({Results} = ''))`,
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

        return sendResponse(res, {
          statusCode: 200,
          success: true,
          message: "CSGO Roi calculation is successful",
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
  }
  else if (game === 'valorant') {
    if (filter) {
      try {
        const startedDate = new Date(startDate);
        let currentDate = new Date(endDate);
        let finalBalance = initialBalance;
        let dataArray = [];

        while (currentDate <= startedDate) {
          const result = await fetcher.get(valorantTable, {
            params: {
              fields: ["Result", "TrueFalse", "BestOdds1", "BestOdds2"],
              filterByFormula: `AND({Date} = '${currentDate
                .toISOString()
                .slice(0, 10)}', {upload} = 1, NOT({Result} = ''))`,
              sort: [{ field: "Date", direction: "asc" }],
            },
          });

          const records = result?.data?.records;
          const percentInvestment = percent / 100;

          if (records.length > 0) {
            const winOdds = records.reduce((sum, record) => {
              if (record.fields.Result === 1) {
                return sum + (record.fields.BestOdds1 || 0);
              } else if (record.fields.Result === 2) {
                return sum + (record.fields.BestOdds1 || 0);
              }
              return sum;
            }, 0);

            const winM = records.filter(
              (record) => record.fields.TrueFalse === "True"
            ).length;

            if (winM > 0) {
              const avgOdds = winOdds / winM;
              finalBalance =
                (finalBalance -
                  finalBalance * percentInvestment +
                  avgOdds *
                  (winM / records.length) *
                  finalBalance *
                  percentInvestment).toFixed(2);
            }
          }

          // Push date and finalBalance into dataArray as an object
          dataArray.push({
            date: currentDate.toISOString().slice(0, 10),
            finalBalance: parseFloat(finalBalance),
          });

          currentDate.setDate(currentDate.getDate() + 1);
        }

        return sendResponse(res, {
          statusCode: 200,
          success: true,
          message: "Valorant Roi calculation is successful",
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

        return sendResponse(res, {
          statusCode: 200,
          success: true,
          message: "Valorant Roi calculation is successful",
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
  }
  else {
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
                (finalBalance -
                  finalBalance * percentInvestment +
                  avgOdds *
                  (winM / records.length) *
                  finalBalance *
                  percentInvestment).toFixed(2);
            }
          }

          // Push date and finalBalance into dataArray as an object
          dataArray.push({
            date: currentDate.toISOString().slice(0, 10),
            finalBalance: parseFloat(finalBalance),
          });

          currentDate.setDate(currentDate.getDate() + 1);
        }

        sendResponse(res, {
          statusCode: 200,
          success: true,
          message: "Soccer Roi calculation is successful",
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
  }
});

const getSoccerRoi = catchAsync(async (req, res) => {
  try {
    const { year, type, weekNumber, monthNumber } = req.query;
    let startDate;
    let endDate;

    if (type === "weekly") {
      const firstDayOfWeek = weekNumber
        ? new Date(year, 0, 1 + (weekNumber - 1) * 7)
        : new Date(year, 11, 1);

      const lastDayOfWeek = weekNumber
        ? new Date(year, 0, 7 * weekNumber)
        : new Date(year, 11, 31);

      startDate = firstDayOfWeek;
      endDate = lastDayOfWeek;
    } else if (type === "monthly") {
      if (monthNumber) {
        startDate = new Date(year, monthNumber - 1, 1);
        endDate = new Date(year, monthNumber, 0);
      } else {
        startDate = new Date(year, 0, 1);
        endDate = new Date(year, 11, 31);
      }
    }

    const allData = [];

    for (
      let currentDate = new Date(startDate);
      currentDate <= endDate;
      currentDate.setDate(currentDate.getDate() + DAYS_PER_REQUEST)
    ) {
      const formattedStartDate = currentDate.toISOString().split("T")[0];
      const nextDate = new Date(currentDate);
      nextDate.setDate(nextDate.getDate() + DAYS_PER_REQUEST - 1);
      const formattedEndDate =
        nextDate <= endDate
          ? nextDate.toISOString().split("T")[0]
          : endDate.toISOString().split("T")[0];

      const response = await axios.get(soccerTable, {
        headers: { Authorization: `Bearer ${apiKey}` },
        params: {
          fields: ["Date", "Results", "PredictedOdds"],
          filterByFormula: `AND(
            NOT({MatchResults} = BLANK()),
            NOT({Prediction} = BLANK()),
            {Date} >= '${formattedStartDate}',
            {Date} <= '${formattedEndDate}'
          )`,
          sort: [{ field: "Date", direction: "asc" }],
        },
      });

      allData.push(...response.data.records);
    }

    const dataGroupedByWeek = groupDataByWeek(allData);
    const dataGroupedByMonth = groupDataByMonth(allData);

    // Filter data only for the requested weekNumber
    const filteredDataByWeek = Object.keys(dataGroupedByWeek).reduce(
      (filtered, key) => {
        if (key.includes(`-W${weekNumber}`)) {
          filtered[key] = dataGroupedByWeek[key];
        }
        return filtered;
      },
      {}
    );

    const filteredDataByMonth = Object.keys(dataGroupedByMonth).reduce(
      (filtered, key) => {
        if (key.includes(`-${monthNumber < 10 ? "0" : ""}${monthNumber}`)) {
          filtered[key] = dataGroupedByMonth[key];
        }
        return filtered;
      },
      {}
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Get Dashboard data Successful",
      data: {
        dataGroupedByWeek: weekNumber ? filteredDataByWeek : dataGroupedByWeek,
        dataGroupedByMonth: monthNumber
          ? filteredDataByMonth
          : dataGroupedByMonth,
      },
      meta: {
        total: allData?.length || 0,
      },
    });
  } catch (error) {
    sendResponse(res, {
      statusCode: 500,
      success: false,
      message: "Error in fetching admin dashboard data",
      error: error.message,
    });
  }
});

module.exports = { getRoi, getSoccerRoi };
