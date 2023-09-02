require("dotenv").config();

const EventEmitter = require("events");

const fs = require("fs");

const S3 = require("aws-sdk/clients/s3");

const bucketName = process.env.AWS_BUCKET_NAME;
const region = process.env.AWS_BUCKET_REGION;
const accessKeyId = process.env.AWS_ACCESS_KEY;
const secretAccessKey = process.env.AWS_SECRET_KEY;

const s3 = new S3({ region, accessKeyId, secretAccessKey });

// uploads a file to s3
function uploadFile(file) {
  const fileStream = fs.createReadStream(file.path);

  const uploadParams = {
    Bucket: bucketName,
    Body: fileStream,
    Key: file.filename,
  };

  return s3.upload(uploadParams).promise();
}

// downloads a file from s3
function getFileStream(fileKey) {
  try {
    const eventEmitter = new EventEmitter();

    const downloadParams = {
      Key: fileKey,
      Bucket: bucketName,
    };

    const s3Stream = s3.getObject(downloadParams).createReadStream();

    s3Stream.on("error", function (err) {
      console.error(err);
      eventEmitter.emit("error", err);
    });

    eventEmitter.stream = s3Stream;

    return eventEmitter;
  } catch (error) {
    console.log(error);
  }
}

exports.uploadFile = uploadFile;
exports.getFileStream = getFileStream;
