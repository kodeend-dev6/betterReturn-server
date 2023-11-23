const config = require("../config/config");
const csgoTable = config.db.csgoTableUrl;
const apiKey = config.key.apiKey;
const axios = require("axios");
const moment = require("moment");
const {
  convertedToDB,
  convertedFromDBCSGO,
} = require("../utils/dateAndTimeConverter");
const catchAsync = require("../utils/errors/catchAsync");
const sendResponse = require("../utils/sendResponse");

const getAllCsgoMatches = async (req, res) => {
  try {
    const headers = {
      Authorization: `Bearer ${apiKey}`,
    };

    const response = await axios.get(csgoTable, { headers });
    const data = response.data;

    // Process and send the data as a JSON response
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch data from Airtable" });
  }
};

// Get All CS:GO Matches including finished and next matches
const getAllCsgoMatchesByDate = catchAsync(async (req, res) => {
  const { value, time, timeZone, filter } = req.query;

  if (filter === "finished") {
    // const selectedDay = req.query.selectedDay;
    const selectedDay = await convertedToDB(value, time, timeZone);

    const dateComponents = selectedDay.split("-");
    const date =
      dateComponents[2] + "-" + dateComponents[1] + "-" + dateComponents[0];

    const fristPrevious = moment(date, "DD-MM-YYYY")
      .subtract(1, "days")
      .format("DD-MM-YYYY");
    const secondPrevious = moment(date, "DD-MM-YYYY")
      .subtract(2, "days")
      .format("DD-MM-YYYY");

    // const [data1, data2, data3] = await Promise.all([
    //   axios.get(csgoTable, {
    //     headers: { Authorization: `Bearer ${apiKey}` },
    //     params: {
    //       filterByFormula: `AND({Date}='${date}', {upload}=1)`,
    //     },
    //   }),
    //   axios.get(csgoTable, {
    //     headers: { Authorization: `Bearer ${apiKey}` },
    //     params: {
    //       filterByFormula: `AND({Date}='${fristPrevious}', {upload}=1)`,
    //     },
    //   }),
    //   axios.get(csgoTable, {
    //     headers: { Authorization: `Bearer ${apiKey}` },
    //     params: {
    //       filterByFormula: `AND({Date}='${secondPrevious}', {upload}=1)`,
    //     },
    //   }),
    // ]);

    // let combinedData = [
    //   ...data1.data.records,
    //   ...data2.data.records,
    //   ...data3.data.records,
    // ];

    const response = await axios.get(csgoTable, {
      headers: { Authorization: `Bearer ${apiKey}` },
      params: {
        filterByFormula: `AND(OR({Date}='${date}', {Date}='${fristPrevious}', {Date}='${secondPrevious}'), {upload}=1)`,
      },
    });

    const allData = response.data.records;

    const filterData = allData.filter((data) => data.fields.Results);
    const convertedDatas = await convertedFromDBCSGO(filterData, timeZone);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "CS:GO Match retrieved successfully",
      data: convertedDatas,
    });
  } else {
    const field = "Date";

    if (!field || !value) {
      return res
        .status(400)
        .json({ error: "Both field and value parameters are required." });
    }

    const convertedDate = await convertedToDB(value, time, timeZone);

    const dateComponents = convertedDate.split("-");
    const date =
      dateComponents[2] + "-" + dateComponents[1] + "-" + dateComponents[0];
    const startDate = moment(date).subtract(1, "days").format("YYYY-MM-DD");
    const endDate = moment(date).add(1, "days").format("YYYY-MM-DD");

    const headers = {
      Authorization: `Bearer ${apiKey}`,
    };

    const response = await axios.get(csgoTable, {
      headers,
      params: {
        filterByFormula: `AND(OR({${field}}='${startDate}', {${field}}='${date}', {${field}}='${endDate}'), {upload}=1)`,
      },
    });
    const allData = response.data.records;

    const convertedDatas = await convertedFromDBCSGO(allData, timeZone, value);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "CS:GO Match retrieved successfully",
      data: convertedDatas,
    });
  }
});

