const emailVerificationTemplate = ({ otp }) => {
  return `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>OTP Verification</title>
    </head>
    <body style="font-family: Arial, sans-serif;">
    
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ccc; border-radius: 5px;">
    
        <h2 style="color: #333;">OTP Verification</h2>
    
        <p>Hello,</p>
    
        <p>Your One-Time Password (OTP) for verification is:</p>
    
        <div style="background-color: #f5f5f5; padding: 10px; border-radius: 5px; text-align: center; font-size: 24px; margin-bottom: 20px;">
          <strong>${otp}</strong>
        </div>
    
        <p>This OTP is valid for a short period of time. Please do not share it with anyone.</p>
    
        <p>Thank you!</p>
    
        <hr>
    
        <p style="color: #777; font-size: 12px;">This is an automated message. Please do not reply to this email.</p>
    
      </div>
    
    </body>
    </html>
    `;
};

module.exports = emailVerificationTemplate;
