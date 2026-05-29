require('dotenv').config({ path: '/opt/gravitygame-api/.env' });
const jwt  = require('jsonwebtoken');
const http = require('http');

// Known user ID from DB
const userId = '6a134c0f9e34c00e7cc427dc';
const token  = jwt.sign(
  { id: userId, username: 'korhan' },
  process.env.JWT_SECRET,
  { expiresIn: '1h' }
);
console.log('Token:', token.substring(0, 40) + '...');

function doRequest(method, path, data, tok) {
  return new Promise((resolve, reject) => {
    const body = data ? JSON.stringify(data) : null;
    const headers = { 'Content-Type': 'application/json' };
    if (tok) headers['Authorization'] = 'Bearer ' + tok;
    if (body) headers['Content-Length'] = Buffer.byteLength(body);
    const req = http.request({
      hostname: '127.0.0.1', port: 3001, path, method, headers
    }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, body: d }));
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function main() {
  const score = await doRequest('POST', '/api/score', { levelsCompleted: 8, totalFlips: 50 }, token);
  console.log('Score submit:', score.status, score.body);

  const lb = await doRequest('GET', '/api/leaderboard', null, null);
  console.log('Leaderboard:', lb.status, lb.body);
}

main().catch(console.error);
