import chalk from "chalk";

export class Logger {
  static connection(message: string) {
    console.log(
      `${chalk.green("[CONNECTION]".padEnd(15))} ${chalk.white(message)}`
    );
  }

  static parsing(message: string) {
    console.log(
      `${chalk.whiteBright("[PARSE]".padEnd(15))} ${chalk.white(message)}`
    );
  }

  static routes(message: string) {
    console.log(`${chalk.cyan("[ROUTES]".padEnd(15))} ${chalk.white(message)}`);
  }

  static request(message: string) {
    console.log(
      `${chalk.yellow("[REQUEST]".padEnd(15))} ${chalk.white(message)}`
    );
  }

  static error(message: string) {
    console.log(`${chalk.red("[ERROR]".padEnd(15))} ${chalk.white(message)}`);
  }

  static retry(message: string) {
    console.log(
      `${chalk.hex("#FFA500")("[RETRY]".padEnd(15))} ${chalk.white(message)}`
    );
  }

  static watcher(message: string) {
    console.log(
      `${chalk.magenta("[WATCHER]".padEnd(15))} ${chalk.white(message)}`
    );
  }

  static success(message: string) {
    console.log(
      `${chalk.green("[SUCCESS]".padEnd(15))} ${chalk.white(message)}`
    );
  }
}
