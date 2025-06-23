import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const sendEmail = async (to, subject, html) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,      
    port: 587,                          
    secure: false,                      
    auth: {
      user: process.env.SMTP_USER,      
      pass: process.env.SMTP_PASS,       
    },
  });

  const mailOptions = {
    from: `"${process.env.APP_NAME}" <${process.env.FROM_EMAIL}>`, // e.g. "Teqsha" <no-reply@yourdomain.com>
    to,
    subject,
    html,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ Email sent to:', to);
  } catch (error) {
    console.error('❌ SMTP Error:', error.message);
    throw new Error('Email could not be sent');
  }
};

export default sendEmail;
