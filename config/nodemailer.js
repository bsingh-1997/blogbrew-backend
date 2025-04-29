const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const resetLink = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
const mailOptions = {
  from: 'blogbrewofficial@gmail.com',
  to: user.email,
  subject: 'Password Reset Request',
  text: `Click the link to reset your password: ${resetLink}`,
};

transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
    console.log('Error sending email:', error);
  } else {
    console.log('Email sent: ' + info.response);
  }
});
