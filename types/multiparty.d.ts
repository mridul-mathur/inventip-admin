declare module "multiparty" {
  import { IncomingMessage } from "http";

  type File = {
    fieldName: string;
    originalFilename: string;
    path: string;
    headers: Record<string, string>;
    size: number;
  };

  type Files = Record<string, File[]>;

  type Fields = Record<string, string[]>;

  type Callback = (error: Error | null, fields: Fields, files: Files) => void;

  export default class Form {
    parse(request: IncomingMessage, callback: Callback): void;
  }
}
