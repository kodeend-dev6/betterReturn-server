const config = require('../config/config');
const handicapTable = config.db.handicapTableUrl;
const soccerTable = config.db.soccerTableUrl;
const catchAsync = require("../utils/errors/catchAsync");
const fetcher = require("../utils/fetcher/airTableFetcher");
const sendResponse = require("../utils/sendResponse");


const getAllHandicap = catchAsync(async (req, res) => {
  const date = req.query.date;
  const finished = req.query.finished;
  const limit = 100;


  if (finished) {

    const result = await fetcher.get(handicapTable, {
      params: {
        filterByFormula: `AND({Date} <= '${date}', {upload}=1)`,
        pageSize: limit,
        sort: [{ field: "Date", direction: "desc" }],
      },
    });


    let data = [];

    for (let i = 0; i < result?.data?.records?.length; i++) {
      const record = result?.data?.records[i];
      let newRecord = { ...record };

      const match = record?.fields?.MatchID
        ? {
          matchId: record?.fields?.MatchID,
          tableUrl: soccerTable,

        }
        : null;

      if (match) {
        const matchData = await fetcher.get(`${match?.tableUrl}`, {
          params: {
            filterByFormula: `{MatchID} = "${match?.matchId}"`,
          },
        });

        newRecord = {
          ...newRecord,
          fields: {
            ...newRecord?.fields,
            ...matchData?.data?.records[0]?.fields,
          },
        };

      }
  
      if (newRecord?.fields?.MatchResults) {
        data.push(newRecord);
      }

      if (finished && data.length >= limit) {
        break;
      }

    }

    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Retrieved all handicap successfully!",
      data,
      meta: {
        total: data.length,
      },
    });

  }
  else {

    const result = await fetcher.get(handicapTable, {
      params: {
        filterByFormula: `AND({Date} = '${date}', {upload}=1)`,
        sort: [{ field: "Date", direction: "desc" }],
      },
    });


    let data = [];

    for (let i = 0; i < result?.data?.records?.length; i++) {
      const record = result?.data?.records[i];
      let newRecord = { ...record };

      const match = record?.fields?.MatchID
        ? {
          matchId: record?.fields?.MatchID,
          tableUrl: soccerTable,

        }
        : null;

      if (match) {
        const matchData = await fetcher.get(`${match?.tableUrl}`, {
          params: {
            filterByFormula: `{MatchID} = "${match?.matchId}"`,
          },
        });

        newRecord = {
          ...newRecord,
          fields: {
            ...newRecord?.fields,
            ...matchData?.data?.records[0]?.fields,
          },
        };
      }

      data.push(newRecord);
    }

    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Retrieved all handicap successfully!",
      data,
      meta: {
        total: data.length,
      },
    });
  }

});

module.exports = {
  getAllHandicap,
};
