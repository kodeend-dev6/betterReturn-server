const moment2 = require('moment-timezone');


const convertedToDB = async (value, time, timeZone) => {
  const currentDate = `${value} ${time}`;
  const convertedDateTime = moment2.tz(currentDate, 'YYYY-MM-DD HH:mm', `${timeZone}`).tz('Europe/Stockholm');
  const convertedDate = convertedDateTime.format('YYYY-MM-DD');
  return convertedDate;
}


const convertedToDBValorant = async (value, time, timeZone) => {
  const currentDate = `${value} ${time}`;
  const convertedDateTime = moment2.tz(currentDate, 'YYYY-MM-DD HH:mm', `${timeZone}`).tz('Asia/Dhaka');
  const convertedDate = convertedDateTime.format('YYYY-MM-DD');
  return convertedDate;
}



const convertedFromDBValorant = async (allData, desiredTimeZone) => {
  const item = await allData.map(item => {
    // Convert date and time
    if (item.fields.Date && item.fields.Time) {
      const bdDateTime = `${item.fields.Date} ${item.fields.Time}`;
      const convertedDateTime = moment2.tz(bdDateTime, 'YYYY-MM-DD h:mm A', 'Asia/Dhaka').tz(desiredTimeZone);

      item.fields.Date = convertedDateTime.format('YYYY-MM-DD'); // Update the date field
      item.fields.Time = convertedDateTime.format('HH:mm'); // Update the time field
    }

    return item;
  });

  return item
};

const convertedFromDB = async (allData, desiredTimeZone) => {
  const item = await allData.map(item => {
    // Convert date and time
    if (item.fields.Date && item.fields.Time) {
      const swedenDateTime = `${item.fields.Date} ${item.fields.Time}`;
      const convertedDateTime = moment2.tz(swedenDateTime, 'YYYY-MM-DD h:mm A', 'Europe/Stockholm').tz(desiredTimeZone);

      item.fields.Date = convertedDateTime.format('YYYY-MM-DD'); // Update the date field
      item.fields.Time = convertedDateTime.format('HH:mm'); // Update the time field
    }

    return item;
  });

  return item
};

const convertedFromDBCSGO = async (allData, desiredTimeZone) => {
  const item = await allData.map(item => {
    if (item.fields.Date && item.fields.Time) {
      const dateComponents = item.fields.Date.split("-");
      const date = dateComponents[2] + "-" + dateComponents[1] + "-" + dateComponents[0];

      const swedenDateTime = `${date} ${item.fields.Time}`;
      const convertedDateTime = moment2.tz(swedenDateTime, 'YYYY-MM-DD h:mm A', 'Europe/Stockholm').tz(desiredTimeZone);

      item.fields.Date = convertedDateTime.format('YYYY-MM-DD');
      item.fields.Time = convertedDateTime.format('HH:mm');
    }
    return item;
  });

  return item
};

module.exports = { convertedFromDB, convertedToDB, convertedFromDBCSGO, convertedToDBValorant, convertedFromDBValorant }