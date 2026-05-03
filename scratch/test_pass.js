const bcrypt = require('bcryptjs');
const { sha256 } = require('js-sha256');

const dbHash = '$2b$10$fcp.jFVWjZHqY3i4aP2fUu.82.qyCNc/Xgpcg15L7yBw5unCRGJYG';
const rawPass = 'Pass@123';
const shaPass = sha256(rawPass);

async function test() {
  console.log('Testing raw:', rawPass);
  console.log('SHA-256:', shaPass);
  const match = await bcrypt.compare(shaPass, dbHash);
  console.log('Does it match DB hash?', match);
}

test();
