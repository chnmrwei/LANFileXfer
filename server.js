const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { createLogger, format, transports } = require('winston');
const http = require('http');
const io = require('socket.io');
const moment = require('moment-timezone');
const iconv = require('iconv-lite'); // Import iconv-lite

// 创建Winston日志记录器
const logger = createLogger({
    level: 'info',
    format: format.combine(
        format.timestamp({
            format: () => moment().tz("Asia/Shanghai").format()
        }),
        format.json()
    ),
    transports: [
        new transports.Console(),
        new transports.File({ filename: 'file-transfer.log', options: { encoding: 'utf8' } })
    ]
});

const app = express();
const port = 3000;
const server = http.createServer(app);
const socketIo = io(server);

// 检查并解决文件名冲突
const resolveFileNameConflict = (directory, fileName) => {
    let originalName = fileName;
    let ext = path.extname(fileName);
    let baseName = path.basename(fileName, ext);
    let counter = 1;
    while (fs.existsSync(path.join(directory, fileName))) {
        fileName = `${baseName}(${counter++})${ext}`;
    }
    return fileName;
};

// 设置存储引擎
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const resolvedName = resolveFileNameConflict('uploads', iconv.decode(Buffer.from(file.originalname, 'binary'), 'utf8')); // Decode filename
        cb(null, resolvedName);
    }
});

const upload = multer({ storage: storage });
app.use(express.static('public'));
app.use(express.json()); // 支持 JSON 编码的请求体
app.use(express.urlencoded({ extended: true })); // 支持 URL 编码的请求体

// 设置 UTF-8 编码
app.use((req, res, next) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    next();
});

// 文件上传接口
app.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('请选择要上传的文件');
    }
    const ip = req.ip || req.connection.remoteAddress;
    const fileName = req.file.filename;
    const currentTime = moment().tz("Asia/Shanghai").format();
    const ipv4 = ip.match(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/);
    const clientIp = ipv4 ? ipv4[0] : 'Unknown IPv4';
    logger.info(`File ${fileName} uploaded by ${clientIp} at ${currentTime}`);
    socketIo.emit('log', `文件 ${fileName} 由 ${clientIp} 上传于 ${currentTime}`);
    res.send('文件上传成功。');
});

// 获取上传文件列表
app.get('/files', (req, res) => {
    const files = fs.readdirSync('uploads');
    const fileList = files.map(file => ({
        name: file,
        url: `/download/${file}`
    }));
    res.json(fileList);
});

// 文件下载接口
app.get('/download/:filename', (req, res) => {
    const filePath = path.join(__dirname, 'uploads', req.params.filename);
    if (fs.existsSync(filePath)) {
        const ip = req.ip || req.connection.remoteAddress;
        const fileName = req.params.filename;
        const currentTime = moment().tz("Asia/Shanghai").format();
        const ipv4 = ip.match(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/);
        const clientIp = ipv4 ? ipv4[0] : 'Unknown IPv4';
        logger.info(`File ${fileName} downloaded by ${clientIp} at ${currentTime}`);
        socketIo.emit('log', `文件 ${fileName} 由 ${clientIp} 下载于 ${currentTime}`);
        res.download(filePath, (err) => {
            if (err) {
                console.error('Error downloading file:', err);
            }
        });
    } else {
        res.status(404).send('文件未找到。');
    }
});

// WebSocket连接处理
socketIo.on('connection', (socket) => {
    logger.info('A user connected to the log stream');
    socket.on('disconnect', () => {
        logger.info('A user disconnected from the log stream');
    });
});

server.listen(port, () => console.log(`Server running on http://localhost:${port}`));
