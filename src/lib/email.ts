import nodemailer from 'nodemailer';

// Gmail SMTP configuration
const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;

// Create transporter only if credentials are available
let transporter: nodemailer.Transporter | null = null;

if (GMAIL_USER && GMAIL_APP_PASSWORD) {
  transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: GMAIL_USER,
      pass: GMAIL_APP_PASSWORD,
    },
  });
} else {
  console.error('[Email] Missing environment variables: GMAIL_USER or GMAIL_APP_PASSWORD');
}

export async function sendVerificationEmail(to: string, username: string, code: string): Promise<{ success: boolean; error?: string }> {
  console.log(`[Email] Attempting to send verification email to: ${to}`);
  
  // Check if transporter is configured
  if (!transporter) {
    console.error('[Email] Transporter not configured - check environment variables');
    return { success: false, error: 'Email service not configured. Missing GMAIL_USER or GMAIL_APP_PASSWORD.' };
  }

  // Verify transporter connection
  try {
    await transporter.verify();
    console.log('[Email] Transporter verified successfully');
  } catch (verifyError) {
    console.error('[Email] Transporter verification failed:', verifyError);
    return { success: false, error: 'Email service authentication failed. Check Gmail credentials.' };
  }

  try {
    const info = await transporter.sendMail({
      from: `"Luma Security" <${GMAIL_USER}>`,
      to,
      subject: 'Verify your Luma account',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify your Luma account</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: system-ui, -apple-system, sans-serif; background-color: #0a0a0a;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #111111; border-radius: 12px; border: 1px solid #333; max-width: 600px;">
                  <tr>
                    <td style="padding: 40px 30px;">
                      <h1 style="color: #3b82f6; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">Welcome to Luma!</h1>
                      
                      <p style="color: #ffffff; margin: 0 0 20px 0; font-size: 16px; line-height: 1.5;">
                        Hi ${username},
                      </p>
                      
                      <p style="color: rgba(255,255,255,0.7); margin: 0 0 30px 0; font-size: 15px; line-height: 1.5;">
                        Thank you for signing up. Please verify your email address by entering this verification code:
                      </p>
                      
                      <div style="background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.1) 100%); border: 2px solid #3b82f6; border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0;">
                        <span style="font-size: 42px; font-weight: 700; color: #3b82f6; letter-spacing: 12px; font-family: monospace;">${code}</span>
                      </div>
                      
                      <p style="color: rgba(255,255,255,0.5); margin: 0 0 20px 0; font-size: 14px; line-height: 1.5;">
                        This code will expire in <strong style="color: #ffffff;">24 hours</strong>.
                      </p>
                      
                      <div style="border-top: 1px solid #333; padding-top: 20px; margin-top: 30px;">
                        <p style="color: rgba(255,255,255,0.4); margin: 0; font-size: 13px; line-height: 1.5;">
                          If you didn't create an account with Luma, you can safely ignore this email.
                        </p>
                      </div>
                    </td>
                  </tr>
                </table>
                
                <p style="color: rgba(255,255,255,0.3); margin-top: 20px; font-size: 12px;">
                  © ${new Date().getFullYear()} Luma Security. All rights reserved.
                </p>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
      text: `Welcome to Luma!\n\nHi ${username},\n\nYour verification code is: ${code}\n\nThis code expires in 24 hours.\n\nIf you didn't create an account, ignore this email.`,
    });
    
    console.log(`[Email] Email sent successfully: ${info.messageId}`);
    return { success: true };
  } catch (error) {
    console.error('[Email] Failed to send email:', error);
    if (error instanceof Error) {
      console.error('[Email] Error details:', error.message);
    }
    return { success: false, error: `Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}
