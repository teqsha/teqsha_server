import sendEmail from '../utils/emailService.js';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const EmailSend = async (toEmail, userName) => {
  const mailOptions = {
    from: '"Teqsha Support" <yourmail@gmail.com>',
    to: toEmail,
    subject: "Welcome to Teqsha! 🎉",
    html: `
      <h2>Hello ${userName},</h2>
      <p>Your account has been created successfully!</p>
      <p>Thank you for joining Teqsha. We’re happy to have you onboard!</p>
      <br/>
      <p>Regards,<br/>Teqsha Team</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("📧 Account creation email sent successfully.");
  } catch (error) {
    console.error("❌ Failed to send email: ", error);
  }
};

export default EmailSend;
