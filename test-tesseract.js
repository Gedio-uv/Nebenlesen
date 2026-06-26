const Tesseract = require('tesseract.js');

async function run() {
  try {
    const worker = await Tesseract.createWorker('eng', 1, {
      logger: m => {}
    });
    const result = await worker.recognize(
      'https://tesseract.projectnaptha.com/img/eng_bw.png',
      {},
      { blocks: true }
    );
    console.log("blocks is null?", result.data.blocks === null);
    console.log("text length:", result.data.text.length);
    if (result.data.blocks && result.data.blocks[0]) {
      console.log("first block:", Object.keys(result.data.blocks[0]));
    }
    await worker.terminate();
  } catch (e) {
    console.error(e);
  }
}
run();
