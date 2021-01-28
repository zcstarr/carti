import chalk from "chalk";
import { exit } from "process";
export async function commandHandler<Args extends any[], Return>(
    operation: (...operationParameters: Args) => Promise<Return>,
    ...parameters: Args
): Promise<Return> {
    try {
       const result = await operation(...parameters);
       return result
    } catch (e) {
        console.error(`${chalk.bold(chalk.red("Error: "))}${chalk.red(e.message)}`)
        exit(1)
    }
}