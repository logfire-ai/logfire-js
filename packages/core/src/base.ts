import {
  ILogLevel,
  ILogfireLog,
  ILogfireOptions,
  Context,
  LogLevel,
  Middleware,
  Sync,
} from '@logfire/types';
import { makeBatch, makeThrottle } from '@logfire/tools';

// Types
type Message = string | Error;

// Set default options for Logfire
const defaultOptions: ILogfireOptions = {
  // Default sync endpoint (protocol + domain)
  endpoint: 'https://apibeta2.logfire.sh/logfire.sh',

  // Maximum number of logs to sync in a single request to Logfire.sh
  batchSize: 1000,

  // Max interval (in milliseconds) before a batch of logs proceeds to syncing
  batchInterval: 1000,

  // Maximum number of sync requests to make concurrently
  syncMax: 5,

  // If true, errors/failed logs should be ignored
  ignoreExceptions: true,

  // maximum depth (number of attribute levels) of a context object
  contextObjectMaxDepth: 50,

  // produce a warn log when context object max depth is reached
  contextObjectMaxDepthWarn: true,

  // produce a warning when circular reference is found in context object
  contextObjectCircularRefWarn: true,
};

/**
 * Logfire core class for logging to the Logfire.sh service
 */
class Logfire {
  // Logfire source token
  protected _sourceToken: string;

  // Logfire library options
  protected _options: ILogfireOptions;

  // Batch function
  protected _batch: any;

  // Flush function
  protected _flush: any;

  // Middleware
  protected _middleware: Middleware[] = [];

  // Sync function
  protected _sync?: Sync;

  // Number of logs logged
  private _countLogged = 0;

  // Number of logs successfully synced with Logfire
  private _countSynced = 0;

  /* CONSTRUCTOR */

  /**
   * Initializes a new Logfire instance
   *
   * @param sourceToken: string - Private source token for logging to Logfire.sh
   * @param options?: ILogfireOptions - Optionally specify Logfire options
   */
  public constructor(sourceToken: string, options?: Partial<ILogfireOptions>) {
    // First, check we have a valid source token
    if (typeof sourceToken !== 'string' || sourceToken === '') {
      throw new Error('Logfire source token missing');
    }

    // Store the source token, to use for syncing with Logfire.sh
    this._sourceToken = sourceToken;

    // Merge default and user options
    this._options = { ...defaultOptions, ...options };

    // Create a throttler, for sync operations
    const throttle = makeThrottle(this._options.syncMax);

    // Sync after throttling
    const throttler = throttle((logs: any) => {
      return this._sync!(logs);
    });

    // Create a batcher, for aggregating logs by buffer size/interval
    const batcher = makeBatch(
      this._options.batchSize,
      this._options.batchInterval
    );

    this._batch = batcher.initPusher((logs: any) => {
      return throttler(logs);
    });

    this._flush = batcher.flush;
  }

  /* PRIVATE METHODS */
  private getContextFromError(e: Error) {
    return {
      stack: e.stack,
    };
  }

  /* PUBLIC METHODS */

  /**
   * Flush batched logs to Logfire
   */
  public async flush() {
    return this._flush();
  }

  /**
   * Number of entries logged
   *
   * @returns number
   */
  public get logged(): number {
    return this._countLogged;
  }

  /**
   * Number of log entries synced with Logfire.sh
   *
   * @returns number
   */
  public get synced(): number {
    return this._countSynced;
  }

