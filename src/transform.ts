import chalk from 'chalk';
import { readFileSync, writeFile, mkdir, existsSync } from 'fs';
import * as path from 'path';
import { katalonStringifyChromeRecording } from './main.js';
import { ExportToFile, Flags } from './types.js';
import { format } from 'prettier';
import { stringify } from 'querystring';

const __dirname = path.resolve(path.dirname('.'));

export function formatParsedRecordingContent(
  transformedRecordingContent: string,
): string {
  // return format(transformedRecordingContent, {
  //   semi: true,
  //   singleQuote: true,
  //   parser: 'java',
  //   plugins: ["prettier-plugin-java"]
  // });
  return transformedRecordingContent;
}

export function runTransformsOnChromeRecording({
  files,
  outputPath,
  flags,
}: {
  files: string[];
  outputPath: string;
  flags: Flags;
}) {
  const outputFolder = path.join(__dirname, outputPath);
  const { dry } = flags;

  return files.map(async (file) => {
    console.log(
      chalk.green(`🦉 Running Katalon  Chrome Recorder on ${file}\n`),
    );

    const recordingContent = readFileSync(file, 'utf-8');
    const stringifiedFile = await katalonStringifyChromeRecording(
      recordingContent,
    );

    if (!stringifiedFile) {
      return;
    }

    const formattedStringifiedFile =
      formatParsedRecordingContent(stringifiedFile);

    const fileName = file.split('/').pop();
    const testName = fileName ? fileName.replace('.json', '') : undefined;

    if (dry) {
      console.log(formattedStringifiedFile);
    } else if (!testName) {
      chalk.red('Please try again. Now file or folder found');
    } else {
      exportFileToFolder({
        stringifiedFile: formattedStringifiedFile,
        testName,
        outputPath,
        outputFolder,
      });
    }
  });
}

function exportFileToFolder({
  stringifiedFile,
  testName,
  outputPath,
  outputFolder,
}: ExportToFile): void {
  const folderPath = path.join('.', outputPath);
  if (!existsSync(folderPath)) {
    mkdir(
      path.join('.', outputPath),
      {
        recursive: true,
      },
      (err: NodeJS.ErrnoException | null) => {
        if (!err) {
          exportFileToFolder({
            stringifiedFile,
            testName,
            outputFolder,
            outputPath,
          });
        } else {
          console.error(
            `😭 Something went wrong while creating ${outputPath}\n Stacktrace: ${err?.stack}`,
          );
        }
      },
    );
  } else {
    writeFile(
      path.join(outputFolder, `/${testName}.groovy`),
      stringifiedFile,
      (err: NodeJS.ErrnoException | null) => {
        if (!err) {
          console.log(
            chalk.green(
              `\n ✅ ${testName}.json exported to ${outputPath}/${testName}.groovy\n `,
            ),
          );
        } else {
          console.log(
            chalk.red(
              `\n 😭 Something went wrong exporting ${outputPath}/${testName}.groovy \n`,
            ),
          );
        }
      },
    );
  }
}
