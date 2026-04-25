const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs-extra');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

app.use(cors());
app.use(express.json());
app.use(express.static('uploads'));

// إنشاء مجلد التحميلات
fs.ensureDirSync('./uploads');

// تخزين العملاء المتصلين
let clients = {};

const upload = multer({ dest: 'uploads/' });

// الاتصال بالعميل
io.on('connection', (socket) => {
  console.log('عميل جديد متصل:', socket.id);
  
  socket.on('register', (data) => {
    clients[socket.id] = data.deviceId;
    console.log('مسجل:', data.deviceId);
    io.emit('clients-update', Object.keys(clients));
  });

  socket.on('stream-ready', (deviceId) => {
    clients[socket.id] = deviceId;
    io.emit('clients-update', Object.keys(clients));
  });

  socket.on('disconnect', () => {
    delete clients[socket.id];
    io.emit('clients-update', Object.keys(clients));
    console.log('عميل انفصل:', socket.id);
  });
});

// واجهة الويب للتحكم
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'control.html'));
});

server.listen(3000, () => {
  console.log('الخادم يعمل على http://localhost:3000');
});