  /**
   * Log an entry, to be synced with Logfire.sh
   *
   * @param message: string - Log message
   * @param level (LogLevel) - Level to log at (debug|info|warn|error)
   * @param context: (Context) - Context (optional)
   * @returns Promise<ILogfireLog> after syncing
   */
  public async log<TContext extends Context>(
    message: Message,
    level: ILogLevel = LogLevel.Info,
    context: TContext = {} as TContext
  ): Promise<ILogfireLog & TContext> {
    // Check that we have a sync function
    if (typeof this._sync !== 'function') {
      throw new Error('No Logfire logger sync function provided');
    }

    // Increment log count
    this._countLogged++;

    // Start building the log message
    let log: Partial<ILogfireLog> = {
      // Implicit date timestamp
      dt: new Date(),

      // Explicit level
      level,

      // Add initial context
      ...context,
    };

    // Determine the type of message...

    // Is this an error?
    if (message instanceof Error) {
      log = {
        // Add stub
        ...log,

        // Add stack trace
        ...this.getContextFromError(message),

        // Add error message
        message: message.message,
      };
    } else {
      log = {
        // Add stub
        ...log,

        // Add string message
        message,
      };
    }

    let transformedLog = log as ILogfireLog | null;
    for (const middleware of this._middleware) {
      let newTransformedLog = await middleware(transformedLog as ILogfireLog);
      if (newTransformedLog == null) {
        // Don't push the log if it was filtered out in a middleware
        return transformedLog as ILogfireLog & TContext;
      }
      transformedLog = newTransformedLog;
    }

    try {
      // Push the log through the batcher, and sync
      await this._batch(transformedLog);

      // Increment sync count
      this._countSynced++;
    } catch (e) {
      // Catch any errors - re-throw if `ignoreExceptions` == false
      if (!this._options.ignoreExceptions) {
        throw e;
      } else {
        console.error(e);
      }
    }

    // Return the resulting log
    return transformedLog as ILogfireLog & TContext;
  }

  /**
   *
   * Debug level log, to be synced with Logfire.sh
   *
   * @param message: string - Log message
   * @param context: (Pick<ILogfireLog, "context">) - Context (optional)
   * @returns Promise<ILogfireLog> after syncing
   */
  public async debug<TContext extends Context>(
    message: Message,
    context: TContext = {} as TContext
  ) {
    return this.log(message, LogLevel.Debug, context);
  }

  /**
   *
   * Info level log, to be synced with Logfire.sh
   *
   * @param message: string - Log message
   * @param context: (Pick<ILogfireLog, "context">) - Context (optional)
   * @returns Promise<ILogfireLog> after syncing
   */
  public async info<TContext extends Context>(
    message: Message,
    context: TContext = {} as TContext
  ) {
    return this.log(message, LogLevel.Info, context);
  }

  /**
   *
   * Warning level log, to be synced with Logfire.sh
   *
   * @param message: string - Log message
   * @param context: (Pick<ILogfireLog, "context">) - Context (optional)
   * @returns Promise<ILogfireLog> after syncing
   */
  public async warn<TContext extends Context>(
    message: Message,
    context: TContext = {} as TContext
  ) {
    return this.log(message, LogLevel.Warn, context);
  }

  /**
   *
   * Warning level log, to be synced with Logfire.sh
   *
   * @param message: string - Log message
   * @param context: (Pick<ILogfireLog, "context">) - Context (optional)
   * @returns Promise<ILogfireLog> after syncing
   */
  public async error<TContext extends Context>(
    message: Message,
    context: TContext = {} as TContext
  ) {
    return this.log(message, LogLevel.Error, context);
  }

  /**
   * Sets the sync method - i.e. the final step in the pipeline to get logs
   * over to Logfire.sh
   *
   * @param fn - Pipeline function to use as sync method
   */
  public setSync(fn: Sync): void {
    this._sync = fn;
  }

  /**
   * Add a middleware function to the logging pipeline
   *
   * @param fn - Function to add to the log pipeline
   * @returns void
   */
  public use(fn: Middleware): void {
    this._middleware.push(fn);
  }

  /**
   * Remove a function from the pipeline
   *
   * @param fn - Pipeline function
   * @returns void
   */
  public remove(fn: Middleware): void {
    this._middleware = this._middleware.filter((p) => p !== fn);
  }
}

// noinspection JSUnusedGlobalSymbols
export default Logfire;
