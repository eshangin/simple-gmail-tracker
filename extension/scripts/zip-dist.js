// Creates a distributable zip of the dist/ folder, named dist-{version}.zip
// where {version} is taken from dist/manifest.json.
// Run automatically after `npm run build`.

const AdmZip = require("adm-zip");
const fs = require("fs");
const path = require("path");

const distDir = path.resolve(__dirname, "../dist");
const manifestPath = path.join(distDir, "manifest.json");

if (!fs.existsSync(manifestPath)) {
    console.error("Error: dist/manifest.json not found. Run `npm run build` first.");
    process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
const version = manifest.version;
const outputPath = path.resolve(__dirname, `../dist/dist-${version}.zip`);

const zip = new AdmZip();
zip.addLocalFolder(distDir);
zip.writeZip(outputPath);

console.log(`Created: ${path.basename(outputPath)}`);
