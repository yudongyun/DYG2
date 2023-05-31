const express = require('express');
const app = express();
app.set('view engine', 'ejs');

// json 형태로 request 데이터를 받을 수 있음
app.use(express.json());

app.get('/', async(req, res) => {
    res.render('index');
});

app.get('/test', async(req, res) => {
    console.log('요청', req.query);
    console.log('요청', req.query.nm);
    res.send({ flag : 'Y'});
})
app.post('/test', async(req, res) => {
    console.log(req.body);
})

app.listen(3000, ()=> {
    console.log('start')
})