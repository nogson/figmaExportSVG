import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import * as dotenv from "dotenv";
dotenv.config();

const FIGMA_FILE_KEY = process.env.FIGMA_FILE_KEY;
const TOKEN = process.env.FIGMA_TOKEN;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const download = async (url, path) => {
  const res = await fetch(url);
  const data = await res.text();
  fs.writeFileSync(path, data);
};

async function main() {
  // ディレクトリを削除して初期化
  await fs.promises.rm(`${__dirname}/.style-dictionary/tokens`, {
    recursive: true,
    force: true,
  });
  // ディレクトリを作成
  await fs.promises.mkdir(`${__dirname}/.style-dictionary/tokens`, {
    recursive: true,
  });
  // jsonを取得
  try {
    // debug用に一応表示
    const data = fs.readFileSync(
      "style-dictionary/tokens/variables.json",
      "utf8"
    );
    const payload = JSON.parse(data);
    console.log(payload);
  } catch (err) {
    console.error(err);
  }
}

main();
