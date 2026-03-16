// สคริปต์ทดสอบ health endpoint แบบเร็วจาก command line
const res = await fetch('http://localhost:5000/health');
const json = await res.json();
console.log('status', res.status);
console.log('body', json);
