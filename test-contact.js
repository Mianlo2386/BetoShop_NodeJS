const http = require('http');

const data = JSON.stringify({
  name: 'Test Local',
  email: 'test@test.com',
  subject: 'Test',
  message: 'Hola'
});

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/contact',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  console.log('Status:', res.statusCode);
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => console.log('Response:', body));
});

req.on('error', (e) => console.error('Error:', e.message));
req.write(data);
req.end();