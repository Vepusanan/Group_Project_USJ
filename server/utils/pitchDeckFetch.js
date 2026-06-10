const ALLOWED_DECK_HOSTS = (process.env.ALLOWED_STORAGE_HOSTS || "")
  .split(",")
  .map((host) => host.trim().toLowerCase())
  .filter(Boolean);

export const MAX_PITCH_DECK_BYTES = Number(
  process.env.MAX_PITCH_DECK_BYTES || 25 * 1024 * 1024,
);
const UPSTREAM_TIMEOUT_MS = Number(
  process.env.PITCH_DECK_FETCH_TIMEOUT_MS || 15_000,
);

const PDF_MAGIC = Buffer.from("%PDF");

export const createHttpError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

export const assertAllowedDeckUrl = (url) => {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    throw createHttpError(400, "Invalid pitch deck URL");
  }

  if (!["https:", "http:"].includes(parsed.protocol)) {
    throw createHttpError(400, "Pitch deck URL must be HTTP(S)");
  }

  const host = parsed.hostname.toLowerCase();
  const allowed =
    ALLOWED_DECK_HOSTS.length === 0
      ? host.endsWith(".supabase.co")
      : ALLOWED_DECK_HOSTS.some(
          (allowedHost) =>
            host === allowedHost || host.endsWith(`.${allowedHost}`),
        );

  if (!allowed) {
    throw createHttpError(403, "Pitch deck must be hosted on approved storage");
  }

  return parsed.toString();
};

const assertPdfBuffer = (buffer) => {
  if (!buffer?.length || buffer.length < 4) {
    throw createHttpError(415, "Pitch deck must be a valid PDF");
  }
  if (!buffer.slice(0, 4).equals(PDF_MAGIC)) {
    throw createHttpError(415, "Pitch deck must be a valid PDF");
  }
};

export const fetchDeckUpstream = async (deckUrl) => {
  const safeUrl = assertAllowedDeckUrl(deckUrl);

  const upstream = await fetch(safeUrl, {
    signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    redirect: "follow",
  });

  if (!upstream.ok) {
    throw createHttpError(502, "Unable to load pitch deck file");
  }

  const contentLength = Number(upstream.headers.get("content-length") || 0);
  if (contentLength > MAX_PITCH_DECK_BYTES) {
    throw createHttpError(413, "Pitch deck exceeds maximum allowed size");
  }

  return upstream;
};

export const fetchDeckBuffer = async (deckUrl) => {
  const upstream = await fetchDeckUpstream(deckUrl);
  const buffer = Buffer.from(await upstream.arrayBuffer());

  if (buffer.length > MAX_PITCH_DECK_BYTES) {
    throw createHttpError(413, "Pitch deck exceeds maximum allowed size");
  }

  assertPdfBuffer(buffer);

  return {
    buffer,
    contentType: upstream.headers.get("content-type") || "application/pdf",
  };
};

export const streamDeckToResponse = async (upstream, res) => {
  const reader = upstream.body?.getReader();
  if (!reader) {
    throw createHttpError(502, "Unable to stream pitch deck");
  }

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", 'inline; filename="pitch-deck.pdf"');
  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, private",
  );
  res.setHeader("Pragma", "no-cache");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.removeHeader("Content-Security-Policy");

  let bytesRead = 0;
  let headerChecked = false;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = Buffer.from(value);
    bytesRead += chunk.length;

    if (bytesRead > MAX_PITCH_DECK_BYTES) {
      if (!res.headersSent) {
        res.status(413).json({
          success: false,
          error: "Pitch deck exceeds maximum allowed size",
        });
      } else {
        res.destroy();
      }
      return;
    }

    if (!headerChecked) {
      assertPdfBuffer(chunk);
      headerChecked = true;
    }

    res.write(chunk);
  }

  if (!headerChecked) {
    throw createHttpError(415, "Pitch deck must be a valid PDF");
  }

  res.end();
};
