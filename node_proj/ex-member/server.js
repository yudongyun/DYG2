const express = require('express');
const app = express();
const port = 3000;
// Embedded JavaScript templates
app.set('view engine', 'ejs');
app.listen(port, ()=>{
console.log('hi start');
});
app.get('/',async (req, res) => {
    console.log("??");


    const conn = await db.getConn();

    try{
        const sql1 = `SELECT mem_id
                        ,mem_name
                        ,mem_mail
                        FROM member
                        WHERE mem_name LIKE '%' || :1 || '%'`
        const result = await db.selectData(conn, sql1, ["이쁜이"]);
        console.log(result.rows);

        res.render('index', {data:result.rows});

    }catch(err){
        console.log('error:', err)
    }finally{
        await db.closeConn(conn);
    }


});

//index 페이지에서 회원 이름을 입력받아 (like)
// 회원 정보를 출력하는 기능을 구현하세요
// 회원 정보는 id, name, email

const db = require('./db');
console.log(db);

async function run(){
    const conn = await db.getConn();

    try{
        const sql1 = `SELECT mem_id
                        ,mem_name
                        ,mem_mail
                        FROM member
                        WHERE mem_name LIKE '%' || :1 || '%'`
        const result = await db.selectData(conn, sql1, ["이쁜이"]);
        console.log(result.rows);

    }catch(err){
        console.log('error:', err)
    }finally{
        await db.closeConn(conn);
    }
}
run();