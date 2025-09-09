import 'dotenv/config';
import express from 'express';
import { handler } from '../build/handler.js';
import { PixelSocketServer } from './server.socket.js';

const PORT = process.env['PORT'] ?? 3000;
const app = express();
const server = app.listen(PORT, () => {
	console.log(`server is listening at http://127.0.0.1:${PORT}`);
});
app.use(handler);

PixelSocketServer.fromFile('board2.dat', server).then((io) => {
	globalThis.io = io;
});
