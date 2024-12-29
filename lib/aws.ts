import { S3Client, ObjectCannedACL } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { Readable } from "stream";

const s3Client = new S3Client({
  endpoint: process.env.AWS_ENDPOINT,
  region: process.env.AWS_REGION || "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export default s3Client;

export async function uploadToS3(
  file: Express.Multer.File,
  prefix: string
): Promise<string> {
  if (!file.buffer) {
    throw new Error(
      "File buffer is undefined. Ensure multer is configured correctly."
    );
  }

  const originalName = file.originalname || "file";
  const sanitizedFilename = originalName.replace(/[^a-zA-Z0-9.\-_]/g, "");
  const key = `${prefix}/${Date.now()}_${sanitizedFilename}`;

  const stream = Readable.from(file.buffer);

  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME!,
    Key: key,
    Body: stream,
    ContentType: file.mimetype,
    ACL: "public-read" as ObjectCannedACL,
  };

  const upload = new Upload({
    client: s3Client,
    params,
  });

  await upload.done();

  return `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
}

