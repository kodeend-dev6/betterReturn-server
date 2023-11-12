const axios = require("axios");
const ApiError = require("../utils/errors/ApiError");

const createEvent = async ({ email }) => {
  const KLAVIYO_PRIVATE_API_KEY = "pk_3711f1c4388902ff9bdbad9371228001aa";
  const KLAVIYO_LIST_ID = "U2ahMU";

  const options = {
    method: "POST",
    url: "https://a.klaviyo.com/api/events/",
    headers: {
      accept: "application/json",
      revision: "2023-10-15",
      "content-type": "application/json",
      Authorization: `Klaviyo-API-Key ${KLAVIYO_PRIVATE_API_KEY}`,
    },
    data: {
      data: {
        type: "event",
        attributes: {
          time: new Date().toISOString(),
        //   value: 9.99,
          metric: {
            data: {
              type: "metric",
              attributes: { name: "Email Verification Testing" },
            },
          },
          properties: {
            otp: 874214,
          },
          profile: {
            data: {
              type: "profile",
              //   id: "01GDDKASAP8TKDDA2GRZDSVP4H",
              attributes: {
                email: email,
                phone_number: "+15005550006",
                first_name: "Fake",
                last_name: "User",
                title: "Engineer",
                image:
                  "https://images.pexels.com/photos/3760854/pexels-photo-3760854.jpeg",
                location: {
                  address1: "89 E 42nd St",
                  address2: "1st floor",
                  city: "New York",
                  country: "United States",
                  latitude: "40.7128",
                  longitude: "74.0060",
                  region: "NY",
                  zip: "10017",
                  timezone: "America/New_York",
                  ip: "127.0.0.1",
                },
              },
              meta: { patch_properties: { unset: "skus" } },
            },
          },
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

module.exports = createEvent;
