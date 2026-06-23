const SLOW_MS = Number(process.env.SLOW_REQUEST_MS || 500);

export const requestTiming = (req, res, next) => {
  const start = process.hrtime.bigint();

  res.on("finish", () => {
    const elapsedMs = Number(process.hrtime.bigint() - start) / 1e6;

    if (elapsedMs >= SLOW_MS) {
      console.warn(
        `[slow] ${req.method} ${req.originalUrl} ${res.statusCode} ${elapsedMs.toFixed(0)}ms`,
      );
    }
  });

  next();
};
