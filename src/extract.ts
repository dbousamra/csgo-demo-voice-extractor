import { DemoFile } from 'demofile';
import fs from 'fs';

export const extractCELTFiles = async (
  demoFilename: string,
  outputPath: string,
): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    const stream = fs.createReadStream(demoFilename);
    const demoFile = new DemoFile();

    const audioFds = new Map<string, number>();
    const outputFiles: Set<string> = new Set<string>();

    demoFile.on('svc_VoiceInit', (data) => {
      console.log('svc_VoiceInit', data);

      if (data.codec !== 'vaudio_celt' || data.quality !== 5 || data.version !== 3) {
        reject(new Error('Unexpected voice codec'));
      }
    });

    demoFile.on('svc_VoiceData', (msg) => {
      const player = demoFile.entities.getBySteam64Id(msg.xuid);
      if (!player) return;

      let fd = audioFds.get(player.name);

      const outputFile = `${outputPath}/${player.name}.bin`;

      if (!fd) {
        fd = fs.openSync(outputFile, 'w');
        audioFds.set(player.name, fd);
      }

      console.log(`Writing ${player.name}`);
      fs.writeSync(fd, msg.voiceData);
      outputFiles.add(outputFile);
    });

    demoFile.on('end', (e) => {
      if (e.error) {
        reject(e.error);
      }

      audioFds.forEach((fd) => {
        fs.closeSync(fd);
      });

      console.log('Finished.');
      resolve(Array.from(outputFiles));
    });

    demoFile.parseStream(stream);
  });
};
