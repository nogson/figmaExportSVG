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

const getComponents = async () => {
  try {
    const res = await fetch(
      `https://api.figma.com/v1/files/${FIGMA_FILE_KEY}/components`,
      {
        headers: {
          "X-FIGMA-TOKEN": TOKEN,
        },
        responseType: "json",
      }
    );
    const body = await res.json();
    return body.meta.components;
  } catch (error) {
    throw error;
  }
};

const getSvgImages = async (ids) => {
  const res = await fetch(
    `https://api.figma.com/v1/images/${FIGMA_FILE_KEY}?ids=${ids}&format=svg`,
    {
      headers: {
        "X-FIGMA-TOKEN": TOKEN,
      },
      responseType: "json",
    }
  );
  const images = await res.json();
  return images;
};

async function main() {
  // 同期読み込みの場合
  try {
    const data = fs.readFileSync("variables.json", "utf8");
    const payload = JSON.parse(data);
    console.log(payload);
  } catch (err) {
    console.error(err);
  }

  // ディレクトリを削除して初期化
  await fs.promises.rm(`${__dirname}/assets`, { recursive: true, force: true });
  // ディレクトリを作成
  await fs.promises.mkdir(`${__dirname}/assets`, { recursive: true });
  // コンポーネントを取得
  const components = await getComponents();
  // 画像を取得
  const ids = components.map((r) => r.node_id).join(",");
  const { images } = await getSvgImages(ids);

  // 画像をダウンロード
  const nodeIds = Object.keys(images);
  nodeIds.forEach(async (nodeId) => {
    const url = images[nodeId];
    const component = components.find((r) => r.node_id === nodeId);
    const name = component.name;
    const filePath = `${__dirname}/assets/${name}.svg`;
    await download(url, filePath);
  });
}

main();
