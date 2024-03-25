const config = require("../config/config");
const catchAsync = require("../utils/errors/catchAsync");
const fetcher = require("../utils/fetcher/airTableFetcher");
const sendResponse = require("../utils/sendResponse");
const soccerTable = config.db.soccerTableUrl;

const DAYS_PER_REQUEST = 10;

const roiCalculation = catchAsync(async (req, res) => {
  const { startDate, endDate, game } = req.query;
  const initialBalance = parseInt(req?.query?.initialBalance) || 1000;
  const percent = parseInt(req?.query?.percent) || 15;
  const date1 = new Date(startDate);
  const date2 = new Date(endDate);
  const diffTime = Math.abs(date2 - date1);
  const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  try {
    const today = new Date();

    const allSoccerData = [];

    for (let i = 0; i < parseInt(days); i += DAYS_PER_REQUEST) {
      const startDay = i;
      const endDay = Math.min(i + DAYS_PER_REQUEST - 1, parseInt(days) - 1);
      const startDate = new Date(today);
      startDate.setDate(startDate.getDate() - endDay);
      const endDate = new Date(today);
      endDate.setDate(endDate.getDate() - startDay);

      const formattedStartDate = startDate.toISOString().split("T")[0];
      const formattedEndDate = endDate.toISOString().split("T")[0];

      const response = await fetcher.get(soccerTable, {
        params: {
          fields: [
            "HomeTeam",
            "AwayTeam",
            "Prediction",
            "Results",
            "Date",
            "PredictedOdds",
          ],
          filterByFormula: `AND(
                          NOT({MatchResults} = BLANK()),
                          NOT({Prediction} = BLANK()),
                          {upload}=1,
                          {Date} >= '${formattedStartDate}',
                          {Date} <= '${formattedEndDate}'
                      )`,
        },
      });

      allSoccerData.push(...response.data.records);
    }

    const groupData = groupByDate(allSoccerData);
    const proRoi = calculateRoi(groupData, initialBalance, percent / 100);

    const weekendData = separateWeekendData(allSoccerData);
    const groupWeekendData = groupByDate(weekendData);
    const basicRoi = calculateRoi(
      groupWeekendData,
      initialBalance,
      percent / 100
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Roi data get Successfully",
      meta: {
        total: allSoccerData?.length || 0,
      },
      data: { basicRoi, proRoi},
    });
  } catch (error) {
    sendResponse(res, {
      statusCode: 500,
      success: false,
      message: "Error in fetching roi data",
      error: error.message,
    });
  }
});

module.exports = { roiCalculation };

const groupByDate = (allData) => {
  // Grouping allSoccerData by Date
  const groupedSoccerData = allData.reduce((acc, soccerMatch) => {
    const matchDate = soccerMatch.fields.Date;
    if (!acc[matchDate]) {
      acc[matchDate] = [];
    }
    acc[matchDate].push(soccerMatch);
    return acc;
  }, {});

  // Sorting groupedSoccerData by Date in ascending order
  const sortedGroupedSoccerData = Object.keys(groupedSoccerData)
    .sort()
    .reduce((obj, key) => {
      obj[key] = groupedSoccerData[key];
      return obj;
    }, {});

  return sortedGroupedSoccerData;
};

// weekend data  from the all data
const separateWeekendData = (allData) => {
  const weekendData = [];

  allData.forEach((item) => {
    const matchDate = new Date(item.fields.Date);
    const dayOfWeek = matchDate.getDay(); // Returns 0 for Sunday, 1 for Monday, ..., 6 for Saturday

    //   if (dayOfWeek === 6) { // Saturday
    //     weekendData.Saturday.push(item);
    //   } else if (dayOfWeek === 0) { // Sunday
    //     weekendData.Sunday.push(item);
    //   }

    if (dayOfWeek === 6 || dayOfWeek === 0) {
      weekendData.push(item);
    }
  });

  return weekendData;
};

// calculate roi
const calculateRoi = (allData, initialBalance, percent) => {
  let finalBalance = initialBalance || 1000;
  const percentInvestment = percent || 0.15;

  const dataArray = [];

  for (const date in allData) {
    if (Object.hasOwnProperty.call(allData, date)) {
      const matches = allData[date];

      if (matches.length > 0) {
        const winOdds = matches.reduce((sum, record) => {
          if (record.fields.Results === "TRUE") {
            return sum + (record.fields.PredictedOdds || 0);
          }
          return sum;
        }, 0);

        const winM = matches.filter(
          (record) => record.fields.Results === "TRUE"
        ).length;

        if (winM > 0) {
          const avgOdds = winOdds / winM;
          finalBalance = (
            finalBalance -
            finalBalance * percentInvestment +
            avgOdds * (winM / matches.length) * finalBalance * percentInvestment
          ).toFixed(2);
        }
      }
    }
    dataArray.push({ date, finalBalance });
  }
  // console.log(dataArray);
  return {roi:finalBalance, dataArray};
};
