const express = require('express');
const cors = require('cors')
require('dotenv').config()
const bodyParser = require('body-parser');


const soccerRouter = require("./routes/soccer.route");
const csgoRouter = require("./routes/csgo.route");
const valorantRouter = require("./routes/valorant.route");
const newsRouter = require("./routes/news.route");

const app = express();



//middleware
app.use(cors())
app.use(bodyParser.json());


app.use('/api/soccer', soccerRouter);
app.use('/api/csgo', csgoRouter);
app.use('/api/valorant', valorantRouter);
app.use('/api/news', newsRouter);


app.get("/", (req, res) => {
    res.send('Better Return server is running...')
})

app.use((req, res, next)=>{
    res.status(404).json({message : "Route not found"});
    next();
})

app.use((err, req, res, next)=>{
   
})

module.exports = app;