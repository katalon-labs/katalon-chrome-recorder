import { parse, Schema, stringify } from '@puppeteer/replay';
import { KatalonStringifyExtension } from './katalonStringifyExtension.js';

export function parseRecordingContent(
  recordingContent: string,
): Schema.UserFlow {
  return parse(JSON.parse(recordingContent));
}

export async function transformParsedRecording(
  parsedRecording: Schema.UserFlow,
) {
  return await stringify(parsedRecording, {
    extension: new KatalonStringifyExtension(),
  });
}

export async function katalonStringifyChromeRecording(
  recording: string,
): Promise<Promise<string> | undefined> {
  if (recording.length === 0) {
    console.log(
      `No recording found. Please create and upload before trying again`,
    );
    return;
  }

  const parsedRecording = parseRecordingContent(recording);

  return await transformParsedRecording(parsedRecording);
}
