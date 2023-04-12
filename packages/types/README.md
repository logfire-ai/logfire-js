# [logfire](https://logfire.sh) JavaScript client by [Better Stack](https://logfire.sh) - TypeScript types

[![ISC License](https://img.shields.io/badge/license-ISC-ff69b4.svg)](LICENSE.md)

**Looking for a logging solution?**  
Check out [logfire](https://logfire.sh) and [logfire clients for JavaScript and Node.js](https://logfire.shdocs/logs/javascript/).

## `@logfire/types`

The logfire JS library packages are written in TypeScript.

Various types are shared between multiple packages. Those shared types have been separated out into their own package, to make it easier for importing.

That's what you'll find in this package.

## Importing types

You can import a shared type into a TypeScript project by importing directly from this package:

```typescript
// For example, `IlogfireLog`
import { IlogfireLog } from '@logfire/types';
```

## Types

### `IlogfireOptions`

Config options for the logfire [Base class](https://github.com/logfire/logfire-js/tree/master/packages/core#the-base-class) for creating a logfire client instance.

```typescript
export interface IlogfireOptions {
  /**
   * Endpoint URL for syncing logs with logfire.sh
   */
  endpoint: string;

  /**
   * Maximum number of logs to sync in a single request to logfire.sh
   */
  batchSize: number;

  /**
   * Max interval (in milliseconds) before a batch of logs proceeds to syncing
   */
  batchInterval: number;

  /**
   * Maximum number of sync requests to make concurrently (useful to limit
   * network I/O)
   */
  syncMax: number;

  /**
   * Boolean to specify whether thrown errors/failed logs should be ignored
   */
  ignoreExceptions: boolean;
}
```

### `LogLevel`

Enum representing a log level between _debug_ -> _error_:

```typescript
enum LogLevel {
  Debug = 'debug',
  Info = 'info',
  Warn = 'warn',
  Error = 'error',
}
```

### `Context`

You can add meta information to your logs by adding a `string`, `boolean`, `Date` or `number` to a string field (or any nested object containing fields of the same.)

We call this 'context' and these are the types:

```typescript
/**
 * Context type - a string/number/bool/Date, or a nested object of the same
 */
export type ContextKey = string | number | boolean | Date;
export type Context = { [key: string]: ContextKey | Context };
```

### `IlogfireLog`

The log object which is implicitly created by calling `.log()` (or any explicit log level function - e.g. `.info()`), and is passed down the chain for logfire middleware before syncing with [logfire.sh](https://logfire.sh)

```typescript
interface IlogfireLog {
  dt: Date;
  level: LogLevel; // <-- see `LogLevel` above
  message: string;
  [key: string]: ContextKey | Context; // <-- see `Context` above
}
```

### `Middleware`

A type representing a [Middleware function](https://github.com/logfire/logfire-js/tree/master/packages/core#middleware) passed to `.use()` (or `.remove()`)

```typescript
type Middleware = (log: IlogfireLog) => Promise<IlogfireLog>;
```

### `Sync`

The type of the function passed to `.setSync()`, for syncing a log with [logfire.sh](https://logfire.sh):

Note: Differs from the `Middleware` type because it receives - and resolves to a Promise of - an array of batched `IlogfireLog`.

```typescript
Sync = (logs: IlogfireLog[]) => Promise<IlogfireLog[]>
```

## LICENSE

[ISC](LICENSE.md)
