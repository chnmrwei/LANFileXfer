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
            format: () => {
                const now = new Date();
                const year = now.getFullYear();
                const month = String(now.getMonth() + 1).padStart(2, '0');
                const day = String(now.getDate()).padStart(2, '0');
                const hours = String(now.getHours()).padStart(2, '0');
                const minutes = String(now.getMinutes()).padStart(2, '0');
                const seconds = String(now.getSeconds()).padStart(2, '0');
                return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
            }
        }),
        format.printf(({ level, message, timestamp }) => {
            return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
        })
    ),
    transports: [
        new transports.Console(),
        new transports.File({ 
            filename: 'file-transfer.log', 
            options: { encoding: 'utf8', flags: 'a' } // 在这里添加 flags: 'a' 以启用追加模式
        })
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
    
    // 获取当前时间，格式为：YYYY-MM-DD HH:mm:ss
    const currentTime = moment().tz("Asia/Shanghai").format('YYYY-MM-DD HH:mm:ss');
    
    // 匹配并提取IPv4地址
    const ipv4 = ip.match(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/);
    const clientIp = ipv4 ? ipv4[0] : 'Unknown IPv4';

    // 记录日志并发送WebSocket消息，包含时间戳
    logger.info(`${clientIp} uploaded file => ${fileName}`);
    socketIo.emit('log', `[${currentTime}] ${clientIp} 上传了文件 "${fileName}"`);


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
        const currentTime = moment().tz("Asia/Shanghai").format('YYYY-MM-DD HH:mm:ss'); // 添加简洁的时间格式
        const ipv4 = ip.match(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/);
        const clientIp = ipv4 ? ipv4[0] : 'Unknown IPv4';
        
        logger.info(`${clientIp} downloaded file => ${fileName}`);
        socketIo.emit('log', `[${currentTime}] ${clientIp} 下载了文件 "${fileName}"`);
        
        
        res.download(filePath, (err) => {
            if (err) {
                console.error('Error downloading file:', err);
            }
        });
    } else {
        res.status(404).send('文件未找到。');
    }
});

// 删除单个文件接口
app.delete('/delete/:filename', (req, res) => {
    const filePath = path.join(__dirname, 'uploads', req.params.filename);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);  // 删除文件
        const ip = req.ip || req.connection.remoteAddress;
        const fileName = req.params.filename;
        const currentTime = moment().tz("Asia/Shanghai").format('YYYY-MM-DD HH:mm:ss'); // 添加简洁的时间格式
        const ipv4 = ip.match(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/);
        const clientIp = ipv4 ? ipv4[0] : 'Unknown IPv4';
        // 单个文件删除日志
        logger.info(`${clientIp} deleted file => ${fileName}`);
        socketIo.emit('log', `[${currentTime}] ${clientIp} 删除了文件 "${fileName}"`);

        res.send(`文件 ${fileName} 已删除`);
    } else {
        res.status(404).send('文件未找到');
    }
});

// 删除所有文件接口
app.delete('/delete-all', (req, res) => {
    const files = fs.readdirSync('uploads');
    if (files.length === 0) {
        return res.status(404).send('没有文件可删除');
    }
    
    files.forEach(file => {
        const filePath = path.join(__dirname, 'uploads', file);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);  // 删除文件
        }
    });

    const ip = req.ip || req.connection.remoteAddress;
    const currentTime = moment().tz("Asia/Shanghai").format('YYYY-MM-DD HH:mm:ss'); // 添加简洁的时间格式
    const ipv4 = ip.match(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/);
    const clientIp = ipv4 ? ipv4[0] : 'Unknown IPv4';
    // 所有文件删除日志
    logger.info(`${clientIp} deleted all files`);
    socketIo.emit('log', `[${currentTime}] ${clientIp} 删除了所有文件`);

    res.send('所有文件已删除');
});


// WebSocket连接处理
socketIo.on('connection', (socket) => {
    let clientIp = socket.request.connection.remoteAddress || socket.handshake.address;

    // 如果 IP 是 IPv6 格式并且包含 IPv4 地址
    if (clientIp.includes('::ffff:')) {
        clientIp = clientIp.split('::ffff:')[1]; // 提取出 IPv4 地址
    }

    // 如果是本地连接（::1），可以指定一个替代值
    if (clientIp === '::1') {
        clientIp = '127.0.0.1'; // 本地连接IPv4
    }

    logger.info(`${clientIp} connected`);

    socket.on('disconnect', () => {
        logger.info(`${clientIp} disconnected`);
    });
});


server.listen(port, () => console.log(`Server running on http://localhost:${port}`));
