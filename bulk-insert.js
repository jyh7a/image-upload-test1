require("dotenv").config();
const mysql = require("mysql2");

// DB Config from .env
const dbEndpoint = process.env.DB_ENDPOINT;
const dbUsername = process.env.DB_USERNAME;
const dbPassword = process.env.DB_PASSWORD;
const dbName = process.env.DB_DATABASE;

// Create a MySQL connection
const db = mysql.createConnection({
  host: dbEndpoint,
  user: dbUsername,
  password: dbPassword,
  database: dbName,
});

// 연결
db.connect((err) => {
  if (err) throw err;
  console.log("Connected to the database.");
});

// 10만개의 값을 생성
const values = [];
// for (let i = 1; i <= 10000; i++) {
//   values.push([`피카츄-${i}`, "93375755998207387dc0c2adbf57685d"]);
// }
for (let i = 10001; i <= 40000; i++) {
  values.push([`피카츄-${i}`, "93375755998207387dc0c2adbf57685d"]);
}

// Bulk Insert 쿼리 실행
const sql = "INSERT INTO photos (title, url) VALUES ?";
db.query(sql, [values], (error, results) => {
  if (error) {
    console.error("Error during Bulk Insert:", error);
  } else {
    console.log(`Number of records inserted: ${results.affectedRows}`);
  }

  // 연결 종료
  db.end();
});
