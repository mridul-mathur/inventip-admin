import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";

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
    ContentType: file.type,
  };

  await s3Client.send(new PutObjectCommand(uploadParams));

  return `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
};

export const deleteFromS3 = async (imageUrl: string): Promise<void> => {
  try {
    const key = imageUrl.replace(
      `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/`,
      ""
    );

    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: key,
      })
    );

    console.log(`Deleted image from S3: ${imageUrl}`);
  } catch (error) {
    console.error("Error deleting image from S3:", error);
    throw new Error(`Failed to delete image: ${imageUrl}`);
  }
};
