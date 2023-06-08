import { LogEntry } from 'winston';
import Transport from 'winston-transport';

import { Logfire } from '@logfire-sh/node';
import { LogLevel, StackContextHint } from '@logfire-sh/types';

const stackContextHint = {
  fileName: 'node_modules/winston',
  methodNames: [
    'log',
    'error',
    'warn',
    'info',
    'http',
    'verbose',
    'debug',
    'silly',
  ],
};

export class LogfireTransport extends Transport {
  public constructor(
    private _logfire: Logfire,
    opts?: Transport.TransportStreamOptions
  ) {
    super(opts);
  }

  public log(info: LogEntry, cb: Function) {
    // Pass the log to Winston's internal event handlers
    setImmediate(() => {
      this.emit('logged', info);
    });

    const { level, message, ...meta } = info;

    // Determine the log level

    // Log out to Logfire
    void this._logfire.log(
      message,
      level,
      meta,
      stackContextHint as StackContextHint
    );

    // Winston callback...
    cb();
  }
}
