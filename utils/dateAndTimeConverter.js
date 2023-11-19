const moment2 = require('moment-timezone');

const convertedData = (allData, desiredTimeZone) => {
    allData.map(item => {
        // Convert date
        if (item.fields.Date) {
            const swedenDate = item.fields.Date; // Get the date value
            const convertedDate = moment2.tz(swedenDate, 'YYYY-MM-DD', 'Europe/Stockholm').tz(desiredTimeZone);
            item.fields.Date = convertedDate.format('YYYY-MM-DD'); // Update the date field in the data
        }

        // Convert time
        if (item.fields.Time) {
            const swedenTime = item.fields.Time; // Get the time value
            const convertedTime = moment2.tz(swedenTime, 'h:mm A', 'Europe/Stockholm').tz(desiredTimeZone);
            item.fields.Time = convertedTime.format('hh:mm A'); // Update the time field in the data
        }

        return item;
    })
};

module.exports(convertedData)