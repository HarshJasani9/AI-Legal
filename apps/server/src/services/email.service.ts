import nodemailer from 'nodemailer';

// Uses environment variables for production, falls back to a placeholder configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || 'ethereal_user',
    pass: process.env.SMTP_PASS || 'ethereal_pass',
  },
});

export const sendReminderEmail = async (reminder: any) => {
  const isExpiry = reminder.type === 'expiry';
  const actionText = isExpiry ? 'expires' : 'is up for renewal';
  const color = isExpiry ? '#ef4444' : '#3b82f6'; // Red for expiry, Blue for renewal
  
  const html = `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); border: 1px solid #e5e7eb;">
      
      <!-- Header -->
      <div style="background-color: #111827; padding: 24px; text-align: center;">
        <h2 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 0.5px;">Contract AI Platform</h2>
      </div>

      <!-- Body -->
      <div style="background-color: #ffffff; padding: 32px;">
        <p style="font-size: 16px; color: #374151; margin-top: 0;">Hello,</p>
        <p style="font-size: 16px; color: #374151; line-height: 1.5;">This is an automated legal reminder regarding your contract: <strong>${reminder.contractName}</strong>.</p>
        
        <div style="margin: 32px 0; padding: 24px; border-left: 5px solid ${color}; background-color: #f9fafb; border-radius: 0 8px 8px 0;">
          <h3 style="margin: 0 0 8px 0; color: ${color}; text-transform: uppercase; font-size: 13px; font-weight: 800; letter-spacing: 1px;">Action Required</h3>
          <p style="font-size: 20px; color: #111827; margin: 0 0 12px 0; font-weight: 600;">
            This contract <strong>${actionText}</strong> in exactly <span style="color: ${color};">${reminder.remindDaysBefore} days</span>.
          </p>
          <div style="display: inline-block; background-color: #e5e7eb; padding: 4px 10px; border-radius: 6px; font-size: 14px; color: #4b5563; font-weight: 500;">
            Due Date: ${new Date(reminder.dueDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>
        
        <p style="font-size: 15px; color: #6b7280; line-height: 1.5;">Please log in to your Legal AI Dashboard to review the contract clauses, assess associated risks, and take any necessary actions before the deadline.</p>
        
        <div style="text-align: center; margin-top: 32px;">
          <a href="http://localhost:3000/contracts" style="background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 15px; display: inline-block;">View Dashboard</a>
        </div>
      </div>

      <!-- Footer -->
      <div style="background-color: #f3f4f6; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
        <p style="font-size: 12px; color: #9ca3af; margin: 0;">This email was generated automatically by the Contract AI Platform.<br/>Please do not reply to this email.</p>
      </div>
    </div>
  `;

  const mailOptions = {
    from: `"Contract AI" <${process.env.SMTP_FROM || 'noreply@contractai.com'}>`,
    to: reminder.email,
    subject: `[Reminder] Contract ${isExpiry ? 'Expires' : 'Renews'} in ${reminder.remindDaysBefore} days: ${reminder.contractName}`,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Reminder email sent to ${reminder.email}: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`Failed to send email to ${reminder.email}:`, error);
    throw error;
  }
};
