# winston-dev-console

A Winston@3 console format for development (based on [winston-console-format](https://github.com/duccio/winston-console-format)) that aims to improve NodeJS development UX by
* adding the source of the logging statement to the log output
* optimizing readability of each log statement through log statement separation, output colorization and arg pretty printing
   

## Demo

![](demo.png)

### Real world screenshot:

![](demo2.png)

## Install

```bash
npm install @epegzz/winston-dev-console
```

or

```bash
yarn add @epegzz/winston-dev-console
```
<br>

## Usage TypeScript

```typescript
import { createLogger, format, transports } from "winston";
import winstonDevConsole from "@epegzz/winston-dev-console";
import util from "util";

let log = createLogger({
  level: "silly", // or use process.env.LOG_LEVEL
  format: format.combine(
    format.timestamp(),
    format.ms(),
    format.errors({ stack: true }),
    format.splat(),
    format.json()
  ),
  defaultMeta: { service: "Test" },
  transports: [
    new transports.Console({
      format: winstonDevConsole.format()
    }),
  ],
});

log = winstonDevConsole.init(log)

log.silly("Logging initialized");
log.debug("Debug an object", { make: "Ford", model: "Mustang", year: 1969 });
log.verbose("Returned value", { value: util.format });
log.info("Information", {
  options: ["Lorem ipsum", "dolor sit amet"],
  values: ["Donec augue eros, ultrices."],
});
log.warn("Warning");
log.error(new Error("Unexpected error"));
```

## Usage JavaScript

```js
const { createLogger, format, transports } = require("winston");
const winstonDevConsole = require("@epegzz/winston-dev-console").default;
const util = require("util");

let log = createLogger({
  level: "silly", // or use process.env.LOG_LEVEL
  format: format.combine(
    format.timestamp(),
    format.ms(),
    format.errors({ stack: true }),
    format.splat(),
    format.json()
  ),
  defaultMeta: { service: "Test" },
  transports: [
    new transports.Console({
      format: winstonDevConsole.format()
    }),
  ],
});

log = winstonDevConsole.init(log)

log.silly("Logging initialized");
log.debug("Debug an object", { make: "Ford", model: "Mustang", year: 1969 });
log.verbose("Returned value", { value: util.format });
log.info("Information", {
  options: ["Lorem ipsum", "dolor sit amet"],
  values: ["Donec augue eros, ultrices."],
});
log.warn("Warning");
log.error(new Error("Unexpected error"));
```

## API

## winstonDevConsole.format(options)

### options

Configuration object.<br><br>Type: `DevConsoleFormatOptions`

### options.inspectOptions

`util.inspect()` [configuration object](https://nodejs.org/api/util.html#util_util_inspect_object_options).<br><br> Type: `Object`<br> 

### options.basePath

Used to remove the base path of the project when showing the file path of the log statement.
By default anything in the path before (and including) the `src` folder will be removed.
<br><br> Type: `String`<br>

## Acknowledgements

This project is inspired by and partly shamelessly copied from [winston-console-format](https://github.com/duccio/winston-console-format)