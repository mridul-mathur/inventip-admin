import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";

if (
  !process.env.AWS_REGION ||
  !process.env.AWS_ACCESS_KEY_ID ||
  !process.env.AWS_SECRET_ACCESS_KEY ||
  !process.env.AWS_S3_BUCKET_NAME
) {
  throw new Error("AWS environment variables are not properly configured.");
}

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export const uploadToS3 = async (
  file: Blob | File,
  folderPath: string
): Promise<string> => {
  try {
    if (!file || !(file instanceof Blob)) {
      throw new Error("Invalid file provided for upload.");
    }

    const buffer = await file.arrayBuffer();
    const fileName = `${folderPath}/${Date.now()}-${uuidv4()}-${
      file instanceof File ? file.name : "unknown"
    }`;

    const uploadParams = {
      Bucket: process.env.AWS_S3_BUCKET_NAME!,
      Key: fileName,
      Body: Buffer.from(buffer),
      ContentType: file.type || "application/octet-stream",
    };

    await s3Client.send(new PutObjectCommand(uploadParams));

    return `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
  } catch (error) {
    console.error("Error uploading to S3:", error);
    throw new Error("Failed to upload file to S3.");
  }
};

export const deleteFromS3 = async (imageUrl: string): Promise<void> => {
  try {
    if (!imageUrl) {
      throw new Error("Invalid image URL provided for deletion.");
    }
    const key = imageUrl.replace(
      `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/`,
      ""
    );
    if (!key) {
      throw new Error("Could not extract key from the provided image URL.");
    }
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME!,
        Key: key,
      })
    );
  } catch (error) {
    console.error("Error deleting image from S3:", error);
    throw new Error(`Failed to delete image from S3: ${imageUrl}`);
  }
};

export default s3Client;
