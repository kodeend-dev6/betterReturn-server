const axios = require("axios");
const { URLSearchParams } = require("url");
const fetch = require("node-fetch");
const encodedParams = new URLSearchParams();

const sendEmail = async ({ email, subject, properties }) => {
  const template_id = "Rm6bzc";
  const apiKey = process.env.EMAIL_API_KEY;

  // const options = {
  //   method: "POST",
  //   url: "https://a.klaviyo.com/api/template-render/",
  //   headers: {
  //     accept: "application/json",
  //     revision: "2023-10-15",
  //     "content-type": "application/json",
  //     Authorization: `Klaviyo-API-Key ${apiKey}`,
  //   },
  //   data: {
  //     data: {
  //       type: "template",
  //       attributes: { context: { newKey: "New Value" } },
  //       id: template_id,
  //     },
  //   },
  // };

  axios
    .request(options)
    .then(function (response) {
      console.log(response.data);
    })
    .catch(function (error) {
      console.error(error);
    });
};

module.exports = sendEmail;
