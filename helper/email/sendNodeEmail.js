const nodemailer = require("nodemailer");

const sendNodeEmail = async ({ email, subject, html }) => {
  const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    auth: {
      user: process.env.MAIL_USERNAME,
      pass: process.env.MAIL_PASSWORD,
    },
  });

  // Define the email content
  const mailOptions = {
    from: `${process.env.MAIL_FROM_NAME} ${process.env.MAIL_FROM_ADDRESS}`,
    to: email,
    subject,
    html,
  };

  // Send the email
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Error sending email:", error);
    } else {
      console.log("Email sent:", info.response);
    }
  });
};

module.exports = sendNodeEmail;
