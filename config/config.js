const soccerTable = "Soccer";
const csgoTable = "CS:GO";
const valorantTable = "Valorant";
const newsTable = "News";
const userTable = "User";
const reviewTable = "Review";
const planTable = "Plans";
const comboTable = "Combo";
const handicapTable = "Handicap";
const dbSummaryTable = "DBSummary";

const config = {
  db: {
    soccerTableUrl: `https://api.airtable.com/v0/${process.env.AIRTABLE_BASEID}/${soccerTable}`,
    csgoTableUrl: `https://api.airtable.com/v0/${process.env.AIRTABLE_BASEID}/${csgoTable}`,
    valorantTableUrl: `https://api.airtable.com/v0/${process.env.AIRTABLE_BASEID}/${valorantTable}`,
    newsTableUrl: `https://api.airtable.com/v0/${process.env.AIRTABLE_BASEID}/${newsTable}`,
    userTableUrl: `https://api.airtable.com/v0/${process.env.AIRTABLE_BASEID}/${userTable}`,
    reviewTableUrl: `https://api.airtable.com/v0/${process.env.AIRTABLE_BASEID}/${reviewTable}`,
    planTableUrl: `https://api.airtable.com/v0/${process.env.AIRTABLE_BASEID}/${planTable}`,
    comboTableUrl: `https://api.airtable.com/v0/${process.env.AIRTABLE_BASEID}/${comboTable}`,
    handicapTableUrl: `https://api.airtable.com/v0/${process.env.AIRTABLE_BASEID}/${handicapTable}`,
    dbSummaryTableUrl: `https://api.airtable.com/v0/${process.env.AIRTABLE_BASEID}/${dbSummaryTable}`,
  },
  key: {
    apiKey: process.env.AIRTABLE_APIKEY,
  },
};

module.exports = config;
