import AWS from "aws-sdk";
const s3 = new AWS.S3({ region: process.env.AWS_REGION });

export async function publishProofToS3(key: string, body: any) {
  await s3.putObject({
    Bucket: process.env.AWS_S3_BUCKET!,
    Key: key,
    Body: JSON.stringify(body),
    ContentType: "application/json",
    ACL: "private"
  }).promise();
  // Also store the S3 key in your DB (game_provable_receipts)
}
