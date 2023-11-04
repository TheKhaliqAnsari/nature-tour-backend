const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
  // 1) Create a transporter
  const transporter = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 25,
    auth: {
      user: "8477fff2738268",
      pass: "c2d4436e5b34aa",
    },
  });
  // 2. Define the email options
  console.log("here in mail", options.to)
  const mailOptions = {
    from: "Khaliq Ansari <khaliq@crio.do>",
    to: options.to,
    subject: options.subject,
    text: options.message,
  };
  console.log("now here", options.to)
  // 3 Actually send the email
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
