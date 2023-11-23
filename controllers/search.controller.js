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
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const offset = (page - 1) * limit;
  const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  let table = soccerTable;
  let filter = `OR(
    REGEX_MATCH(LOWER({HomeTeam}), LOWER('${escapedSearch}')),
    REGEX_MATCH(LOWER({AwayTeam}), LOWER('${escapedSearch}')),
    REGEX_MATCH(LOWER({LeagueName}), LOWER('${escapedSearch}'))
)`;
  if (game === "csgo") {
    table = csgoTable;
    filter = `OR(
    REGEX_MATCH(LOWER({Team1}), LOWER('${escapedSearch}')),
    REGEX_MATCH(LOWER({Team2}), LOWER('${escapedSearch}')),
    REGEX_MATCH(LOWER({Event}), LOWER('${escapedSearch}'))
)`;
  } else if (game === "valorant") {
    table = valorantTable;
    filter = `OR(
    REGEX_MATCH(LOWER({Team1}), LOWER('${escapedSearch}')),
    REGEX_MATCH(LOWER({Team2}), LOWER('${escapedSearch}'))
    REGEX_MATCH(LOWER({Event}), LOWER('${escapedSearch}'))
)`;
  }

  const { data } = await axios.get(table, {
    headers: { Authorization: `Bearer ${apiKey}` },
    params: {
      filterByFormula: filter,
      pageSize: limit,
      offset,
    },
  });

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Search Successful",
data: data?.records,
    meta: {
      page,
      limit,
      totalPages: Math.ceil(data?.records?.length / limit),
      totalRecords: data?.records?.length,
    },
  });
});

module.exports = { searchGame };
