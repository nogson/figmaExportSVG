import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import * as dotenv from "dotenv";
import svg2vectordrawable from "svg2vectordrawable";
dotenv.config();

const FIGMA_FILE_KEY = process.env.FIGMA_FILE_KEY;
const TOKEN = process.env.FIGMA_TOKEN;
const PLATFORM = process.env.PLATFORM;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// TODO 書き出し先は確認が必要
const androidImageDir = `${__dirname}/PBaseNavi/app/src/main/res/drawable`;
const iOSImageDir = `${__dirname}/PBaseNavi/Assets.xcassets`;

const downloadXML = async (url, name) => {
  const res = await fetch(url);
  const data = await res.text();
  const xml = await svg2vectordrawable(data);
  fs.writeFileSync(`${androidImageDir}/${name}.xml`, xml);
};

const downloadSVG = async (url, name) => {
  const res = await fetch(url);
  const data = await res.text();
  const dirname = `${iOSImageDir}/${name}.imageset`;

  await fs.promises.mkdir(dirname, {
    recursive: true,
  });
  fs.writeFileSync(`${dirname}/${name}.svg`, data);
  fs.writeFileSync(`${dirname}/Content.json`, getContentJson(name));
};

const getContentJson = (name) => {
  return JSON.stringify({
    images: [
      {
        filename: `${name}.svg`,
        idiom: "universal",
      },
    ],
    info: {
      author: "xcode",
      version: 1,
    },
    properties: {
      "preserves-vector-representation": true,
    },
  });
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
  // ディレクトリを削除して初期化
  await fs.promises.rm(iOSImageDir, { recursive: true, force: true });
  await fs.promises.rm(androidImageDir, { recursive: true, force: true });

  // ディレクトリを作成
  if (PLATFORM === "android") {
    await fs.promises.mkdir(androidImageDir, { recursive: true });
  } else {
    await fs.promises.mkdir(iOSImageDir, { recursive: true });
  }

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
    if (PLATFORM === "android") {
      await downloadXML(url, name);
    } else {
      await downloadSVG(url, name);
    }
  });
}

main();
