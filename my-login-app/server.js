const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

const fakeUser = {
  username: 'admin',
  password: '123456'
};

app.get('/', (req, res) => {
  res.redirect('/login');
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === fakeUser.username && password === fakeUser.password) {
    res.cookie('auth', 'true', { maxAge: 3600000 });
    res.send(`<h2>Chào ${username}!</h2><p>Đăng nhập thành công!</p>`);
  } else {
    res.send(`<h2>Sai tài khoản hoặc mật khẩu.</h2><a href="/login">Thử lại</a>`);
  }
});

app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});
