const catchAsync = require("../utils/errors/catchAsync");
const fetcher = require("../utils/fetcher/airTableFetcher");
const sendResponse = require("../utils/sendResponse");
const config = require("../config/config");

const getAllCombo = catchAsync(async (req, res) => {
  const date = req.query.date;
  const filter = req.query.finished;
  const limit = 20;

  if (filter) {
    const result = await fetcher.get(config.db.comboTableUrl, {
      params: {
        filterByFormula: `{Date} <= '${date}'`,
        pageSize: limit,
        sort: [{ field: "Date", direction: "desc" }],
      },
    });

    let data = [];

    for (let i = 0; i < result?.data?.records?.length; i++) {
      const record = result?.data?.records[i];
      let newRecord = { ...record };

      const gameColumnName = (GamenameIndex) => {
        return record?.fields[GamenameIndex] === "soccer"
          ? "MatchID"
          : record?.fields[GamenameIndex] === "csgo"
            ? "Match-id"
            : record?.fields[GamenameIndex] === "valorant"
              ? "Match-id"
              : null;
      };

      const match1 = record?.fields?.MatchID1
        ? {
          matchId: record?.fields?.MatchID1,
          tableUrl: config.db[`${record?.fields?.Gamename1}TableUrl`],
          columnName: gameColumnName("Gamename1"),
        }
        : null;

      const match2 = record?.fields?.MatchID2
        ? {
          matchId: record?.fields?.MatchID2,
          tableUrl: config.db[`${record?.fields?.Gamename2}TableUrl`],
          columnName: gameColumnName("Gamename2"),
        }
        : null;

      const match3 = record?.fields?.MatchID3
        ? {
          matchId: record?.fields?.MatchID3,
          tableUrl: config.db[`${record?.fields?.Gamename3}TableUrl`],
          columnName: gameColumnName("Gamename3"),
        }
        : null;

      if (match1) {
        const match1Data = await fetcher.get(`${match1?.tableUrl}`, {
          params: {
            filterByFormula: `{${match1?.columnName}} = "${match1?.matchId}"`,
          },
        });

        newRecord = {
          ...newRecord,
          fields: {
            ...newRecord?.fields,
            GameData1: match1Data?.data?.records[0]?.fields,
          },
        };
      }

      if (match2) {
        const match2Data = await fetcher.get(`${match2?.tableUrl}`, {
          params: {
            filterByFormula: `{${match2?.columnName}} = "${match2?.matchId}"`,
          },
        });

        newRecord = {
          ...newRecord,
          fields: {
            ...newRecord?.fields,
            GameData2: match2Data?.data?.records[0]?.fields,
          },
        };
      }

      if (match3) {
        const match3Data = await fetcher.get(`${match3?.tableUrl}`, {
          params: {
            filterByFormula: `{${match3?.columnName}} = "${match3?.matchId}"`,
          },
        });

        newRecord = {
          ...newRecord,
          fields: {
            ...newRecord?.fields,
            GameData3: match3Data?.data?.records[0]?.fields,
          },
        };
      }

      data.push(newRecord);
    }

    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Retrieved all combo successfully!",
      data,
      meta: {
        total: data.length,
      },
    });
  }
  else {
    const result = await fetcher.get(config.db.comboTableUrl, {
      params: {
        filterByFormula: `{Date} = '${date}'`,
        sort: [{ field: "Date", direction: "desc" }],
      },
    });

    let data = [];

    for (let i = 0; i < result?.data?.records?.length; i++) {
      const record = result?.data?.records[i];
      let newRecord = { ...record };

      const gameColumnName = (GamenameIndex) => {
        return record?.fields[GamenameIndex] === "soccer"
          ? "MatchID"
          : record?.fields[GamenameIndex] === "csgo"
            ? "Match-id"
            : record?.fields[GamenameIndex] === "valorant"
              ? "Match-id"
              : null;
      };

      const match1 = record?.fields?.MatchID1
        ? {
          matchId: record?.fields?.MatchID1,
          tableUrl: config.db[`${record?.fields?.Gamename1}TableUrl`],
          columnName: gameColumnName("Gamename1"),
        }
        : null;

      const match2 = record?.fields?.MatchID2
        ? {
          matchId: record?.fields?.MatchID2,
          tableUrl: config.db[`${record?.fields?.Gamename2}TableUrl`],
          columnName: gameColumnName("Gamename2"),
        }
        : null;

      const match3 = record?.fields?.MatchID3
        ? {
          matchId: record?.fields?.MatchID3,
          tableUrl: config.db[`${record?.fields?.Gamename3}TableUrl`],
          columnName: gameColumnName("Gamename3"),
        }
        : null;

      if (match1) {
        const match1Data = await fetcher.get(`${match1?.tableUrl}`, {
          params: {
            filterByFormula: `{${match1?.columnName}} = "${match1?.matchId}"`,
          },
        });

        newRecord = {
          ...newRecord,
          fields: {
            ...newRecord?.fields,
            GameData1: match1Data?.data?.records[0]?.fields,
          },
        };
      }

      if (match2) {
        const match2Data = await fetcher.get(`${match2?.tableUrl}`, {
          params: {
            filterByFormula: `{${match2?.columnName}} = "${match2?.matchId}"`,
          },
        });

        newRecord = {
          ...newRecord,
          fields: {
            ...newRecord?.fields,
            GameData2: match2Data?.data?.records[0]?.fields,
          },
        };
      }

      if (match3) {
        const match3Data = await fetcher.get(`${match3?.tableUrl}`, {
          params: {
            filterByFormula: `{${match3?.columnName}} = "${match3?.matchId}"`,
          },
        });

        newRecord = {
          ...newRecord,
          fields: {
            ...newRecord?.fields,
            GameData3: match3Data?.data?.records[0]?.fields,
          },
        };
      }

      data.push(newRecord);
    }

    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Retrieved all combo successfully!",
      data,
      meta: {
        total: data.length,
      },
    });
  }


});

module.exports = {
  getAllCombo,
};