// Get Single CS:GO Match
const getSingleCsgoMatch = catchAsync(async (req, res) => {
  const matchID = req.params.matchID;

  const url = `${csgoTable}/${matchID}`;
  const headers = {
    Authorization: `Bearer ${apiKey}`,
  };

  const response = await axios.get(url, { headers });
  const data = response.data;

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "CS:GO Match retrieved successfully",
    data,
  });
});

const getAllFinishedCsgoMatches = async (req, res) => {
  try {
    const selectedDay = req.query.selectedDay;

    const dateComponents = selectedDay.split("-");
    const date =
      dateComponents[2] + "-" + dateComponents[1] + "-" + dateComponents[0];

    const fristPrevious = moment(date, "DD-MM-YYYY")
      .subtract(1, "days")
      .format("DD-MM-YYYY");
    const secondPrevious = moment(date, "DD-MM-YYYY")
      .subtract(2, "days")
      .format("DD-MM-YYYY");

    const [data1, data2, data3] = await Promise.all([
      axios.get(csgoTable, {
        headers: { Authorization: `Bearer ${apiKey}` },
        params: {
          filterByFormula: `AND({Date}='${date}', {upload}=1)`,
        },
      }),
      axios.get(csgoTable, {
        headers: { Authorization: `Bearer ${apiKey}` },
        params: {
          filterByFormula: `AND({Date}='${fristPrevious}', {upload}=1)`,
        },
      }),
      axios.get(csgoTable, {
        headers: { Authorization: `Bearer ${apiKey}` },
        params: {
          filterByFormula: `AND({Date}='${secondPrevious}', {upload}=1)`,
        },
      }),
    ]);

    let combinedData = [
      ...data1.data.records,
      ...data2.data.records,
      ...data3.data.records,
    ];

    res.json(combinedData);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  }
};

const createNewCsgoMatch = async (req, res) => {
  const { fields } = req.body;
  const dateValue = fields.Date;

  const dateComponents = dateValue.split("-");
  const date =
    dateComponents[2] + "-" + dateComponents[1] + "-" + dateComponents[0];

  const data = { fields };
  data.fields["Date"] = date;

  try {
    const response = await axios.post(csgoTable, data, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });
    console.log("Record added successfully:", response.data);
    res.status(201).json({
      success: true,
      message: "Successfully added..",
    });
  } catch (error) {
    console.error("Error adding record:", error);
    res.status(500).send("Error adding record to Airtable.");
  }
};

const updateOneCsgoMatch = async (req, res) => {
  const { recordId } = req.params;
  const { fields } = req.body;

  try {
    const airtableURL = `${csgoTable}/${recordId}`;
    const headers = {
      Authorization: `Bearer ${apiKey}`,
    };

    const data = { fields };

    const response = await axios.patch(airtableURL, data, { headers });

    if (response.status === 200) {
      res.status(200).json({ message: "Record updated successfully" });
    } else {
      res.status(response.status).json(response.data);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating the record" });
  }
};

const deleteOneCsgoMatch = async (req, res) => {
  const { recordId } = req.params;

  try {
    const airtableURL = `${csgoTable}/${recordId}`;
    const headers = {
      Authorization: `Bearer ${apiKey}`,
    };

    const response = await axios.delete(airtableURL, { headers });

    if (response.status === 200) {
      res.status(204).json({ message: "Record deleted successfully" });
    } else {
      res.status(response.status).json(response.data);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting the record" });
  }
};

module.exports = {
  getAllCsgoMatches,
  getSingleCsgoMatch,
  getAllCsgoMatchesByDate,
  createNewCsgoMatch,
  updateOneCsgoMatch,
  deleteOneCsgoMatch,
  getAllFinishedCsgoMatches,
};
