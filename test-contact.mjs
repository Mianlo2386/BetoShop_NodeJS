const response = await fetch('http://localhost:3001/contact', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'Test', email: 'test@test.com', subject: 'Test', message: 'Hola' })
});
console.log('Status:', response.status);
const data = await response.json();
console.log('Response:', JSON.stringify(data, null, 2));