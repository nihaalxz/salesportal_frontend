import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sourceDir = path.resolve(__dirname, '../build');
const targetDir = path.resolve(
	__dirname,
	'../../texas_sales_portal_backend/texas_sales_portal_backend/src/TexasPortal.Api/wwwroot'
);

console.log(`Copying build files from: ${sourceDir}`);
console.log(`To target wwwroot:       ${targetDir}`);

if (!fs.existsSync(sourceDir)) {
	console.error(`Error: Source directory does not exist: ${sourceDir}`);
	process.exit(1);
}

// Ensure target directory exists
fs.mkdirSync(targetDir, { recursive: true });

// Copy function
function copyRecursiveSync(src, dest) {
	const exists = fs.existsSync(src);
	const stats = exists && fs.statSync(src);
	const isDirectory = exists && stats.isDirectory();

	if (isDirectory) {
		if (!fs.existsSync(dest)) {
			fs.mkdirSync(dest, { recursive: true });
		}
		fs.readdirSync(src).forEach((childItemName) => {
			copyRecursiveSync(
				path.join(src, childItemName),
				path.join(dest, childItemName)
			);
		});
	} else {
		fs.copyFileSync(src, dest);
	}
}

try {
	// Clear existing contents in wwwroot (ensure clean build)
	if (fs.existsSync(targetDir)) {
		fs.readdirSync(targetDir).forEach((file) => {
			const curPath = path.join(targetDir, file);
			fs.rmSync(curPath, { recursive: true, force: true });
		});
	}

	copyRecursiveSync(sourceDir, targetDir);
	console.log('Successfully copied build files to wwwroot!');
} catch (err) {
	console.error('Failed to copy build files to wwwroot:', err);
	process.exit(1);
}
