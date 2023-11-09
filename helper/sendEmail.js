const axios = require("axios");

const sendEmail = async ({ email, subject, properties }) => {
  const template_id = "Wn2sfD";
  const apiKey = process.env.EMAIL_API_KEY;
  const endpoint = `https://a.klaviyo.com/api/v1/email-template/${template_id}/send?api_key=${apiKey}`;

  const data = new URLSearchParams();
  data.append("from_email", "info@betterreturn.net");
  data.append("from_name", "Better Return");
  data.append("subject", "Email Verification");
  data.append("to", JSON.stringify([{ name: "Dev 4", email: email }]));
  data.append(
    "context",
    JSON.stringify({ name: "George Washington", state: "VA" })
  );

  const headers = {
    accept: "application/json",
    "content-type": "application/x-www-form-urlencoded",
  };

  try {
    const response = await axios.post(endpoint, data, { headers });
    console.log("Email sent:", response.data);
    return response?.data;
  } catch (error) {
    console.error("Email sending failed:", error);
    throw error;
  }
};

module.exports = sendEmail;
