const nodemailer = require('nodemailer');

require('dotenv').config(); // בתחילת הקובץ

const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});


async function sendEmail(toEmail, subject, text) {
    const mailOptions = {
        from: '"GymApp" <gymapp.noreply@gmail.com>', // המייל שיופיע כשולח (אפשר להגדיר פה את המייל שלך)
        to: toEmail,
        subject: subject,
        text: text
    };

    try {
        let info = await transporter.sendMail(mailOptions);
        console.log('Email sent:', info.messageId, info.response);
    } catch (err) {
        console.error('Error sending email:', err);
    }
}
module.exports = {
    sendEmail
};