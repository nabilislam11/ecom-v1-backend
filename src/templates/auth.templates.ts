// src/templates/auth.templates.ts

export const getPasswordResetTemplate = (resetLink: string) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Password</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f5; color: #18181b;">
      
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #f4f4f5; padding: 40px 20px;">
        <tr>
          <td align="center">
            
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
              
              <tr>
                <td style="padding: 32px 40px; text-align: center; border-bottom: 1px solid #e4e4e7;">
                  <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #18181b;">Password Reset</h1>
                </td>
              </tr>

              <tr>
                <td style="padding: 40px;">
                  <p style="margin: 0 0 24px; font-size: 16px; line-height: 24px; color: #52525b;">
                    Hello, <br><br>
                    We received a request to reset the password for your account. If you made this request, please click the button below to choose a new password:
                  </p>

                  <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                    <tr>
                      <td align="center" style="padding-bottom: 24px;">
                        <a href="${resetLink}" style="display: inline-block; padding: 14px 28px; background-color: #000000; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; border-radius: 6px;">
                          Reset My Password
                        </a>
                      </td>
                    </tr>
                  </table>

                  <p style="margin: 0 0 24px; font-size: 16px; line-height: 24px; color: #52525b;">
                    If the button doesn't work, you can copy and paste this link into your browser:
                    <br>
                    <a href="${resetLink}" style="color: #2563eb; font-size: 14px; word-break: break-all;">${resetLink}</a>
                  </p>

                  <p style="margin: 0; font-size: 14px; line-height: 24px; color: #71717a;">
                    This link will expire in 15 minutes. If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.
                  </p>
                </td>
              </tr>

              <tr>
                <td style="padding: 24px 40px; background-color: #fafafa; text-align: center; border-top: 1px solid #e4e4e7;">
                  <p style="margin: 0; font-size: 12px; color: #a1a1aa;">
                    © ${new Date().getFullYear()} YourStore. All rights reserved.
                  </p>
                </td>
              </tr>
              
            </table>

          </td>
        </tr>
      </table>

    </body>
    </html>
  `;
};
