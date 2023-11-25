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
  const limit = Number(req.query.limit) || 100;
  const offset = Math.max(0, (page - 1) * limit);

  const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  let table = soccerTable;
  let filter = `AND(
    OR(
        REGEX_MATCH(LOWER({HomeTeam}), LOWER('${escapedSearch}')),
        REGEX_MATCH(LOWER({AwayTeam}), LOWER('${escapedSearch}')),
        REGEX_MATCH(LOWER({LeagueName}), LOWER('${escapedSearch}'))
    ),
    NOT({MatchResults} = BLANK())
)`;
  if (game === "csgo") {
    table = csgoTable;
    filter = `AND(OR(
    REGEX_MATCH(LOWER({Team1}), LOWER('${escapedSearch}')),
    REGEX_MATCH(LOWER({Team2}), LOWER('${escapedSearch}')),
    REGEX_MATCH(LOWER({Event}), LOWER('${escapedSearch}'))
    ),
    NOT({Results} = BLANK()
)`;
  } else if (game === "valorant") {
    table = valorantTable;
    filter = `AND(OR(
    REGEX_MATCH(LOWER({Team1}), LOWER('${escapedSearch}')),
    REGEX_MATCH(LOWER({Team2}), LOWER('${escapedSearch}'))
    REGEX_MATCH(LOWER({Event}), LOWER('${escapedSearch}'))
    ),
    NOT({Result} = BLANK())
)`;
  }

  const { data: { records, offset: returnedOffset, totalRecords } } = await axios.get(table, {
    headers: { Authorization: `Bearer ${apiKey}` },
    params: {
      filterByFormula: filter,
      pageSize: limit,
      offset,
    },
  });



  const totalPages = Math.ceil(totalRecords / limit);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Search Successful",
    data: records,
    meta: {
      page,
      limit,
      totalPages,
      totalRecords,
      offset: returnedOffset,
    },
  });
});

module.exports = { searchGame };
