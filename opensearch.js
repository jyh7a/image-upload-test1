require("dotenv").config();

// AWS SDK
const AWS = require("aws-sdk");

// OpenSearch
const { Client } = require("@elastic/elasticsearch");
// const HttpAmazonESConnector = require("http-aws-es");

// OpenSearch Config
// AWS.config.update({
//   accessKeyId: process.env.AWS_ACCESS_KEY,
//   secretAccessKey: process.env.AWS_SECRET_KEY,
//   region: process.env.AWS_BUCKET_REGION,
// });

// const client = new Client({
//   node: process.env.AWS_OPENSEARCH_ENDPOINT,
//   connectionClass: HttpAmazonESConnector,
//   amazonES: {
//     credentials: new AWS.Credentials(
//       process.env.AWS_ACCESS_KEY,
//       process.env.AWS_SECRET_KEY
//     ),
//   },
//   request_timeout: 100000, // 요청 시간 제한 설정
//   log: "trace", // Enable trace logs
// });

const client = new Client({
  node: process.env.AWS_OPENSEARCH_ENDPOINT,
  auth: {
    username: process.env.AWS_OPENSEARCH_USERNAME,
    password: process.env.AWS_OPENSEARCH_PASSWORD,
  },
  // productCheck: false, // Disable product check
  requestTimeout: 100000,
  log: "trace", // 트레이스 로그 활성화
});

// console.log({ client });

client.ping({}, function (error) {
  if (error) {
    console.log(error);
    console.error("Elasticsearch cluster is down!");
  } else {
    console.log("Elasticsearch cluster is up!");
  }
});

async function createIndex(indexName) {
  await client.indices.create({
    index: indexName,
  });
}

async function insertDummyData(indexName, data) {
  await client.index({
    index: indexName,
    body: data,
  });
}

const searchIndex = async (indexName) => {
  try {
    const { body } = await client.search({
      index: indexName,
      body: {
        query: {
          match_all: {},
        },
      },
    });

    console.log("검색 결과:", body.hits.hits);
  } catch (error) {
    console.error("인덱스 검색 중 오류:", error);
  }
};

module.exports = { client, createIndex, insertDummyData, searchIndex };
