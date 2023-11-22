const moment2 = require("moment-timezone");

const convertedToDB = async (value, time, timeZone) => {
  const currentDate = `${value} ${time}`;
  const convertedDateTime = moment2
    .tz(currentDate, "YYYY-MM-DD HH:mm", `${timeZone}`)
    .tz("Europe/Stockholm");
  const convertedDate = convertedDateTime.format("YYYY-MM-DD");
  return convertedDate;
};

const convertedToDBValorant = async (value, time, timeZone) => {
  const currentDate = `${value} ${time}`;
  const convertedDateTime = moment2
    .tz(currentDate, "YYYY-MM-DD HH:mm", `${timeZone}`)
    .tz("Asia/Dhaka");
  const convertedDate = convertedDateTime.format("YYYY-MM-DD");
  return convertedDate;
};

const convertedFromDBValorant = async (
  allData,
  desiredTimeZone,
  desiredDate
) => {
  const convertedData = [];
  for (const item of allData) {
    if (item.fields.Date && item.fields.Time) {
      const bdDateTime = `${item.fields.Date} ${item.fields.Time}`;
      const convertedDateTime = moment2
        .tz(bdDateTime, "YYYY-MM-DD h:mm A", "Asia/Dhaka")
        .tz(desiredTimeZone);

      if (
        desiredDate &&
        convertedDateTime.format("YYYY-MM-DD") !== desiredDate
      ) {
        continue;
      }

      item.fields.Date = convertedDateTime.format("YYYY-MM-DD"); // Update the date field
      item.fields.Time = convertedDateTime.format("HH:mm"); // Update the time field
    }

    convertedData.push(item);
  }
  return convertedData;
};

const convertedFromDB = async (allData, desiredTimeZone, desiredDate) => {
  const convertedData = [];
  for (const item of allData) {
    if (item.fields.Date && item.fields.Time) {
      const swedenDateTime = `${item.fields.Date} ${item.fields.Time}`;
      const convertedDateTime = moment2
        .tz(swedenDateTime, "YYYY-MM-DD HH:mm", "Europe/Stockholm")
        .tz(desiredTimeZone);

      if (
        desiredDate &&
        convertedDateTime.format("YYYY-MM-DD") !== desiredDate
      ) {
        continue;
      }

      item.fields.Date = convertedDateTime.format("YYYY-MM-DD"); // Update the date field
      item.fields.Time = convertedDateTime.format("HH:mm"); // Update the time field
    }

    convertedData.push(item);
  }
  return convertedData;
};

const convertedFromDBCSGO = async (allData, desiredTimeZone, desiredDate) => {
  const convertedData = [];
  for (const item of allData) {
    if (item.fields.Date && item.fields.Time) {
      const dateComponents = item.fields.Date.split("-");
      const date =
        dateComponents[2] + "-" + dateComponents[1] + "-" + dateComponents[0];

      const swedenDateTime = `${date} ${item.fields.Time}`;
      const convertedDateTime = moment2
        .tz(swedenDateTime, "YYYY-MM-DD h:mm A", "Europe/Stockholm")
        .tz(desiredTimeZone);

      console.log(desiredDate, convertedDateTime.format("YYYY-MM-DD"));

      if (
        desiredDate &&
        convertedDateTime.format("YYYY-MM-DD") !== desiredDate
      ) {
        continue;
      }

      item.fields.Date = convertedDateTime.format("YYYY-MM-DD");
      item.fields.Time = convertedDateTime.format("HH:mm");
    }
    convertedData.push(item);
  }
  return convertedData;
};

module.exports = {
  convertedFromDB,
  convertedToDB,
  convertedFromDBCSGO,
  convertedToDBValorant,
  convertedFromDBValorant,
};
