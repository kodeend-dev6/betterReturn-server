const config = require("../config/config");
const catchAsync = require("../utils/errors/catchAsync");
const fetcher = require("../utils/fetcher/airTableFetcher");
const sendResponse = require("../utils/sendResponse");
const soccerTable = config.db.soccerTableUrl;
const handicapTable = config.db.handicapTableUrl;

const DAYS_PER_REQUEST = 10;

const getBannerData2 = catchAsync(async (req, res) => {
  try {
    const days = 30;
    const days2 = 15;
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

    allSoccerData.sort((a, b) => {
      const dateA = new Date(a.fields.Date);
      const dateB = new Date(b.fields.Date);
      return dateB - dateA;
    });

    const sevenDaysData = [];
    const fifteenDysData = [];
    const lastFiveMatches = [];

    for (let i = 0; i < allSoccerData.length; i++) {
      if (i < 5) {
        lastFiveMatches.push(allSoccerData[i]);
      }
      const date = new Date(allSoccerData[i].fields.Date);
      const dateDiff = Math.floor(
        (today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (dateDiff < 7) {
        sevenDaysData.push(allSoccerData[i]);
      }
      if (dateDiff < 15) {
        fifteenDysData.push(allSoccerData[i]);
      }
    }

    const sortedGroupedSoccerData = groupByDate(allSoccerData);
    const groupedFifteenDaysData = groupByDate(fifteenDysData);
    const groupedSevenDaysData = groupByDate(sevenDaysData);

    const sevenDaysRoi = calculateRoi(groupedSevenDaysData);
    const fifteenDaysRoi = calculateRoi(groupedFifteenDaysData);
    const thirtyDaysRoi = calculateRoi(sortedGroupedSoccerData);

    const fifteeenDaysAccuracy = calculateAccuracy(fifteenDysData);


  
      // handicap part
  const allHandicapData = [];
  for (let i = 0; i < parseInt(days2); i += DAYS_PER_REQUEST) {
    const startDay = i;
    const endDay = Math.min(i + DAYS_PER_REQUEST - 1, parseInt(days2) - 1);
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - endDay);
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() - startDay);

    const formattedStartDate = startDate.toISOString().split("T")[0];
    const formattedEndDate = endDate.toISOString().split("T")[0];

    const response = await fetcher.get(handicapTable, {
      
      params: {
        filterByFormula: `AND(
                    NOT({T1CornerResult} = BLANK()),
                    {Date} >= '${formattedStartDate}',
                    {Date} <= '${formattedEndDate}'
                )`,
        sort: [{ field: "Date", direction: "desc" }],
      },
    });

    allHandicapData.push(...response.data.records);
  }

  let handicapWin = 0;
  let handicapLost = 0;
  let handicapTotalOdds = 0;

  for (let i = 0; i < allHandicapData?.length; i++) {
    const match = allHandicapData[i];
    if (match?.fields?.T1CornerResult) {
      if (match?.fields?.T1CornerResult === "True") {
        handicapWin++;
        handicapTotalOdds += Number(match?.fields?.T1CornerOdds);
      } else {
        handicapLost++;
      }
    }
    if (match?.fields?.T2CornerResult) {
      if (match?.fields?.T2CornerResult === "True") {
        handicapWin++;
        handicapTotalOdds += Number(match?.fields?.T2CornerOdds);
      } else {
        handicapLost++;
      }
    }
    if (match?.fields?.TCornerResult) {
      if (match?.fields?.TCornerResult === "True") {
        handicapWin++;
        handicapTotalOdds += Number(match?.fields?.TCornerOdds);
      } else {
        handicapLost++;
      }
    }

    if (match?.fields?.T1GoalUOResult) {
      if (match?.fields?.T1GoalUOResult === "True") {
        handicapWin++;
        handicapTotalOdds += Number(match?.fields?.T1GoalUOOdds);
      } else {
        handicapLost++;
      }
    }
    if (match?.fields?.T2GoalUOResult) {
      if (match?.fields?.T2GoalUOResult === "True") {
        handicapWin++;
        handicapTotalOdds += Number(match?.fields?.T2GoalUOOdds);
      } else {
        handicapLost++;
      }
    }
    if (match?.fields?.TGoalUOResult) {
      if (match?.fields?.TGoalUOResult === "True") {
        handicapWin++;
        handicapTotalOdds += Number(match?.fields?.TGoalUOOdds);
      } else {
        handicapLost++;
      }
    }
  }

  const handicapTotal = handicapWin + handicapLost;

  const handicapWinParc = ((handicapWin / handicapTotal) * 100).toFixed(2);
  const handicapAverageOdds = (handicapTotalOdds / handicapWin).toFixed(2);
  const handicapData = {
    handicapLost,
    handicapWin,
    handicapAverageOdds,
    handicapDays: days,
    winParc: handicapWinParc,
    total: handicapTotal,
  };


    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Banner data get successfully",
      meta: {
        total: allSoccerData.length,
      },
      data: {
        sevenDaysRoi,
        fifteenDaysRoi,
        thirtyDaysRoi,
        soccer: fifteeenDaysAccuracy,
        handicapData,
        lastFiveMatches,
      },
    });
  } catch (error) {
    sendResponse(res, {
      statusCode: 500,
      success: false,
      message: "Error in fetching banner data",
      error: error.message,
    });
  }
});

module.exports = {
  getBannerData2,
};


// fifteen days accuracy calculation
const calculateAccuracy = (allData) => {
  let win = 0;
  let lost = 0;

  for (let i = 0; i < allData.length; i++) {
    if (allData[i].fields.Results === "TRUE") {
      win++;
    } else {
      lost++;
    }
  }

  const total = win + lost;
  const winParc = ((win / total) * 100).toFixed(2);

  const accuracyData = {
    win,
    lost,
    winParc,
    total,
  };

  return accuracyData;
};



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

// create a function for roi calculation and return the final balance
const calculateRoi = (allData) => {
  let finalBalance = 1000;
  const percentInvestment = 0.15;

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
  }
  return finalBalance;
};
