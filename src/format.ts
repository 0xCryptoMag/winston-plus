import path from 'path'
import { inspect } from 'util'

import colors from 'colors/safe'
import { Format } from 'logform'
import { MESSAGE, SPLAT } from 'triple-beam'
import { format as winstonFormat, config } from 'winston'
import Table from 'cli-table3'

import calleeStore from './calleeStore'
import { Callee, DevConsoleFormatOptions } from './types'

/* eslint-disable no-control-regex */
export class DevConsoleFormat {
  private static readonly reSpaces = /^\s+/
  private static readonly reSpacesOrEmpty = /^(\s*)/
  private static readonly reColor = /\x1B\[\d+m/

  private static readonly chars = {
    singleLine: '▪',
    startLine: '┏',
    line: '┃',
    endLine: '┗',
  }

  public constructor(private opts: DevConsoleFormatOptions = {}) {
    if (typeof this.opts.addLineSeparation === 'undefined') {
      this.opts.addLineSeparation = true
    }
    if (typeof this.opts.showTimestamps === 'undefined') {
      this.opts.showTimestamps = false
    }
    if (typeof this.opts.inspectOptions === 'undefined') {
      this.opts.inspectOptions = {
        depth: Infinity,
        colors: true,
        maxArrayLength: Infinity,
        breakLength: 120,
        compact: Infinity,
      }
    }
    if (typeof this.opts.logLevels === 'undefined') {
      this.opts.logLevels = config.npm.levels
    }
    if (typeof this.opts.showMeta === 'undefined') {
      this.opts.showMeta = true
    }
    if (typeof this.opts.table === 'undefined') {
      this.opts.table = false
    }
  }

  private inspector(value: any, metaLines: string[]): void {
    const inspector = inspect(value, this.opts.inspectOptions || {})

    inspector.split('\n').forEach((line) => {
      metaLines.push(line)
    })
  }

  private makeTable(value: any, metaLines: string[]): void {
    const table = new Table(value[0])

    table.push(...value.slice(1))

    value = table.toString()

    value.split('\n').forEach((line: string) => {
      metaLines.push(line)
    })
  }

  private getMessage(info: any, chr: string, color: string): string {
    let message = info.message

    const hasMessage = message.replace(DevConsoleFormat.reSpacesOrEmpty, '')
      .length
    if (!hasMessage)
      message += `${color}${colors.dim(
        colors.italic('(no message)')
      )}${colors.reset(' ')}`

    message = message.replace(
      DevConsoleFormat.reSpacesOrEmpty,
      `$1${color}${colors.dim(chr)}${colors.reset(' ')}`
    )

    message = message

    return `${info.level}:${message}`
  }

  private getPadding(message?: string): string {
    let padding = ''
    const matches = message && message.match(DevConsoleFormat.reSpaces)
    if (matches && matches.length > 0) {
      padding = matches[0]
    }

    return padding
  }

  private getMs(info: any): string {
    let ms = ''
    if (info.ms) {
      ms = colors.italic(colors.dim(` ${info.ms}`))
    }

    return ms
  }

  private getTimestamp(info: any): string {
    let timestamp = ''
    if (info.timestamp) {
      timestamp = colors.italic(
        colors.dim(` ${info.timestamp.replace('T', ' ')}`)
      )
    }

    return timestamp
  }

  private getStackLines(info: any): string[] {
    const stackLines: string[] = []

    if (info.stack) {
      const error = new Error()
      error.stack = info.stack
      this.inspector(error, stackLines)
    }

    return stackLines
  }

  private getMetaLines(info: any): string[] {
    const metaLines: string[] = []
    let splat = info[(SPLAT as unknown) as string][0]

    if (this.opts.table) {
      if (Object.keys(splat).length > 0) {
        this.makeTable(splat, metaLines)
      }
    } else {
      splat = { ...splat }

      if (Object.keys(splat).length > 0) {
        this.inspector(splat, metaLines)
      }
    }

    return metaLines
  }

  private getCallee(): Callee | undefined {
    const callee = calleeStore?.value

    if (callee?.filePath) {
      if (!this.opts.basePath) {
        // By default remove anything before and including `src/`
        callee.filePath = callee.filePath.replace(/^.*\/src\//, '')
      } else {
        callee.filePath = callee.filePath.replace(
          `${path.resolve(this.opts.basePath)}/`,
          ''
        )
      }
    }

    return callee
  }

  private getColor(info: any): string {
    let color = ''
    const colorMatch = info.level.match(DevConsoleFormat.reColor)

    if (colorMatch) {
      color = colorMatch[0]
    }

    return color
  }

  private write(
    info: any,
    metaLines: string[],
    color: string,
    callee?: Callee
  ): void {
    const pad = this.getPadding(info.message)
    const infoIndex = (MESSAGE as unknown) as string

    if (this.opts.showTimestamps) {
      info[infoIndex] += `\n${colors.dim(
        info.level
      )}:${pad}${color}${colors.dim(
        DevConsoleFormat.chars.line
      )}${this.getTimestamp(info)}`
    }

    if (callee) {
      const filePath = ` at ${callee?.filePath}:${callee?.lineNumber}`
      const functionName = callee.functionName
        ? ` [${callee.functionName}]`
        : ''

      info[infoIndex] += `\n${colors.dim(
        info.level
      )}:${pad}${color}${colors.dim(
        metaLines.length
          ? DevConsoleFormat.chars.line
          : DevConsoleFormat.chars.endLine
      )}${colors.dim(
        colors.italic(`${filePath}${functionName}`)
      )}${colors.reset(' ')}`
    }

    metaLines.forEach((line, lineNumberIndex, arr) => {
      const lineNumber = colors.dim(
        `[${(lineNumberIndex + 1)
          .toString()
          .padStart(arr.length.toString().length, ' ')}]`
      )
      let chr = DevConsoleFormat.chars.line

      if (lineNumberIndex === arr.length - 1) {
        chr = DevConsoleFormat.chars.endLine
      }

      info[infoIndex] += `\n${colors.dim(
        info.level
      )}:${pad}${color}${colors.dim(chr)}${colors.reset(' ')}`
      info[infoIndex] += `${lineNumber} ${line}`
    })
    if (this.opts.addLineSeparation) {
      info[infoIndex] += '\n'
    }
  }

  public transform(info: any): any {
    info.message = info.message?.replace('\n', '').trimEnd() ?? ''

    const index = (MESSAGE as unknown) as string
    const callee = this.getCallee()

    let metaLines: string[] = [...this.getStackLines(info)]

    if (this.opts.showMeta) {
      metaLines.push(...this.getMetaLines(info))
    }

    const color = this.getColor(info)

    info[index] = this.getMessage(
      info,
      DevConsoleFormat.chars[
        metaLines.length > 0 || callee?.filePath ? 'startLine' : 'singleLine'
      ],
      color
    )
    info[index] += this.getMs(info)

    this.write(info, metaLines, color, callee)
    return info
  }
}

export const format = (opts?: DevConsoleFormatOptions): Format => {
  return winstonFormat.combine(
    winstonFormat.timestamp(),
    winstonFormat.ms(),
    winstonFormat.errors({ stack: true }),
    winstonFormat.splat(),
    winstonFormat.json(),
    winstonFormat.colorize({ all: true }),
    winstonFormat.padLevels({ levels: opts?.logLevels }),
    new DevConsoleFormat(opts)
  )
}
