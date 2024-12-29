declare module "multer-s3" {
  import { StorageEngine } from "multer";
  import { S3 } from "aws-sdk";

  interface Options {
    s3: S3;
    bucket: string;
    acl?: string;
    key?: (
      req: Express.Request,
      file: Express.Multer.File,
      cb: (error: any, key?: string) => void
    ) => void;
    metadata?: (
      req: Express.Request,
      file: Express.Multer.File,
      cb: (error: any, metadata?: any) => void
    ) => void;
    contentType?: (
      req: Express.Request,
      file: Express.Multer.File,
      cb: (error: any, mime?: string) => void
    ) => void;
  }

  function multerS3(options: Options): StorageEngine;

  export = multerS3;
}
