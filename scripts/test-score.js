// Test: login as korhan and submit score
const http = require('http');

function doRequest(method, path, data, token) {
  return new Promise((resolve, reject) => {
    const body = data ? JSON.stringify(data) : null;
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = 'Bearer ' + token;
    if (body) headers['Content-Length'] = Buffer.byteLength(body);

    const req = http.request({
      hostname: '127.0.0.1',
      port: 3001,
      path: path,
      method: method,
      headers: headers
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
  // Login
  const login = await doRequest('POST', '/api/auth/login', { username: 'korhan', password: 'test123' });
  console.log('Login:', login.status, login.body.substring(0, 200));
  
  if (login.status !== 200) {
    console.log('Login failed, trying with different password...');
    return;
  }
  
  const token = JSON.parse(login.body).token;
  console.log('Got token:', token ? token.substring(0, 20) + '...' : 'NONE');
  
  // Submit score
  const score = await doRequest('POST', '/api/score', { levelsCompleted: 8, totalFlips: 50 }, token);
  console.log('Score submit:', score.status, score.body);
}

main().catch(console.error);
