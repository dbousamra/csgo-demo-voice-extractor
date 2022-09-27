import { convertCELTFile } from './convert';
import { extractCELTFiles } from './extract';
import { promiseMap } from './utils';
import fs from 'fs';

const run = async () => {
  const demoFilename = process.argv[2];

  if (!demoFilename) {
    throw new Error('Please provide a path to a demo');
  }

  const outputPath = process.argv[3];

  if (!outputPath) {
    throw new Error('Please provide a path to store the output');
  }

  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath);
  }

  const outputFiles = await extractCELTFiles(demoFilename, outputPath);
  await promiseMap(outputFiles, convertCELTFile, 1);
};

run();
