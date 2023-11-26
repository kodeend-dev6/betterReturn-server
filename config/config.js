const soccerTable = "Soccer";
const csgoTable = "CS:GO";
const valorantTable = "Valorant";
const newsTable = "News";
const userTable = "User";
const config = {

    db: {
        soccerTableUrl: `https://api.airtable.com/v0/${process.env.AIRTABLE_BASEID}/${soccerTable}`,
        csgoTableUrl: `https://api.airtable.com/v0/${process.env.AIRTABLE_BASEID}/${csgoTable}`,
        valorantTableUrl: `https://api.airtable.com/v0/${process.env.AIRTABLE_BASEID}/${valorantTable}`,  
        newsTableUrl: `https://api.airtable.com/v0/${process.env.AIRTABLE_BASEID}/${newsTable}`,  
        userTableUrl: `https://api.airtable.com/v0/${process.env.AIRTABLE_TEST_BASEID}/${userTable}`  
    },
    key: {
        apiKey: process.env.AIRTABLE_APIKEY
    }
}

module.exports = config;