#!/usr/bin/env node
import sharp from "sharp";
import { renameSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const imagesDir = join(__dirname, "../public/images");

async function optimize() {
  const desktop = join(imagesDir, "Edinburgh_Magic.webp");
  const mobile = join(imagesDir, "Edinburgh_Magic_mobile.webp");

  const desktopMeta = await sharp(desktop).metadata();
  const mobileMeta = await sharp(mobile).metadata();

  const desktopMax = 2400;
  const mobileMax = 1200;

  const desktopResize = desktopMeta.width > desktopMax ? { width: desktopMax } : undefined;
  const mobileResize = mobileMeta.width > mobileMax ? { width: mobileMax } : undefined;

  await sharp(desktop)
    .resize(desktopResize)
    .webp({ quality: 82 })
    .toFile(desktop + ".tmp");
  await sharp(mobile)
    .resize(mobileResize)
    .webp({ quality: 82 })
    .toFile(mobile + ".tmp");

  renameSync(desktop + ".tmp", desktop);
  renameSync(mobile + ".tmp", mobile);

  console.log("Optimized Edinburgh_Magic.webp and Edinburgh_Magic_mobile.webp");
}

optimize().catch(console.error);
