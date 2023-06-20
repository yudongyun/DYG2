// npm install express express-session ejs oracledb@5.2.0 bcrypt
const express = require('express');
const session = require('express-session');
const app = express();
app.set('view engine', 'ejs');
app.use(express.static('./public'));
app.use(express.json());
const db = require('./db');
let conn;
async function dbrun() {
    conn = await db.getConn();
    console.log('db start');
}
dbrun();
// applcation/x-www-form-urlencoded
app.use(express.urlencoded({ extended: false }));

app.use(session({
    secret: '20230605',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 10 * 60 * 1000 } //10분
  }));



app.get('/', async (req, res) => {
    res.render('login');
    
});
// 암호화 모듈 
// npm install bcrypt
let bcrypt = require('bcrypt');
const { maxRows } = require('oracledb');
let saltRounds = 10;
const sqlConfig = {
user_info: `SELECT *
            FROM MD_USER 
            WHERE user_id = :1`
};

app.post('/login', async (req, res) => {
    const user_id = req.body.user_id;
    try {
        const result = await db.selectData(conn, sqlConfig.user_info, [user_id]);
        console.log(result);
        if (result.rows.length > 0) {
            bcrypt.compare(req.body.user_pw, result.rows[0].USER_PW, function (err, isMatch) {
                if (err) {
                    console.log(err);
                } else if (isMatch) {
                    // 입력받은 값과 db pw 일치했을때 true
                    // 로그인 확인 로직
                    // 로그인이 성공하면, 세션에 사용자 정보를 저장
                    req.session.user = user_id;
                    res.render('main',  {user_id: req.session.user});
                } else {
                    res.render('login');
                }
            });
        } else {
            res.render('login', { msg: '잘못된 회원 아이디 입니다.', id: '' });
        }
    } catch (e) {
        console.log(e);
    }
});

app.get('/main', async(req, res)=>{
    if (req.session && req.session.user) { // 사용자가 로그인 되어 있다면
        res.render('main', {user_id: req.session.user});
    } else {
        console.log('user 없음');
        res.redirect('/');
    }
});

app.listen(3000, ()=>{
    console.log('start!!');
});

process.on('SIGINT', async()=>{
    // CTRL+C
    console.log('SIGINT closing db');
    await db.closeConn(conn);
    process.exit(0);
});
process.on('SIGTERM', async()=>{
    // kill 
    console.log('SIGTERM closing db');
    await db.closeConn(conn);
    process.exit(0);
});

