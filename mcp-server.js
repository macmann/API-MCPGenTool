import express from 'express';
import { createMcpRouter } from './mcp-express.js';

export function mountMcp(app, options = {}) {
  if (!app || typeof app.use !== 'function') {
    throw new Error('A valid Express app instance is required to mount MCP');
  }

  const serverId = options.serverId || process.env.MCP_SERVER_ID || 'default-mcp';
  const mockBaseUrl = options.mockBaseUrl || process.env.MOCK_BASE_URL;
  const basePath = options.basePath || '/mcp';

  const router = createMcpRouter({ serverId, mockBaseUrl });
  app.use(basePath, router);

  console.log(
    `[MCP] Mounted at ${basePath} (serverId=${serverId}, mockBaseUrl=${mockBaseUrl || 'auto'})`
  );
  return router;
}

export async function startStandaloneMcpServer(options = {}) {
  const app = express();
  app.use(express.json());

  const basePath = options.basePath || '/mcp';
  const preferredPort = Number(options.port ?? process.env.PORT ?? process.env.MCP_PORT);
  const basePort = Number.isInteger(preferredPort) && preferredPort > 0 ? preferredPort : 3030;
  const preferredRetries = Number(
    options.maxPortRetries ?? process.env.MCP_PORT_RETRIES ?? 5
  );
  const maxRetries = Number.isInteger(preferredRetries) && preferredRetries >= 0 ? preferredRetries : 5;

  mountMcp(app, {
    serverId: options.serverId,
    mockBaseUrl: options.mockBaseUrl,
    basePath
  });

  let attemptPort = basePort;

  return new Promise((resolve, reject) => {
    const tryListen = (remainingRetries) => {
      const server = app
        .listen(attemptPort, () => {
          console.log(`[MCP] Standalone listening on ${attemptPort}${basePath}`);
          resolve(server);
        })
        .on('error', (err) => {
          if (err.code === 'EADDRINUSE' && remainingRetries > 0) {
            console.warn(
              `[MCP] Port ${attemptPort} in use, retrying with ${attemptPort + 1}`
            );
            attemptPort += 1;
            setImmediate(() => tryListen(remainingRetries - 1));
            return;
          }

          console.error('[MCP] Failed to start standalone server', err);
          reject(err);
        });
    };

    tryListen(maxRetries);
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  startStandaloneMcpServer().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
