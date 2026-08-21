require('dotenv').config();
const nodemailer = require('nodemailer');

async function send() {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: process.env.FROM_EMAIL,
      to: 'aceddivisionllc@gmail.com',
      subject: 'Test QR Check-in Code - Adora & Alora',
      text: 'Here is your test QR code for checking in. Use the clerk station to scan it!',
      html: '<p>Here is your test QR code for checking in. Use the clerk station to scan it!</p><img src="cid:qrcode" />',
      attachments: [
        {
          filename: 'sample_qr.png',
          path: 'c:/Users/ejere/.gemini/antigravity-ide/brain/06d365ca-5b52-45fd-b4bc-5786b460f98b/sample_qr.png',
          cid: 'qrcode'
        }
      ]
    });
    console.log('Email sent: %s', info.messageId);
  } catch (error) {
    console.error('Error sending email:', error);
  }
  process.exit(0);
}
send();
