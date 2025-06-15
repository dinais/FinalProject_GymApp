const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false, // כי 587 זה TLS (STARTTLS)
    auth: {
        user: '8fbb6f001@smtp-brevo.com',
        pass: 'jYN3h2G6aKE7SWk9'
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