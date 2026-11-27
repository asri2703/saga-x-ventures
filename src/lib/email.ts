import { site } from "@/lib/site";

/**
 * The shell every email to a client is sent in.
 *
 * Email is not the web. There is no stylesheet, no flexbox worth relying on,
 * and a dozen clients that each drop something different, so this is tables
 * and inline styles — the one place in this codebase where that is the right
 * answer rather than a lapse.
 *
 * Three things it exists to do:
 *
 * 1. Say who it is from before a word is read. A payment confirmation that
 *    arrives as unstyled text is the shape phishing has, and a buyer who has
 *    just sent money is exactly the person deciding whether to trust it.
 *
 * 2. Say what the document IS — receipt, invoice, registration — in the one
 *    place the eye lands first. The same wrapper carries all three, and the
 *    word in the corner is the difference between "you have paid" and "you
 *    have not yet".
 *
 * 3. Put the figures in a table rather than in a sentence. Somebody checking
 *    an amount against their bank app is scanning, not reading.
 *
 * Colours are written out rather than taken from the stylesheet's tokens:
 * `var()` does not survive an email client, and these have to match the site
 * by hand. Pine #163a30, paper #f2e9d8, raised #faf4e8, ruby #f0283c.
 */

const PINE = "#163a30";
const PAPER = "#f2e9d8";
const RAISED = "#faf4e8";
const SOFT = "#3e5d53";
const FAINT = "#566e65";
const RULE = "rgba(22, 58, 48, 0.14)";

/** Markup in a name belongs to the sender, never to the message. */
export function escape(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export type Fact = { label: string; value: string; strong?: boolean };

/**
 * The figures, as a table.
 *
 * `strong` is for the one line that is the point of the document — the
 * amount paid on a receipt, the amount due on an invoice.
 */
export function facts(rows: Fact[]): string {
  const cells = rows
    .map(
      ({ label, value, strong }) => `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid ${RULE};color:${FAINT};font-size:14px;">${escape(
            label,
          )}</td>
          <td style="padding:10px 0;border-bottom:1px solid ${RULE};color:${PINE};font-size:${
            strong ? "18px" : "14px"
          };font-weight:${strong ? "700" : "600"};text-align:right;">${escape(value)}</td>
        </tr>`,
    )
    .join("");

  return `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:20px 0;border-collapse:collapse;">${cells}</table>`;
}

/**
 * Wrap a message.
 *
 * `kind` is the word in the header's corner. `preheader` is the line a
 * client shows beside the subject in the inbox list; without one, clients
 * lift the first words of the body, which here would be "Hi <name>".
 */
export function layout(input: {
  kind: string;
  preheader: string;
  body: string;
}): string {
  const logo = `${site.url}/email/mark.png`;

  return `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:0;background:${PAPER};">
    <span style="display:none;max-height:0;overflow:hidden;opacity:0;">${escape(
      input.preheader,
    )}</span>

    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:${PAPER};padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width:600px;width:100%;background:${RAISED};border-radius:14px;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
            <tr>
              <td style="background:${PINE};padding:18px 24px;">
                <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td style="vertical-align:middle;">
                      <img src="${logo}" width="26" height="26" alt="" style="vertical-align:middle;border:0;" />
                      <span style="vertical-align:middle;padding-left:10px;color:${PAPER};font-size:15px;font-weight:700;letter-spacing:0.01em;">${escape(
                        site.name,
                      )}</span>
                    </td>
                    <td style="text-align:right;vertical-align:middle;color:rgba(242,233,216,0.7);font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;">${escape(
                      input.kind,
                    )}</td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding:28px 24px 8px;color:${SOFT};font-size:15px;line-height:1.6;">
                ${input.body}
              </td>
            </tr>

            <tr>
              <td style="padding:16px 24px 26px;border-top:1px solid ${RULE};color:${FAINT};font-size:12px;line-height:1.6;">
                ${escape(site.name)} &middot;
                <a href="mailto:${site.email}" style="color:${FAINT};">${site.email}</a>
                &middot; ${escape(site.phoneDisplay)}
                <br />
                Trading carries risk. Nothing here is financial advice or a
                promise of any result.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

/** A button that survives a client with no CSS: a padded, coloured link. */
export function button(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:20px 0;">
    <tr>
      <td style="background:${PINE};border-radius:999px;">
        <a href="${href}" style="display:inline-block;padding:13px 26px;color:${PAPER};font-size:15px;font-weight:700;text-decoration:none;">${escape(
          label,
        )}</a>
      </td>
    </tr>
  </table>`;
}

export const emailColours = { PINE, PAPER, RAISED, SOFT, FAINT, RULE };
