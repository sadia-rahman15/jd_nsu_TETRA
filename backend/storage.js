require("dotenv").config();

const { S3Client } = require("@aws-sdk/client-s3");

const requiredB2Variables = [
  "B2_ENDPOINT",
  "B2_REGION",
  "B2_BUCKET",
  "B2_KEY_ID",
  "B2_APPLICATION_KEY",
];

for (const variableName of requiredB2Variables) {
  if (!process.env[variableName]) {
    throw new Error(`${variableName} is missing from the backend .env file.`);
  }
}

const b2Client = new S3Client({
  endpoint: process.env.B2_ENDPOINT,
  region: process.env.B2_REGION,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.B2_KEY_ID,
    secretAccessKey: process.env.B2_APPLICATION_KEY,
  },
});

const B2_BUCKET = process.env.B2_BUCKET;

module.exports = { b2Client, B2_BUCKET };
