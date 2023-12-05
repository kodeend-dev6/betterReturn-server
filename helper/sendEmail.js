const axios = require("axios");
const ApiError = require("../utils/errors/ApiError");
const crypto = require("crypto");

const sendEmail = async ({ email, subject, properties }) => {
  const otp = crypto.randomInt(100000, 999999);

  const template_id = "Rm6bzc";
  const KLAVIYO_PRIVATE_API_KEY = "pk_3711f1c4388902ff9bdbad9371228001aa";
  const KLAVIYO_LIST_ID = "U2ahMU";

  // ------------ Subscribe Email --------------
  const options = {
    method: "POST",
    url: "https://a.klaviyo.com/api/profile-subscription-bulk-create-jobs/",
    headers: {
      accept: "application/json",
      revision: "2023-10-15",
      "content-type": "application/json",
      Authorization: `Klaviyo-API-Key ${KLAVIYO_PRIVATE_API_KEY}`,
    },
    data: {
      data: {
        type: "profile-subscription-bulk-create-job",
        attributes: {
          profiles: {
            otp: otp,
            data: [
              {
                type: "profile",
                attributes: {
                  email: email,
                  // phone_number: "+8801912056534",
                  subscriptions: {
                    email: { marketing: { consent: "SUBSCRIBED" } },
                    // sms: { marketing: { consent: "SUBSCRIBED" } },
                  },
                },
              },
            ],
          },
        },
        relationships: {
          list: { data: { type: "list", id: KLAVIYO_LIST_ID } },
        },
      },
    },
  };

  try {
    const res = await axios.request(options);

    return res?.data;
  } catch (error) {
    console.log(error?.response?.data);
    throw new ApiError(500, error?.message || "Error sending email");
  }
};

module.exports = sendEmail;
