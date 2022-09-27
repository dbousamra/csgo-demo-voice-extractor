import ffi from 'ffi-napi';
import fs from 'fs';
import ref from 'ref-napi';
import { WaveFile } from 'wavefile';

export const convertCELTFile = async (filename: string) => {
  if (!filename) {
    throw new Error('Please provide a path to the extracted audio file');
  }

  const CELTMode = ref.types.void;
  const CELTModePtr = ref.refType(CELTMode);
  const CELTDecoder = ref.types.void;
  const CELTDecoderPtr = ref.refType(CELTDecoder);

  const VAudioCELT = ffi.Library('vaudio_celt_client', {
    celt_mode_create: [CELTModePtr, ['int', 'int', ref.refType('int')]],
    celt_decoder_create_custom: [CELTDecoderPtr, [CELTModePtr, 'int', ref.refType('int')]],
    celt_decode: [
      'int',
      [CELTDecoderPtr, ref.refType(ref.types.uchar), 'int', ref.refType(ref.types.short), 'int'],
    ],
  });

  const SAMPLE_RATE = 22050;
  const FRAME_SIZE = 512;
  const errorPtr = ref.alloc('int', 0) as unknown as ref.Pointer<number>;

  const modePtr = VAudioCELT.celt_mode_create(SAMPLE_RATE, FRAME_SIZE, errorPtr);

  if (modePtr.isNull()) {
    throw new Error(`celt_mode_create failed (${errorPtr.deref()})`);
  }

  const decoderPtr = VAudioCELT.celt_decoder_create_custom(modePtr, 1, errorPtr);
  if (decoderPtr.isNull()) {
    throw new Error(`celt_decoder_create_custom failed (${errorPtr.deref()})`);
  }

  console.log(`Reading ${filename}...`);

  const buffer = fs.readFileSync(filename);
  const output = Buffer.alloc((buffer.length / 64) * FRAME_SIZE * 2);

  let read = 0;
  let written = 0;

  while (read < buffer.length) {
    const ret = VAudioCELT.celt_decode(
      decoderPtr,
      buffer.subarray(read) as ref.Pointer<number>,
      64,
      output.subarray(written) as ref.Pointer<number>,
      FRAME_SIZE * 2,
    );

    if (ret < 0) {
      console.error(`celt_decode failed (${ret})`);
      continue;
    }

    read += 64;
    written += FRAME_SIZE * 2;

    process.stdout.write(`\rDecoded ${read}/${buffer.length}... `);
  }

  const outfile = filename + '.wav';
  console.log(`\nWriting output to ${outfile}...`);

  const wav = new WaveFile();
  wav.fromScratch(
    1,
    SAMPLE_RATE,
    '16',
    new Int16Array(output.buffer, output.byteOffset, output.length / 2),
  );

  fs.writeFileSync(outfile, wav.toBuffer());

  console.log(`Done!`);
};
