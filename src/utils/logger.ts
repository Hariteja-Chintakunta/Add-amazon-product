import * as fs from 'fs';
import * as path from 'path';

export enum LogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  STEP = 'STEP',
}

/**
 * Simple timestamped logger.
 * Every message goes to the console AND to a per-run log file under
 * <OUTPUT_DIR>/logs/run-<timestamp>.log, so the whole flow is auditable.
 */
export class Logger {
  private readonly logFile: string;

  constructor(outputDir: string) {
    const logsDir = path.join(outputDir, 'logs');
    fs.mkdirSync(logsDir, { recursive: true });
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.logFile = path.join(logsDir, `run-${timestamp}.log`);
  }

  private write(level: LogLevel, message: string): void {
    const line = `[${new Date().toISOString()}] [${level}] ${message}`;
    console.log(line);
    fs.appendFileSync(this.logFile, line + '\n');
  }

  info(message: string): void {
    this.write(LogLevel.INFO, message);
  }

  warn(message: string): void {
    this.write(LogLevel.WARN, message);
  }

  error(message: string): void {
    this.write(LogLevel.ERROR, message);
  }

  /** A major step in the flow — stands out in the log. */
  step(message: string): void {
    this.write(LogLevel.STEP, message);
  }

  getLogFile(): string {
    return this.logFile;
  }
}
