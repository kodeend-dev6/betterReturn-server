const soccerTable = "Soccer";
const userTable = "Soccer";
const config = {

    db: {
        soccerTableUrl: `https://api.airtable.com/v0/${process.env.BASEID}/${soccerTable}`,
        userTableUrl: `https://api.airtable.com/v0/${process.env.BASEID}/${userTable}`,
      
    },
    key: {
        apiKey: process.env.APIKEY
    }
}

module.exports = config;