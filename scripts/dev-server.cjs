const { createReadStream, rmSync, statSync } = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { spawn } = require('node:child_process');

const nextBin = path.join(process.cwd(), 'node_modules', 'next', 'dist', 'bin', 'next');
const extraArgs = process.argv.slice(2);
const PUBLIC_SMOKE_TIMEOUT_MS = 30_000;
const PUBLIC_SMOKE_RETRY_MS = 1_000;

function readArgValue(flagNames) {
  for (let i = 0; i < extraArgs.length; i += 1) {
    const arg = extraArgs[i];
    if (flagNames.includes(arg)) {
      return extraArgs[i + 1];
    }
    const match = flagNames.find((flag) => arg.startsWith(`${flag}=`));
    if (match) {
      return arg.slice(match.length + 1);
    }
  }
  return undefined;
}

function runNext(args, env) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [nextBin, ...args], {
      stdio: ['ignore', 'inherit', 'inherit'],
      env,
    });

    child.on('exit', (code, signal) => {
      if (signal) {
        process.kill(process.pid, signal);
        return;
      }
      resolve(code ?? 0);
    });

    child.on('error', reject);
  });
}

function spawnNext(args, env) {
  return spawn(process.execPath, [nextBin, ...args], {
    stdio: ['ignore', 'inherit', 'inherit'],
    env,
  });
}

function getUnexpectedExitCode(code) {
  if (typeof code === 'number' && code !== 0) {
    return code;
  }

  return 1;
}

function createProcessKeepAlive() {
  return setInterval(() => {}, 60_000);
}

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function requestRuntime(host, port, requestPath, method = 'GET') {
  return new Promise((resolve, reject) => {
    const request = http.request(
      {
        hostname: host,
        port,
        path: requestPath,
        method,
      },
      (response) => {
        const chunks = [];
        response.on('data', (chunk) => {
          chunks.push(chunk);
        });
        response.on('end', () => {
          resolve({
            statusCode: response.statusCode ?? 0,
            body: Buffer.concat(chunks).toString('utf8'),
          });
        });
      }
    );

    request.on('error', reject);
    request.end();
  });
}

