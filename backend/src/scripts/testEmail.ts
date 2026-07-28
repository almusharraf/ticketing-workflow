// Verifies SMTP_USER/SMTP_PASS work in isolation, before trusting the full
// booking flow to send real notifications. Sends one real email to
// SMTP_USER's own address (a sane default test recipient - swap the `to`
// below if you want to confirm delivery to a different inbox).
//
// Run: node_modules/.bin/ts-node src/scripts/testEmail.ts
import { sendEmail } from '../services/email';
import { config } from '../config';

async function main() {
  if (!config.smtp.user || !config.smtp.pass) {
    console.error('SMTP_USER / SMTP_PASS are not set in .env - nothing to test.');
    process.exit(1);
  }

  console.log(`Sending a test email via ${config.smtp.user} to ${config.smtp.user}...`);
  const ok = await sendEmail(
    config.smtp.user,
    'Travel booking module - SMTP test',
    `This confirms SMTP_USER/SMTP_PASS work. Sent at ${new Date().toISOString()}.`
  );

  console.log(ok ? 'Sent successfully - check the inbox.' : 'Failed - see the [email] log line above for the real error.');
  process.exit(ok ? 0 : 1);
}

main();
