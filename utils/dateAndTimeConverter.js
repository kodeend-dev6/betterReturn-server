const moment2 = require('moment-timezone');

const convertedData = async (allData, desiredTimeZone) => {
    // const item = await allData.map(item => {
    //     if (item.fields.Date) {
    //         const swedenDate = item.fields.Date; // Get the date value
    //         const convertedDate = moment2.tz(swedenDate, 'YYYY-MM-DD', 'Europe/Stockholm').tz(desiredTimeZone);
    //         item.fields.Date = convertedDate.format('YYYY-MM-DD'); // Update the date field in the data
    //     }

    //     // Convert time
    //     if (item.fields.Time) {
    //         const swedenTime = item.fields.Time; // Get the time value
    //         const convertedTime = moment2.tz(swedenTime, 'h:mm A', 'Europe/Stockholm').tz(desiredTimeZone);
    //         item.fields.Time = convertedTime.format('HH:mm'); // Update the time field in the data
    //     }

    //     return item;
    // });

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

module.exports = convertedData