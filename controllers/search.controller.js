const axios = require("axios");
const config = require("../config/config");
const catchAsync = require("../utils/errors/catchAsync");
const sendResponse = require("../utils/sendResponse");
const soccerTable = config.db.soccerTableUrl;
const csgoTable = config.db.csgoTableUrl;
const valorantTable = config.db.valorantTableUrl;
const apiKey = config.key.apiKey;

const searchGame = catchAsync(async (req, res) => {
  const { search, game } = req.query;
  const page = 1;
  const limit = 100;
  const offset = Math.max(0, (page - 1) * limit);

  const escapedSearch = search?.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") || "";

  const today = new Date();
  const formattedToday = today.toISOString().split('T')[0];
 

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
  }
  else if (game === "valorant") {
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
  )`
  }

  const { data: { records } } = await axios.get(table, {
    headers: { Authorization: `Bearer ${apiKey}` },
    params: {
      filterByFormula: filter,
      pageSize: limit,
      offset,
      sort: [{ field: game === "csgo"? 'Created' : 'Date', direction: 'desc' }]
    },
  });


  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Search Successful",
    data: records,
    meta:{
      total: records?.length,
    }
  });
});

module.exports = { searchGame };
