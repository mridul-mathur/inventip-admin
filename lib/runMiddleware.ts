/* eslint-disable @typescript-eslint/no-unsafe-function-type */
export const runMiddleware = (
  req: any,
  res: any,
  fn: Function
): Promise<void> =>
  new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
