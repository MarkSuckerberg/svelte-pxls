import { copyFile, readFile, writeFile } from 'fs/promises';
import { ArrayGrid } from './arrayGrid';

const VERSION = 1;
const HEADER_SIZE = 6;

export async function fromFile(file: string) {
	return readFile(file)
		.then(async (fileData) => {
			try {
				if (!fileData.length) {
					console.error('Map file empty.');
					return null;
				}

				const headerSize = fileData.readUint8(0);
				const dataSize = fileData.length - headerSize;
				const version = fileData.readUint8(1);
				const width = fileData.readUint16BE(2);
				const height = fileData.readUint16BE(4);

				if (version != VERSION) {
					throw new Error('Invalid version!');
				}

				if (dataSize !== height * width) {
					throw new Error('Map data invalid size!');
				}

				return new ArrayGrid(
					{ width, height },
					new Uint8Array(fileData.buffer, headerSize, width * height)
				);
			} catch (error) {
				await copyFile(file, `${file}.bak`);
				console.error('Error reading map save. File backed up.', error);
			}
		})
		.catch(() => {
			// File couldn't be read to begin with
			return null;
		});
}

export async function toFile(grid: ArrayGrid, file: string) {
	const header = Buffer.allocUnsafe(HEADER_SIZE);
	header.writeUInt8(HEADER_SIZE, 0); // 1
	header.writeUInt8(VERSION, 1); // 2
	header.writeUInt16BE(grid.height, 2); // 3-4
	header.writeUInt16BE(grid.width, 4); // 5-6

	const data = new Uint8Array(grid.width * grid.height + HEADER_SIZE);

	data.set(header);
	data.set(grid.array, HEADER_SIZE);

	await writeFile(file, data);
}
