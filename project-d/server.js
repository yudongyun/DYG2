const express = require('express');
const session = require('express-session');
const fetch = require('node-fetch');
const cors = require('cors');
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
// application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: false }));

// 전체 오리진 허용
app.use(cors());

// 로그인 정보 세션 관련
app.use(session({
    secret: '20230605',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 10 * 60 * 1000 } //10분
  }));

app.get('/', async (req, res) => {
    res.render('main', { msg: 'N' });
});

app.get('/loginPage', async (req, res) => {
    res.render('login', { msg: 'N', id: '' });
})
app.get('/signPage', async (req, res) => {
    res.render('sign', { msg: 'N', id: '' });
})

// 암호화 모듈
// npm install bcrypt
let bcrypt = require('bcrypt');
let saltRounds = 10; // 단순 알고리즘에 반복적으로 랜덤하게 만드는... 쉽게 더 복잡하게 만드는 것
const sqlConfig = {
    user_info: `SELECT *
                FROM MD_USER
                WHERE user_id = :1`

    , user_insert: `INSERT INTO MD_USER
                    VALUES(:user_id, :user_pw, :user_nm)`
                }
app.post('/signup', async (req, res) => {
    console.log(req.body);
    const user_pw = await bcrypt.hash(req.body.user_pw, saltRounds);
    const user_id = req.body.user_id;
    const user_nm = req.body.user_nm;
    try {
        const result = await db.selectData(conn, sqlConfig.user_info, [user_id]);
        if (result.rows.length > 0) {
            return res.render('sign', { msg: '동일한 아이디가 있음' });
        }
    } catch (error) {
        return res.render('sign', { msg: '사이트 오류' });
    }
    console.log(user_pw);
    const val = { user_id, user_pw, user_nm };
    try {
        await db.insertData(conn, sqlConfig.user_insert, val);
        res.render('login', { id: user_id, msg: '회원가입 되셨습니다. 로그인 진행해주세요!' });
    } catch (error) {
        res.render('sign', { msg: '사이트 오류' });
    }
});

app.post('/login', async (req, res) => {
    const user_id = req.body.user_id;
    const user_pw = req.body.user_pw;
    try {
        const result = await db.selectData(conn, sqlConfig.user_info, [user_id]);
        if (result.rows.length > 0) {
            const user = result.rows[0];
            bcrypt.compare(user_pw, user.USER_PW, function (err, isMatch) {
                if (err) {
                    console.log(err);
                } else if (isMatch) {
                    // 입력받은 값과 db pw 일치했을때 true
                    // 세션에 user_id와 user_nm 저장
                    req.session.user_id = user_id;
                    req.session.user_nm = user.USER_NM;

                    // 로그인 성공 시 "Login"과 "Sign Up" 버튼 숨기기
                    res.render('main', { msg: '로그인 되었습니다.', id: user_id});
                } else {
                    res.render('login', { msg: '비밀번호가 다릅니다', id: user_id });
                }
            });
        } else {
            res.render('login', { msg: '잘못된 회원 아이디 입니다', id: '' });
        }
    } catch (e) {
        console.log(e);
    }
});



app.get('/mypage', async (req, res) => {
    const user_id = req.session.user_id; // 로그인한 사용자의 ID
    const user_nm = req.session.user_nm; // 로그인한 사용자의 NM
    console.log(user_id)
    console.log(user_nm)
    try {
        const result = await db.selectData(conn, sqlConfig.user_info, [user_id]);
        if (result.rows.length > 0) {
            const user = result.rows[0];
            res.render('mypage', { user_id: req.session.user_id, user_nm: req.session.user_nm});
        } else {
            res.render('mypage', { msg: '유저 정보가 잘못 되었습니다.', user_id: '', user_nm: '' });
        }
    } catch (err) {
        res.render('mypage', { msg: '유저 정보를 가져오는 중에 오류가 발생했습니다.', user_id: '', user_nm: '' });
        console.log(err);
    }
});

const apiUrl = new URL('https://openapi.naver.com/v1/search/news.json');

app.get('/search', async (req, res) => {
    const query = req.query.query;

    // key value 찾아서 url 인코딩
    apiUrl.search = new URLSearchParams({
        query: req.query.query,
        display: req.query.display
    }).toString();

    try {
        const response = await fetch.default(apiUrl, {
            method: 'GET',
            headers: {
                'X-Naver-Client-Id': 'Jb8onodv5yo2rkUlmMVj',
                'X-Naver-Client-Secret': 'IV2fHeAKhv',
                'Content-Type': 'application/json'
            }
        });
        const data = await response.json();
        console.log(data);
        res.send(data);
    } catch (error) {
        console.log('API 요청 에러:', error);
        res.status(500).send('API 요청 에러');
    }
});


app.listen(3000, () => {
    console.log('start!!!');
});
process.on('SIGINT', async () => {
    // CTRL+C
    console.log('SIGINT closing db');
    await db.closeConn(conn);
    process.exit(0);
});
process.on('SIGTERM', async () => {
    // kill
    console.log('SIGTERM closing db');
    await db.closeConn(conn);
    process.exit(0);
});