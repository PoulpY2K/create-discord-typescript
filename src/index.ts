#!/usr/bin/env node

import chalk from "chalk";
import path from "node:path";
import prompts from "prompts";
import {ValidateNpmName} from "./module/name";
import {GetPackageManager, InstallPackage, PackageManager} from "./module/dependencies.js";
import {DownloadAndExtractTemplate, GetStarters} from "./module/starter";
import {IsFolderEmpty, MakeDir} from "./module/directory.js";
import ora from "ora";
import {execSync} from "child_process";
import {TryGitInit} from "./module/version-control";

console.log(`
   ██████╗██████╗ ███████╗ █████╗ ████████╗███████╗    ██████╗ ██╗███████╗ ██████╗ ██████╗ ██████╗ ██████╗ 
  ██╔════╝██╔══██╗██╔════╝██╔══██╗╚══██╔══╝██╔════╝    ██╔══██╗██║██╔════╝██╔════╝██╔═══██╗██╔══██╗██╔══██╗
  ██║     ██████╔╝█████╗  ███████║   ██║   █████╗      ██║  ██║██║███████╗██║     ██║   ██║██████╔╝██║  ██║
  ██║     ██╔══██╗██╔══╝  ██╔══██║   ██║   ██╔══╝      ██║  ██║██║╚════██║██║     ██║   ██║██╔══██╗██║  ██║
  ╚██████╗██║  ██║███████╗██║  ██║   ██║   ███████╗    ██████╔╝██║███████║╚██████╗╚██████╔╝██║  ██║██████╔╝
   ╚═════╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝   ╚═╝   ╚══════╝    ╚═════╝ ╚═╝╚══════╝ ╚═════╝ ╚═════╝ ╚═╝  ╚═╝╚═════╝ 
  ${chalk.dim(`v0.0.1`)}
`);

let projectPath = "./";

const res = await prompts(
    {
        initial: 'my-discord-bot',
        name: 'path',
        message: "What is the name of your project ?",
        type: "text",
        validate: (name) => {
            const validation = ValidateNpmName(path.basename(path.resolve(name)));
            if (validation.valid) {
                return true;
            }

            return `"Invalid project name: ${validation.errors?.[0] ?? "unknown"}`;
        },
    },
    {
        onCancel: () => {
            process.exit();
        },
    },
);

if (typeof res.path === "string") {
    projectPath = res.path.trim();
}

const resolvedProjectPath = path.resolve(projectPath);
const projectName = path.basename(resolvedProjectPath);

/**
 * Select package manager
 */

const packageManager = await GetPackageManager();

if (packageManager === null) {
    process.exit();
}

/**
 * Select template prompt
 */

const starterList = await GetStarters();

if (!starterList.length) {
    console.log(chalk.red("> Unable to load starters :("));
    process.exit();
}

const response = await prompts<string>(
    {
        choices: starterList,
        message: "Pick starter",
        name: "starter",
        type: "select",
    },
    {
        onCancel: () => {
            process.exit();
        },
    },
);

/**
 * Make project directory
 */

try {
    await MakeDir(resolvedProjectPath);
} catch (err) {
    console.log(chalk.red("> Failed to create specified directory :("));
    process.exit();
}

/**
 * Check if directory is clean
 */

if (!IsFolderEmpty(resolvedProjectPath, projectName)) {
    process.exit();
}

const spinner = ora({
    text: chalk.bold("Downloading starter..."),
}).start();

try {
    await DownloadAndExtractTemplate(resolvedProjectPath, response.starter);
    spinner.succeed(chalk.bold("Downloaded starter"));
} catch (err) {
    spinner.fail(chalk.bold("Failed to download selected starter :("));
    process.exit();
}

/**
 * Update project name
 */

try {
    execSync(
        `npx -y json -I -f package.json -e "this.name=\\"${projectName}\\""`,
        {
            cwd: resolvedProjectPath,
            stdio: "ignore",
        },
    );
} catch (err) {
    console.log(chalk.red("> Failed to update project name :("));
}

/**
 * Init git
 */

TryGitInit(resolvedProjectPath);

/**
 * Install packages
 */

await InstallPackage(resolvedProjectPath, packageManager);

/**
 * End
 */
const isWin = process.platform === "win32";

console.log(
    chalk.greenBright("√"),
    chalk.bold("Created discord typescript project"),
    chalk.gray("»"),
    chalk.greenBright(projectName),
);

console.log(chalk.blueBright("?"), chalk.bold("Next Steps!"));
console.log(`\t> cd ${projectPath}`);

if (PackageManager.none === packageManager) {
    console.log("\t> npm install");
}

if (isWin) {
    console.log(chalk.dim("\t> // Command Prompt (CMD)"));
    console.log("\t> set BOT_TOKEN=REPLACE_THIS_WITH_YOUR_BOT_TOKEN");
    console.log(chalk.dim("\t> // Powershell"));
    console.log('\t> $ENV:BOT_TOKEN="REPLACE_THIS_WITH_YOUR_BOT_TOKEN"');
} else {
    console.log("\t> export BOT_TOKEN=REPLACE_THIS_WITH_YOUR_BOT_TOKEN");
}

if (PackageManager.none === packageManager) {
    console.log("\t> npm run dev");
} else {
    console.log(`\t> ${PackageManager[packageManager]} run dev`);
}

console.log();
console.log(chalk.blueBright("?"), chalk.bold("Support the Discordx project"));
console.log("    Discord Server: https://discordx.js.org/discord");
console.log("     Documentation: https://discordx.js.org");
console.log("            GitHub: https://github.com/discordx-ts/discordx");
console.log(
    chalk.greenBright("√"),
    chalk.bold("Thank you for using my CLI"),
    chalk.red(" ❤️"),
);
