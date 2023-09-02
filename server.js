const express = require("express");
const multer = require("multer");
const fs = require("fs");
const utils = require("util");
const unlinkFile = utils.promisify(fs.unlink);

const app = express();

const upload = multer({ dest: "uploads" });

const { uploadFile, getFileStream } = require("./s3");

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
