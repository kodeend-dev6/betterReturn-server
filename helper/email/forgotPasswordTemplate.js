const forgotPasswordTemplate = ({ otp }) => {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Forgot Password - OTP Email</title>
      <style>
          body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 0;
              background-color: #f4f4f4;
          }
  
          .container {
              max-width: 600px;
              margin: 20px auto;
              background-color: #fff;
              padding: 20px;
              border-radius: 8px;
              box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
          }
  
          h2 {
              color: #333;
          }
  
          p {
              color: #555;
          }
  
          .otp {
              font-size: 24px;
              font-weight: bold;
              color: #4caf50;
              margin-bottom: 20px;
          }
      </style>
  </head>
  <body>
  
  <div class="container">
      <h2>Forgot Password - OTP</h2>
      <p>Your one-time password (OTP) for password reset is:</p>
      <p class="otp">${otp}</p>
      <p>Please use this OTP to reset your password. This OTP is valid for a short period.</p>
      <p>If you did not request this password reset, please ignore this email.</p>
  </div>
  
  </body>
  </html>
    `;
};

module.exports = forgotPasswordTemplate;
