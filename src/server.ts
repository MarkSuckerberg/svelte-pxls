import express from 'express';
import { handler } from '../build/handler.js';
import { config } from './config.server.js';
import { PixelSocketServer } from './socket.server.js';

const PORT = config.port ?? 3000;
const app = express();
const server = app.listen(PORT, () => {
	console.log(`server is listening at http://127.0.0.1:${PORT}`);
});
app.use(handler);

PixelSocketServer.fromFile(config.boardFile, server, config.size).then((io) => {
	globalThis.io = io;
});
