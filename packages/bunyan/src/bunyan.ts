import { Writable } from 'stream';

import { Logfire } from '@logfire-sh/node';
import { Context, LogLevel, StackContextHint } from '@logfire-sh/types';

const stackContextHint = {
  fileName: 'node_modules/bunyan',
  methodNames: ['fatal', 'error', 'warn', 'info', 'debug', 'trace'],
};

import { getLogLevel } from './helpers';

export class LogfireStream extends Writable {
  public constructor(private _logfire: Logfire) {
    super();
  }

  public _write(chunk: any, encoding: any, next: any) {
    // Sanity check for the format of the log
    const jsonString = chunk.toString();

    let log: any;

    // Should be JSON parsable
    try {
      log = JSON.parse(jsonString);
    } catch (e) {
      return next(e);
    }

    // Log should have string `msg` key, > 0 length
    if (typeof log.msg !== 'string' || !log.msg.length) {
      return next();
    }

    // Logging meta data
    const meta: Context = {};

    // Copy `time` if set
    if (typeof log.time === 'string' || log.time.length) {
      const time = new Date(log.time);
      if (!isNaN(time.valueOf())) {
        meta.dt = time;
      }
    }

    // Carry over any additional data fields
    Object.keys(log)
      .filter((key) => ['time', 'msg', 'level', 'v'].indexOf(key) < 0)
      .forEach((key) => (meta[key] = log[key]));

    // Determine the log level
    const level = getLogLevel(log.level);

    // Log to Logfire
    void this._logfire.log(
      log.msg,
      level,
      meta,
      stackContextHint as StackContextHint
    );

    next();
  }
}
