import nock from "nock";
import { base64Encode } from "@logfire/tools";
import { ILogfireLog } from "@logfire/types";

import { Browser } from "./browser";

/**
 * Create a log with a random string / current date
 */
function getRandomLog(message: string): Partial<ILogfireLog> {
  return {
    message
  };
}

// set new property btoa in node environment to run the tests
(global as any).btoa = base64Encode;

describe("browser tests", () => {
  // Awaiting: https://bugs.chromium.org/p/chromium/issues/detail?id=571722

  // it("should set a User-Agent based on the right version number", () => {
  //   const expectedValue = `logfire-js(browser)/${version}`;
  //   const actualValue = getUserAgent();
  //   expect(actualValue).toEqual(expectedValue);
  // });

  it("should echo log if logfire sends 20x status code", async done => {
    nock("https://apibeta2.logfire.sh/logfire.sh").post('/').reply(201);

    const message: string = String(Math.random());
    const expectedLog = getRandomLog(message);
    const browser = new Browser("valid source token");
    const echoedLog = await browser.log(message);
    expect(echoedLog.message).toEqual(expectedLog.message);

    done();
  });

  it("should throw error if logfire sends non 200 status code", async done => {
    nock("https://apibeta2.logfire.sh/logfire.sh").post('/').reply(401);

    const browser = new Browser("invalid source token", { ignoreExceptions: false });
    const message: string = String(Math.random);
    await expect(browser.log(message)).rejects.toThrow();

    done();
  });
});
