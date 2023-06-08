import fetch from 'cross-fetch';

import { ILogfireLog, ILogfireOptions } from '@logfire-sh/types';
import { Base } from '@logfire-sh/core';

// Awaiting: https://bugs.chromium.org/p/chromium/issues/detail?id=571722
// import { getUserAgent } from "./helpers";

export class Browser extends Base {
  public constructor(sourceToken: string, options?: Partial<ILogfireOptions>) {
    super(sourceToken, options);

    // Sync function
    const sync = async (logs: ILogfireLog[]): Promise<ILogfireLog[]> => {
      const res = await fetch(this._options.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this._sourceToken}`,
          // Awaiting: https://bugs.chromium.org/p/chromium/issues/detail?id=571722
          // "User-Agent": getUserAgent()
        },
        body: JSON.stringify(logs),
      });

      if (res.ok) {
        return logs;
      }

      /**
       * TODO: if status is 50x throw custom ServerError
       * to be used in retry logic
       */
      throw new Error(res.statusText);
    };

    // Set the throttled sync function
    this.setSync(sync);
  }
}
