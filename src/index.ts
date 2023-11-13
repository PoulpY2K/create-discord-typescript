#!/usr/bin/env node

import chalk from "chalk";
import boxen from "boxen";

console.log(`
${boxen(chalk.green("Hello world!"), {padding: 1, borderColor: 'white', dimBorder: true})}
`);
