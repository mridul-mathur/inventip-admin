import multer from "multer";
import type { NextRequest } from "next/server";
import { Readable } from "stream";

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      cb(new Error("Only image files are allowed"));
      return;
    }
    cb(null, true);
  },
});

export const uploadMiddleware = upload.fields([
  { name: "titleImage", maxCount: 1 },
  { name: "segments[].image", maxCount: 10 },
]);

const readableStreamToNodeStream = async (
  readableStream: ReadableStream<Uint8Array>
): Promise<Readable> => {
  const reader = readableStream.getReader();
  const stream = new Readable({
    read() {
      reader.read().then(({ done, value }) => {
        if (done) {
          this.push(null);
        } else {
          this.push(value);
        }
      });
    },
  });
  return stream;
};

const toExpressRequest = async (req: NextRequest): Promise<any> => {
  const body = req.body
    ? await readableStreamToNodeStream(req.body)
    : undefined;
  const headers = Object.fromEntries(req.headers.entries());
  return {
    ...req,
    body,
    headers,
  };
};

export const runMiddleware = async (req: NextRequest): Promise<any> => {
  return new Promise(async (resolve, reject) => {
    const expressReq = await toExpressRequest(req);
    uploadMiddleware(expressReq, {} as any, (err: any) => {
      if (err) {
        reject(err);
      } else {
        resolve(expressReq);
      }
    });
  });
};
