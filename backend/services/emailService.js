const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      // Configure your email service
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  async sendAuctionWinEmail(winner, auction) {
    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: winner.email,
      subject: `Congratulations! You've won the auction for ${auction.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563EB;">Congratulations! 🎉</h1>
          <p>You've won the auction for "${auction.title}"!</p>
          <p>Winning bid amount: $${auction.winningBid.amount}</p>
          <div style="margin: 20px 0;">
            <h2>Next Steps:</h2>
            <ol>
              <li>Complete the payment within 24 hours</li>
              <li>Contact the seller to arrange delivery</li>
              <li>Leave feedback after receiving your item</li>
            </ol>
          </div>
          <a href="${process.env.FRONTEND_URL}/auction/${auction._id}/payment" 
             style="background-color: #2563EB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Complete Payment
          </a>
        </div>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Auction win email sent to ${winner.email}`);
    } catch (error) {
      console.error('Error sending auction win email:', error);
    }
  }
}

module.exports = new EmailService(); 