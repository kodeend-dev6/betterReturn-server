const axios = require("axios");
const config = require("../config/config");
const catchAsync = require("../utils/errors/catchAsync");
const sendResponse = require("../utils/sendResponse");
const soccerTable = config.db.soccerTableUrl;
const csgoTable = config.db.csgoTableUrl;
const valorantTable = config.db.valorantTableUrl;
const handicapTable = config.db.handicapTableUrl;
const apiKey = config.key.apiKey;

const searchGame = catchAsync(async (req, res) => {
  const { search, game } = req.query;
  const page = 1;
  const limit = 100;
  const offset = Math.max(0, (page - 1) * limit);

  const escapedSearch = search?.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") || "";

  const today = new Date();
  const formattedToday = today.toISOString().split("T")[0];

  let filter;
  let table;
  if (game === "csgo") {
    table = csgoTable;
    filter = `AND(OR(
    REGEX_MATCH(LOWER({Team1}), LOWER('${escapedSearch}')),
    REGEX_MATCH(LOWER({Team2}), LOWER('${escapedSearch}')),
    REGEX_MATCH(LOWER({Event}), LOWER('${escapedSearch}'))
    ),
    NOT({Results} = BLANK()),
    {upload}=1 
)`;
  } else if (game === "valorant") {
    table = valorantTable;
    filter = `AND(OR(
    REGEX_MATCH(LOWER({Team1}), LOWER('${escapedSearch}')),
    REGEX_MATCH(LOWER({Team2}), LOWER('${escapedSearch}')),
    REGEX_MATCH(LOWER({Event}), LOWER('${escapedSearch}'))
    ),
    NOT({Result} = BLANK()),
    {Date} <= '${formattedToday}',
    {upload}=1
)`;
  } else {
    table = soccerTable;
    filter = `AND(
      OR(
          REGEX_MATCH(LOWER({HomeTeam}), LOWER('${escapedSearch}')),
          REGEX_MATCH(LOWER({AwayTeam}), LOWER('${escapedSearch}')),
          REGEX_MATCH(LOWER({LeagueName}), LOWER('${escapedSearch}'))
      ),
      NOT({MatchResults} = BLANK()),
      {Date} <= '${formattedToday}',
      {upload}=1
  )`;
  }

  const {
    data: { records },
  } = await axios.get(table, {
    headers: { Authorization: `Bearer ${apiKey}` },
    params: {
      filterByFormula: filter,
      pageSize: limit,
      offset,
      sort: [
        { field: game === "csgo" ? "Created" : "Date", direction: "desc" },
      ],
    },
  });

  let soccerData = [];

  if (game === "soccer") {
    soccerData = await ModifiedPrediction(records);
  }

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Search Successful",
    data: game === "soccer" ? soccerData : records,
    meta: {
      total: game === "soccer" ? soccerData?.length : records?.length,
    },
  });
});

module.exports = { searchGame };

const ModifiedPrediction = async (allData) => {
  const headers = {
    Authorization: `Bearer ${apiKey}`,
  };

  for (let i = 0; i < allData.length; i++) {
    if (allData[i]?.fields?.HandicapMainpage) {
      const match = allData[i];
      const matchId = match?.fields?.MatchID;
      const handicapUrl = `${handicapTable}?filterByFormula=AND({MatchID}='${matchId}')`;
      const handicapResponse = await axios.get(handicapUrl, { headers });
      const handicapData = handicapResponse.data.records;

      if (
        handicapData[0]?.fields?.Home.trim().toLowerCase() ===
        match.fields.HandicapMainpage.trim().toLowerCase()
      ) {
        match.fields.Prediction =
          handicapData[0]?.fields?.Home +
          " Corner Kicks" +
          "(" +
          handicapData[0]?.fields?.T1CornerPredict1 +
          ")";
        match.fields.PredictedOdds = Number(
          handicapData[0]?.fields.T1CornerOdds
        );
        match.fields.Results =
          handicapData[0]?.fields.T1CornerResult?.toUpperCase();
      } else if (
        handicapData[0]?.fields?.Away.trim().toLowerCase() ===
        match.fields.HandicapMainpage.trim().toLowerCase()
      ) {
        match.fields.Prediction =
          handicapData[0]?.fields?.Away +
          " Corner Kicks" +
          "(" +
          handicapData[0]?.fields?.T2CornerPredict1 +
          ")";
        match.fields.PredictedOdds = Number(
          handicapData[0]?.fields?.T2CornerOdds
        );
        match.fields.Results =
          handicapData[0]?.fields.T2CornerResult?.toUpperCase();
      } else {
        match.fields.Prediction =
          "Total" +
          " Corner Kicks" +
          "(" +
          handicapData[0]?.fields?.TCornerPredict1 +
          ")";
        match.fields.PredictedOdds = Number(
          handicapData[0]?.fields?.TCornerOdds
        );
        match.fields.Results =
          handicapData[0]?.fields?.TCornerResult?.toUpperCase();
      }
    }
  }

  return allData;
};
