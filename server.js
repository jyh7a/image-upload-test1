const express = require("express");
const https = require("https");
const multer = require("multer");
const fs = require("fs");
const utils = require("util");
const unlinkFile = utils.promisify(fs.unlink);
require("dotenv").config();
const mysql = require("mysql2");

const app = express();

const upload = multer({ dest: "uploads" });

const { uploadFile, getFileStream } = require("./s3");

// DB Config from .env
const bucketName = process.env.AWS_BUCKET_NAME;
const region = process.env.AWS_BUCKET_REGION;
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

// Connect to MySQL
db.connect((err) => {
  if (err) throw err;
  console.log("Connected to the database");
});

app.get("/images/:key", (req, res) => {
  try {
    const key = req.params.key;
    const fileStreamEmitter = getFileStream(key);

    fileStreamEmitter.on("error", (error) => {
      console.error(error);
      res.status(500).send("Could not download the file");
    });

    fileStreamEmitter.stream.pipe(res);
  } catch (error) {
    console.log(error);
    res.status(500).send("An error occurred");
  }
});

app.get("/get-images", (req, res) => {
  const start = Date.now(); // 쿼리 시작 시간

  const search = req.query.search || "";
  let sql = "SELECT title, url FROM photos";
  const values = [];

  if (search) {
    sql += " WHERE title LIKE ?";
    values.push(`%${search}%`);
  } else {
    sql += " LIMIT 100"; // 검색어가 없을 경우 100개만 반환
  }

  db.query(sql, values, (error, results) => {
    if (error) {
      console.log("Error fetching images:", error);
      return res.status(500).send("An error occurred");
    }
    const end = Date.now(); // 쿼리 종료 시간
    const elapsedTime = end - start; // 걸린 시간(ms)
    res.json({ results, elapsedTime });
  });
});

app.get("/proxy-images/:key", async (req, res) => {
  try {
    const { key } = req.params;
    const fileStreamEmitter = getFileStream(key);

    fileStreamEmitter.on("error", (error) => {
      console.error(error);
      res.status(500).send("Could not download the file");
    });

    fileStreamEmitter.stream.pipe(res);
  } catch (error) {
    console.log(error);
    res.status(500).send("An error occurred");
  }
});

app.post("/images", upload.single("image"), async (req, res) => {
  try {
    const file = req.file;
    const { title } = req.body;
    // console.log({ title });
    // console.log({ file });

    // apply filter
    // resize

    // 유니코드 문자열 복원
    // const buffer = Buffer.from(file.originalname, "binary");
    // const decodedName = buffer.toString("utf-8");

    const result = await uploadFile(file);
    // console.log({ result });

    await unlinkFile(file.path);

    // console.log("file.originalname:", file.originalname);
    // console.log(Buffer.from(file.originalname, "binary").toString("utf8"));
    // console.log("Req.file:", req.file);
    // console.log("Encoded:", encodeURI(file.originalname));
    // console.log("Decoded:", decodeURI(file.originalname));

    // Insert into the photos table
    const sql = "INSERT INTO photos (title, url) VALUES (?, ?)";
    const values = [title, result.Key];

    db.query(sql, values, (err, results) => {
      if (err) throw err;
      console.log("Data inserted into photos table:", results);
    });

    res.send({ imagePath: `/images/${result.Key}` });
  } catch (error) {
    console.log(error);
  }
});

const httpsOptions = {
  key: fs.readFileSync("./private-key.pem"),
  cert: fs.readFileSync("./certificate.pem"),
};

https.createServer(httpsOptions, app).listen(8080, () => {
  console.log("http://127.0.0.1:8080");
});