function extractStaticAssetPath(html) {
  const match = html.match(/\/_next\/static\/[^"' )]+/);
  return match?.[0] || null;
}

async function runPublicSmokeCheck(host, port) {
  const deadline = Date.now() + PUBLIC_SMOKE_TIMEOUT_MS;
  let lastError = new Error('public runtime did not become healthy');

  while (Date.now() < deadline) {
    try {
      const loginResponse = await requestRuntime(host, port, '/login');
      if (loginResponse.statusCode !== 200) {
        throw new Error(`/login returned ${loginResponse.statusCode}`);
      }

      const assetPath = extractStaticAssetPath(loginResponse.body);
      if (!assetPath) {
        throw new Error('/login did not reference any /_next/static asset');
      }

      const assetResponse = await requestRuntime(host, port, assetPath, 'HEAD');
      if (assetResponse.statusCode !== 200) {
        throw new Error(`${assetPath} returned ${assetResponse.statusCode}`);
      }

      return assetPath;
    } catch (error) {
      lastError = error;
      await delay(PUBLIC_SMOKE_RETRY_MS);
    }
  }

  throw lastError;
}

function stopChild(child, signal = 'SIGTERM') {
  return new Promise((resolve) => {
    if (child.exitCode !== null || child.signalCode !== null) {
      resolve();
      return;
    }

    const timeout = setTimeout(resolve, 5_000);
    child.once('exit', () => {
      clearTimeout(timeout);
      resolve();
    });
    child.kill(signal);
  });
}

function setNoStoreHeaders(response) {
  response.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  response.setHeader('Pragma', 'no-cache');
  response.setHeader('CDN-Cache-Control', 'no-store');
}

function getContentType(filePath) {
  if (filePath.endsWith('.js')) return 'application/javascript; charset=utf-8';
  if (filePath.endsWith('.css')) return 'text/css; charset=utf-8';
  if (filePath.endsWith('.woff2')) return 'font/woff2';
  if (filePath.endsWith('.woff')) return 'font/woff';
  if (filePath.endsWith('.json')) return 'application/json; charset=utf-8';
  if (filePath.endsWith('.map')) return 'application/json; charset=utf-8';
  return 'application/octet-stream';
}

function tryServeStaticAsset(request, response, distDir) {
  const requestUrl = request.url || '/';
  const pathname = decodeURIComponent(requestUrl.split('?')[0]);
  const prefix = '/_next/static/';

  if (!pathname.startsWith(prefix)) {
    return false;
  }

  const staticRoot = path.join(process.cwd(), distDir, 'static');
  const relativePath = pathname.slice(prefix.length);
  const filePath = path.join(staticRoot, relativePath);

  if (!filePath.startsWith(staticRoot + path.sep)) {
    response.statusCode = 403;
    setNoStoreHeaders(response);
    response.end('Forbidden');
    return true;
  }

  let stat;
  try {
    stat = statSync(filePath);
  } catch {
    return false;
  }

  if (!stat.isFile()) {
    return false;
  }

  response.statusCode = 200;
  response.setHeader('Content-Type', getContentType(filePath));
  response.setHeader('Content-Length', stat.size);
  setNoStoreHeaders(response);

  if (request.method === 'HEAD') {
    response.end();
    return true;
  }

  createReadStream(filePath).pipe(response);
  return true;
}

function proxyToInternal(request, response, host, port) {
  const proxyRequest = http.request(
    {
      hostname: host,
      port,
      path: request.url,
      method: request.method,
      headers: {
        ...request.headers,
        host: `${host}:${port}`,
      },
    },
    (proxyResponse) => {
      response.writeHead(proxyResponse.statusCode || 502, proxyResponse.headers);
      proxyResponse.pipe(response);
    }
  );

  proxyRequest.on('error', (error) => {
    console.error('[dev-server] proxy request failed:', error);
    if (!response.headersSent) {
      response.statusCode = 502;
      setNoStoreHeaders(response);
    }
    response.end('Bad Gateway');
  });

  request.pipe(proxyRequest);
}

async function main() {
  const port = readArgValue(['--port', '-p']);
  const publicPort = process.env.MC_PUBLIC_PORT || '4731';
  const isCloudflarePort = port === publicPort;
  const distDir = isCloudflarePort ? (process.env.MC_PUBLIC_DIST_DIR || '.next') : '.next';
  const nextEnv = {
    ...process.env,
    MC_RUNTIME_WRAPPER: 'dev-server',
  };

  if (distDir !== '.next') {
    nextEnv.NEXT_DIST_DIR = distDir;
  }

  rmSync(path.join(process.cwd(), distDir), { recursive: true, force: true });

  if (isCloudflarePort) {
    console.log(`[dev-server] port 4731 detected -> using production server with dist dir (${distDir})`);
    const buildCode = await runNext(['build', '--webpack'], nextEnv);
    if (buildCode !== 0) {
      process.exit(buildCode);
    }

    const bindHost = process.env.MC_BIND_HOST || '127.0.0.1';
    const smokeHost = bindHost === '0.0.0.0' ? '127.0.0.1' : bindHost;
    const internalPort = String(Number(publicPort) + 10);
    const internalArgs = ['start', '-H', bindHost, '-p', internalPort];
    const child = spawnNext(internalArgs, nextEnv);
    let processKeepAlive = null;
    let shuttingDown = false;
    let publicSmokeFailed = false;

    const server = http.createServer((request, response) => {
      if (tryServeStaticAsset(request, response, distDir)) {
        return;
      }

      proxyToInternal(request, response, smokeHost, internalPort);
    });

    const shutdown = () => {
      if (shuttingDown) return;
      shuttingDown = true;
      if (processKeepAlive) {
        clearInterval(processKeepAlive);
        processKeepAlive = null;
      }
      server.close(() => {
        child.kill('SIGTERM');
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

    child.on('exit', (code, signal) => {
      if (shuttingDown) {
        process.exit(publicSmokeFailed ? 1 : (code ?? 0));
        return;
      }

      console.error(
        `[dev-server] internal next server exited unexpectedly (code=${code ?? 'null'}, signal=${signal ?? 'null'})`
      );
      if (processKeepAlive) {
        clearInterval(processKeepAlive);
        processKeepAlive = null;
      }
      server.close(() => {
        if (signal) {
          process.kill(process.pid, signal);
          return;
        }
        process.exit(getUnexpectedExitCode(code));
      });
    });

    child.on('error', (error) => {
      console.error('[dev-server] failed to start internal next server:', error);
      process.exit(1);
    });

    await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(Number(publicPort), bindHost, resolve);
    });

    console.log(`[dev-server] proxy ready on http://${bindHost}:${publicPort} -> internal ${internalPort}`);

    try {
      const assetPath = await runPublicSmokeCheck(smokeHost, publicPort);
      processKeepAlive = createProcessKeepAlive();
      console.log(`[dev-server] public smoke check passed: /login and ${assetPath}`);
    } catch (error) {
      publicSmokeFailed = true;
      shuttingDown = true;
      if (processKeepAlive) {
        clearInterval(processKeepAlive);
        processKeepAlive = null;
      }
      console.error(
        `[dev-server] public smoke check failed. Refusing to keep port ${publicPort} alive because the public runtime is inconsistent: ${error.message}`
      );
      server.close();
      await stopChild(child);
      process.exit(1);
    }

    // Keep strong references to the public proxy + internal Next.js child so the
    // wrapper remains the long-lived systemd main process after the smoke check.
    await new Promise((resolve, reject) => {
      server.once('close', resolve);
      child.once('exit', resolve);
      child.once('error', reject);
    });

    return;
  }

  console.log('[dev-server] using webpack dev server');
  process.exit(await runNext(['dev', '--webpack', '-H', process.env.MC_BIND_HOST || '127.0.0.1', ...extraArgs], nextEnv));
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = {
  createProcessKeepAlive,
  getUnexpectedExitCode,
};
