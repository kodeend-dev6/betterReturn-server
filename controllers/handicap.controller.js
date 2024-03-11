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

  let result;

  if (finished) {
    result = await fetcher.get(handicapTable, {
      params: {
        filterByFormula: `AND({Date} <= '${date}', {upload}=1)`,
        pageSize: limit,
        sort: [{ field: "Date", direction: "desc" }],
      },
    });
  } else {
    result = await fetcher.get(handicapTable, {
      params: {
        filterByFormula: `AND({Date} = '${date}', {upload}=1)`,
        sort: [{ field: "Date", direction: "desc" }],
      },
    });
  }

  let data = [];

  const matchIds = result?.data?.records?.map(record => record?.fields?.MatchID).filter(Boolean);

  if (matchIds.length > 0) {
    const soccerResult = await fetcher.get(soccerTable, {
      params: {
        filterByFormula: `OR(${matchIds.map(id => `{MatchID}="${id}"`).join(",")})`,
      },
    });

    const soccerMap = soccerResult?.data?.records?.reduce((map, record) => {
      map[record.fields.MatchID] = record.fields;
      return map;
    }, {});

    for (let i = 0; i < result?.data?.records?.length; i++) {
      const record = result?.data?.records[i];
      let newRecord = { ...record };

      const matchId = record?.fields?.MatchID;
      if (matchId && soccerMap[matchId]) {
        newRecord = {
          ...newRecord,
          fields: {
            ...newRecord.fields,
            ...soccerMap[matchId],
          },
        };
        data.push(newRecord);
      }

      if (finished && data.length >= limit) {
        break;
      }
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
});


module.exports = {
  getAllHandicap,
};
