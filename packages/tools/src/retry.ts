import { ILogfireLog } from "@logfire/types";

/**
 * maximum number of tries to push logs to logfire
 */
let MAX_TRIES = 3;

/**
 * delays excution of function by `sec` seconds.
 *
 * @param sec - Number
 */
function delay(sec: number): Promise<any> {
  return new Promise((resolve) => setTimeout(resolve, sec * 1000));
}

/**
 * tries to process logs maximum 3 times in case of server error.
 *
 * @param fn - (logs: ILogfireLog[]) => Promise<ILogfireLog[]>
 */
export default async function makeRetry(
  fn: (logs: ILogfireLog[]) => Promise<ILogfireLog[]>
) {
  /**
   * number of retries
   */
  let tries: number = 0;

  /**
   * list of try time in seconds
   */
  let timeouts: number[] = [0, 1];

  /**
   * pushes logs for process function
   * @param logs - ILogfireLog[]
   */
  return async function retry(logs: ILogfireLog[]): Promise<ILogfireLog[]> {
    //TODO: retry only when there is server error.
    while (tries++ < MAX_TRIES) {
      try {
        /**
         * returns Fibonacci timeout based on try time list
         */
        const timeout = timeouts
          .slice()
          .reverse()
          .slice(0, 2)
          .reduce((acc, curr) => acc + curr, 0);

        timeouts.push(timeout);
        await delay(timeout);
        return await fn(logs);
      } catch (e) {
        /**
         * throw error if could not process logs all three tries
         */
        if (tries === MAX_TRIES) {
          throw e;
        }
      }
    }

    return Promise.resolve(logs);
  };
}
