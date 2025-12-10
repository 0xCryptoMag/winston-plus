import { InspectOptions } from 'util'

export interface Callee {
  functionName: string
  lineNumber: string
  filePath: string
}

export interface DevConsoleFormatOptions {
  inspectOptions?: InspectOptions
  basePath?: string
  showTimestamps?: boolean
  addLineSeparation?: boolean
  logLevels?: { [k: string]: number }
  showMeta?: boolean
  table?: boolean
  silent?: boolean
}

export type DevConsoleTransportOptions = DevConsoleFormatOptions
