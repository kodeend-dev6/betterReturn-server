const soccerTable = "Soccer";
const csgoTable = "CS:GO";
const valorantTable = "Valorant";
const newsTable = "News";
const userTable = "User";
const config = {

    db: {
        soccerTableUrl: `https://api.airtable.com/v0/${process.env.BASEID}/${soccerTable}`,
        csgoTableUrl: `https://api.airtable.com/v0/${process.env.BASEID}/${csgoTable}`,
        valorantTableUrl: `https://api.airtable.com/v0/${process.env.BASEID}/${valorantTable}`,  
        newsTableUrl: `https://api.airtable.com/v0/${process.env.BASEID}/${newsTable}`,  
        userTableUrl: `https://api.airtable.com/v0/${process.env.BASEID}/${userTable}`  
    },
    key: {
        apiKey: process.env.APIKEY
    }
}

module.exports = config;