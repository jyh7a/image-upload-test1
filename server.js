const express = require("express");
const multer = require("multer");
const fs = require("fs");
const utils = require("util");
const unlinkFile = utils.promisify(fs.unlink);

const app = express();

const upload = multer({ dest: "uploads" });

const { uploadFile, getFileStream } = require("./s3");

app.get("/images/:key", (req, res) => {
  const key = req.params.key;
  const readStream = getFileStream(key);

  readStream.pipe(res);
});

app.post("/images", upload.single("image"), async (req, res) => {
  try {
    const file = req.file;
    console.log({ file });

    // apply filter
    // resize

    const result = await uploadFile(file);
    console.log({ result });

    await unlinkFile(file.path);

    const description = req.body.description;
    console.log({ description });

    res.send({ imagePath: `/images/${result.Key}` });
  } catch (error) {
    console.log(error);
  }
});

app.listen(8080, () => console.log(`http://127.0.0.1:8080`));
