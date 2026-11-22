// Rebuild with the four original images as positional arguments, in display order.
// Requires the existing sharp dependency and a local ffmpeg executable.
import sharp from "sharp";
import { execFileSync } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const names = ["edinburgh", "saints", "chevrolet", "dinosaur"];
const labels = ["Edinburgh collage", "Saints and hand-drawn creatures", "Red Chevrolet collage", "Yellow dinosaur artwork"];
const inputs = process.argv.slice(2);
if (inputs.length !== 4) throw new Error("Pass exactly four source image paths.");
const output = new URL("../public/images/dink/transformation/", import.meta.url);
await mkdir(output, { recursive: true });
const temporary = await mkdtemp(join(tmpdir(), "ink-transformations-"));
const size = 480;
const records = [];

try {
  for (const [index, input] of inputs.entries()) {
    const name = names[index];
    const { data, info } = await sharp(input).rotate().toColourspace("srgb").removeAlpha().raw().toBuffer({ resolveWithObject: true });
    const { width, height } = info;
    // Average original source pixels, never the preview, margins or a cropped image.
    const sums = [0, 0, 0];
    for (let p = 0; p < data.length; p += 3) {
      for (let c = 0; c < 3; c++) sums[c] += data[p + c];
    }
    const rgb = sums.map(sum => Math.round(sum / (width * height)));
    const colour = `#${rgb.map(channel => channel.toString(16).padStart(2, "0")).join("")}`;
    const frames = [];
    const saveFrame = async (buffer, duration) => {
      const path = join(temporary, `${name}-${frames.length}.png`);
      await writeFile(path, buffer);
      frames.push({ path, duration });
    };
    const source = await sharp(data, { raw: { width, height, channels: 3 } })
      .resize(size, size, { fit: "contain", background: "#000000" }).png().toBuffer();
    await sharp(source).webp({ quality: 90 }).toFile(new URL(`${name}.webp`, output).pathname);
    await saveFrame(source, 1.2);
    const blend = async (from, to, amount) => {
      const a = await sharp(from).removeAlpha().raw().toBuffer();
      const b = await sharp(to).removeAlpha().raw().toBuffer();
      const mixed = Buffer.alloc(a.length);
      for (let i = 0; i < mixed.length; i++) mixed[i] = Math.round(a[i] * (1 - amount) + b[i] * amount);
      return sharp(mixed, { raw: { width: size, height: size, channels: 3 } }).png().toBuffer();
    };
    let previous = source;

    const levels = [128, 96, 72, 56, 44, 36, 28, 22, 18, 14, 11, 9, 7, 6, 5, 4, 3, 2, 1];
    for (const [step, columns] of levels.entries()) {
      const rows = columns === 1 ? 1 : Math.max(1, Math.round(columns * height / width));
      const blocks = Buffer.alloc(columns * rows * 3);
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < columns; x++) {
          const x0 = Math.floor(x * width / columns), x1 = Math.floor((x + 1) * width / columns);
          const y0 = Math.floor(y * height / rows), y1 = Math.floor((y + 1) * height / rows);
          const total = [0, 0, 0];
          for (let sy = y0; sy < y1; sy++) {
            for (let sx = x0; sx < x1; sx++) {
              const offset = (sy * width + sx) * 3;
              for (let c = 0; c < 3; c++) total[c] += data[offset + c];
            }
          }
          for (let c = 0; c < 3; c++) blocks[(y * columns + x) * 3 + c] = Math.round(total[c] / ((x1 - x0) * (y1 - y0)));
        }
      }
      // The whole work gradually becomes a square; no part of it is cropped away.
      const progress = step / (levels.length - 1);
      const endSize = 300;
      const startWidth = Math.round(size * Math.min(1, width / height));
      const startHeight = Math.round(size * Math.min(1, height / width));
      const frameWidth = Math.round(startWidth + (endSize - startWidth) * progress);
      const frameHeight = Math.round(startHeight + (endSize - startHeight) * progress);
      const frame = await sharp(blocks, { raw: { width: columns, height: rows, channels: 3 } })
        .resize(frameWidth, frameHeight, { kernel: "nearest", fit: "fill" })
        .extend({ left: Math.floor((size - frameWidth) / 2), right: Math.ceil((size - frameWidth) / 2), top: Math.floor((size - frameHeight) / 2), bottom: Math.ceil((size - frameHeight) / 2), background: "#000000" })
        .png().toBuffer();
      // Ease the largest block changes without changing their calculated colours.
      if (columns <= 7) {
        await saveFrame(await blend(previous, frame, 1 / 3), 0.06);
        await saveFrame(await blend(previous, frame, 2 / 3), 0.06);
      }
      await saveFrame(frame, columns === 1 ? 3 : columns <= 7 ? 0.06 : 0.18);
      previous = frame;
    }
    // Let the source return through a soft haze; the loop ends on its exact first frame.
    for (let step = 1; step <= 16; step++) {
      const t = step / 16;
      const eased = t * t * (3 - 2 * t);
      const haze = step === 16 ? source : await sharp(source).blur(Math.max(0.3, (1 - eased) * 12)).png().toBuffer();
      await saveFrame(await blend(previous, haze, eased), 0.08);
    }
    const list = join(temporary, `${name}.txt`);
    await writeFile(list, frames.map(frame => `file '${frame.path}'\nduration ${frame.duration}`).join("\n") + `\nfile '${frames.at(-1).path}'\n`);
    // ffmpeg joins the frames into a temporary GIF; sharp turns it into a lossless animated WebP (flat pixels stay flat).
    const gif = join(temporary, `${name}.gif`);
    execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", list, "-filter_complex", "[0:v]split[a][b];[a]palettegen=stats_mode=single[p];[b][p]paletteuse=new=1:dither=none", "-fps_mode", "vfr", "-loop", "0", gif]);
    await sharp(gif, { animated: true }).webp({ lossless: true, effort: 6, loop: 0 }).toFile(new URL(`${name}-play.webp`, output).pathname);
    records.push({ name, label: labels[index], colour });
    console.log(`${name}: ${colour}`);
  }
  await writeFile(new URL("../src/data/inkTransformations.json", import.meta.url), JSON.stringify(records, null, 2) + "\n");
} finally {
  await rm(temporary, { recursive: true, force: true });
}
