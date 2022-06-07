const express = require("express");
const nodemailer = require("nodemailer");
const OAuth2 = require("google-auth-library");
const dotenv = require("dotenv");

dotenv.config();
const app = express();
app.use(express.json());

// Khởi tạo OAuth2Client với Client ID và Client Secret
const myOauth2Client = new OAuth2.OAuth2Client(
  process.env.GOOGLE_MAILER_CLIENT_ID,
  process.env.GOOGLE_MAILER_CLIENT_SECRET
);
// Set Refresh Token vào OAuth2Client Credentials
myOauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_MAILER_REFRESH_TOKEN,
});
// Tạo API /email/send với method POST
app.post("/email/send", async (req, res) => {
  try {
    // Lấy thông tin gửi lên từ client qua body
    const { email, subject, content } = req.body;
    if (!email || !subject || !content)
      throw new Error("Please provide email, subject and content!");
    /**
     * Lấy AccessToken từ RefreshToken (bởi vì Access Token cứ một khoảng thời gian ngắn sẽ bị hết hạn)
     * Vì vậy mỗi lần sử dụng Access Token, chúng ta sẽ generate ra một thằng mới là chắc chắn nhất.
     */
    const myAccessTokenObject = await myOauth2Client.getAccessToken();
    const myAccessToken = myAccessTokenObject?.token;
    // Tạo một biến Transport từ Nodemailer với đầy đủ cấu hình, dùng để gọi hành động gửi mail
    const transport = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: process.env.ADMIN_EMAIL_ADDRESS,
        clientId: process.env.GOOGLE_MAILER_CLIENT_ID,
        clientSecret: process.env.GOOGLE_MAILER_CLIENT_SECRET,
        refresh_token: process.env.GOOGLE_MAILER_REFRESH_TOKEN,
        accessToken: myAccessToken,
      },
    });
    // mailOption là những thông tin gửi từ phía client lên thông qua API
    const mailOptions = {
      to: email, // Gửi đến ai?
      subject: subject, // Tiêu đề email
      html: `<h3>${content}</h3>`, // Nội dung email
    };
    await transport.sendMail(mailOptions);
    res.status(200).json({ message: "Email sent successfully." });
  } catch (error) {
    console.log(error);
    res.status(500).json({ errors: error.message });
  }
});

app.listen(process.env.PORT, () => {
  console.log("server is running");
});
