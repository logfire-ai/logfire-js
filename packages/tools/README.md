# [logfire](https://logfire.sh) JavaScript client by [Better Stack](https://logfire.sh) - Helper tools

[![ISC License](https://img.shields.io/badge/license-ISC-ff69b4.svg)](LICENSE.md)

**Looking for a logging solution?**  
Check out [logfire](https://logfire.sh) and [logfire clients for JavaScript and Node.js](https://logfire.shdocs/logs/javascript/).

## `@logfire/tools`

This library provides helper tools used by the [JavaScript logger](https://github.com/logfire/logfire-js).

## Tools

### `Queue<T>`

Generic [FIFO](<https://en.wikipedia.org/wiki/FIFO_(computing_and_electronics)>) queue. Used by `makeThrottle` to store pipeline functions to be executed as concurrent 'slots' become available. Provides fast retrieval for any primitive or object that needs ordered, first-in, first-out retrieval.

Used to store `.log()` Promises that are being batched/throttled.

**Usage example**

```typescript
import { Queue } from '@logfire/tools';

// Interface representing a person
interface IPerson {
  name: string;
  age: number;
}

// Create a queue to store `IPerson` objects
const q = new Queue<IPerson>();

// Add a couple of records...
q.push({ name: 'Jeff', age: 50 });
q.push({ name: 'Sally', age: 39 });

// Pull values from the queue...
while (q.length) {
  console.log(q.shift().name); // <-- first Jeff, then Sally...
}
```

### `makeThrottle<T>(max: number)`

Returns a `throttle` higher-order function, which wraps an `async` function, and limits the number of active Promises to `max: number`

The `throttle` function has this signature:

```
throttle(fn: T): (...args: InferArgs<T>[]) => Promise<InferArgs<T>>
```

#### Usage example

```typescript
import logfire from '@logfire/logger';
import { makeThrottle } from '@logfire/tools';

// Create a new logfire instance
const logfire = new logfire('sourceToken');

// Guarantee a pipeline will run a max of 2x at once
const throttle = makeThrottle(2);

// Create a basic pipeline function which resolves after 2 seconds
const pipeline = async (log) =>
  new Promise((resolve) => {
    setTimeout(() => resolve(log), 2000);
  });

// Add a pipeline which has been throttled
logfire.addPipeline(throttle(pipeline));

// Add 10 logs, and store the Promises
const promises = [];
for (let i = 0; i < 10; i++) {
  promises.push(logfire.log({ message: `Hello ${i}` }));
}

void (async () => {
  void (await promises); // <-- will take 10 seconds total!
})();
```

### `makeBatch(size: number, flushTimeout: number)`

Creates a higher-order batch function aggregates logfire logs and resolves when either `size` # of logs have been collected, or when `flushTimeout` (in ms) has elapsed -- whichever occurs first.

This is used alongside the throttler to provide an array of [`IlogfireLog`](https://github.com/logfire/logfire-js/tree/master/packages/types#ilogfirelog) to the function set in the `.setSync()` method, to be synced with [logfire.sh](https://logfire.sh)

Used internally by the [`@logfire/core Base class`](https://github.com/logfire/logfire-js/blob/master/packages/core/src/base.ts) to implicitly batch logs:

```typescript
// Create a throttler, for sync operations
const throttle = makeThrottle(this._options.syncMax);

// Sync after throttling
const throttler = throttle((logs: any) => {
  return this._sync!(logs);
});

// Create a batcher, for aggregating logs by buffer size/interval
const batcher = makeBatch(this._options.batchSize, this._options.batchInterval);

this._batch = batcher((logs: any) => {
  return throttler(logs);
});
```

## LICENSE

[ISC](LICENSE.md)
