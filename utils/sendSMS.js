const axios = require("axios");

const sendSMS = async ({ phone, message }) => {
  const CPSMS_USER_NAME = "BetterReturn";
  const CPSMS_CREDENTIALS =
    "QmV0dGVyUmV0dXJuOjMxNmEwOTdiLTllZTItNGJmYy04NzQ0LTVlNjA1NDkyMDAxNA";

  const data = {
    from: CPSMS_USER_NAME,
    to: phone,
    message: message,
  };

  try {
    const response = await axios.post(`https://api.cpsms.dk/v2/send`, data, {
      headers: {
        Authorization: `Basic ${CPSMS_CREDENTIALS}`,
      },
    });

    return response.data;
  } catch (error) {
    throw new Error(error);
  }
};

module.exports = sendSMS;
