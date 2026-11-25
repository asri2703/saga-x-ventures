// Local test for the record feed.
//
// Sends seven days of sample readings to the ingest endpoint exactly as the
// reporter EA would, so the /copytrade chart can be checked without the VPS.
//
//   node scripts/record-test.mjs           send the sample readings
//   node scripts/record-test.mjs --clean   print the SQL that removes them
//
// The readings land in the real Supabase tables under the master login.
// Remove them with --clean BEFORE the EA is started on the VPS: the clean-up
// deletes every snapshot for that login, which is only safe while none of
// them are real.
import fs from "node:fs";

const env = Object.fromEntries(
  fs
    .readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .filter((line) => /^[A-Z_]+=/.test(line))
    .map((line) => {
      const at = line.indexOf("=");
      return [line.slice(0, at), line.slice(at + 1).trim()];
    }),
);

const login = Number(env.RECORD_ACCOUNT_LOGIN);
if (!login) throw new Error("Isi RECORD_ACCOUNT_LOGIN dalam .env.local dulu");

if (process.argv.includes("--clean")) {
  console.log(`-- Tampal dalam Supabase SQL Editor untuk buang data ujian.
-- Jalankan SEBELUM EA dihidupkan di VPS.
delete from account_snapshots where login = ${login};`);
  process.exit(0);
}

const url = `${env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/record/ingest`;
const DAY = 86_400;
const now = Math.floor(Date.now() / 1000);
// Goes up and down, in cent units like the real account.
const balances = [50000, 50800, 50300, 51600, 51200, 52400, 52100];

for (let i = 0; i < balances.length; i++) {
  const takenAt = now - (balances.length - 1 - i) * DAY;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.RECORD_INGEST_SECRET}`,
    },
    body: JSON.stringify({
      login,
      taken_at: takenAt,
      balance: balances[i],
      equity: balances[i] - 150,
      equity_low: balances[i] - 600,
    }),
  });
  console.log(`hari ${i + 1}: ${res.status} ${await res.text()}`);
}

console.log("\nBuka http://localhost:3000/copytrade dan tengok carta.");
console.log("Lepas tu buang data ujian: node scripts/record-test.mjs --clean");
