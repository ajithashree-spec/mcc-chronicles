/**
 * Newsletter Dispatcher & Digest Compiler Service (Task 105)
 */

function generateDigestHtml({
  articles = [],
  circulars = [],
  issueDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }),
  volume = 'Vol. CLXXXVII',
  issueNo = 'No. 42',
  unsubscribeToken = 'DEMO_TOKEN',
  baseUrl = 'http://localhost:5000',
}) {
  const articlesHtml = articles
    .slice(0, 5)
    .map(
      (art) => `
    <tr style="border-bottom: 1px solid #e5e0d8;">
      <td style="padding: 16px 0;">
        <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #7B1113; font-weight: bold;">
          ${art.category_name || 'Gazette Dispatch'}
        </span>
        <h3 style="margin: 4px 0 8px 0; font-family: Georgia, 'Times New Roman', serif; font-size: 18px; line-height: 1.3; color: #1a1a1a;">
          <a href="${baseUrl}/article/${art.slug}" style="color: #1a1a1a; text-decoration: none;">
            ${art.title}
          </a>
        </h3>
        <p style="margin: 0 0 8px 0; font-size: 13px; line-height: 1.5; color: #555555; font-family: Georgia, serif;">
          ${art.summary || (art.content ? art.content.slice(0, 140) + '...' : '')}
        </p>
        <div style="font-size: 11px; color: #888888;">
          By <strong>${art.author_name || 'MCC Editorial Staff'}</strong> • 
          <a href="${baseUrl}/article/${art.slug}" style="color: #7B1113; text-decoration: none; font-weight: bold;">
            Read Full Dispatch →
          </a>
        </div>
      </td>
    </tr>
  `
    )
    .join('');

  const circularsHtml =
    circulars.length > 0
      ? `
    <div style="margin-top: 24px; padding: 16px; background-color: #f7f5f0; border-left: 4px solid #002147;">
      <h4 style="margin: 0 0 10px 0; font-family: Georgia, serif; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #002147;">
        Gazette Notices & Urgent Circulars
      </h4>
      <ul style="margin: 0; padding-left: 18px; font-size: 12px; color: #333333; line-height: 1.6;">
        ${circulars
          .slice(0, 3)
          .map(
            (c) => `
          <li>
            <strong>${c.circular_number || 'Notice'}:</strong> ${c.title}
          </li>
        `
          )
          .join('')}
      </ul>
    </div>
  `
      : '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>The Morning Quadrangle Digest</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f6f4ee; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f6f4ee; padding: 24px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border: 1px solid #dcd7cc; border-top: 4px solid #7B1113; border-radius: 4px; overflow: hidden;">
          <!-- Masthead Header -->
          <tr>
            <td style="padding: 24px 32px 16px 32px; text-align: center; border-bottom: 2px solid #7B1113;">
              <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #C5A059; font-weight: bold; margin-bottom: 4px;">
                The Madras Christian College Chronicles
              </div>
              <h1 style="margin: 0; font-family: Georgia, 'Times New Roman', serif; font-size: 28px; color: #7B1113; font-weight: 900; letter-spacing: 0.5px;">
                The Morning Quadrangle Digest
              </h1>
              <div style="font-size: 11px; color: #666666; margin-top: 6px; font-style: italic;">
                Official Digital Broadsheet Gazette • ${volume} • ${issueNo} • ${issueDate}
              </div>
            </td>
          </tr>

          <!-- Editorial Lead Note -->
          <tr>
            <td style="padding: 20px 32px; background-color: #fffcf7; border-bottom: 1px solid #eee8dc; font-family: Georgia, serif; font-size: 13px; font-style: italic; color: #554433; line-height: 1.5;">
              "Lighted to Lighten" — Your weekly compendium of campus discourse, collegiate research, hall lore, and gazette circulars from the 365-acre Tambaram estate.
            </td>
          </tr>

          <!-- Main Dispatches Section -->
          <tr>
            <td style="padding: 16px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                ${articlesHtml}
              </table>

              ${circularsHtml}
            </td>
          </tr>

          <!-- Footer & Unsubscribe -->
          <tr>
            <td style="padding: 24px 32px; background-color: #002147; color: #e2e8f0; text-align: center; font-size: 11px; line-height: 1.6;">
              <p style="margin: 0 0 6px 0; font-weight: bold; color: #C5A059;">
                The Madras Christian College Chronicles (Autonomous)
              </p>
              <p style="margin: 0 0 10px 0; color: #cbd5e1;">
                Tambaram East, Chennai - 600059, Tamil Nadu, India
              </p>
              <p style="margin: 0; font-size: 10px; color: #94a3b8;">
                You received this digest as an active subscriber to the collegiate broadsheet.<br>
                <a href="${baseUrl}/unsubscribe/${unsubscribeToken}" style="color: #C5A059; text-decoration: underline;">
                  Unsubscribe from morning editions
                </a> • 
                <a href="${baseUrl}" style="color: #C5A059; text-decoration: underline;">
                  Visit Digital Archives
                </a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

module.exports = {
  generateDigestHtml,
};
