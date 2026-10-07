/**
 * 404 Not Found Handler for undefined routes.
 * Catches all unmatched requests and returns standard JSON 404.
 */
function notFoundHandler(req, res, next) {
  res.status(404).json({
    success: false,
    error: 'Resource not found',
    path: req.originalUrl,
  });
}

/**
 * Centralized Global Error Handler Middleware (4 arguments).
 * Distinguishes client vs server errors and provides stack traces only in dev mode.
 */
function globalErrorHandler(err, req, res, next) {
  const statusCode = err.status || err.statusCode || 500;
  const isDev = process.env.NODE_ENV === 'development';

  if (statusCode >= 500) {
    console.error(`[SERVER ERROR] ${req.method} ${req.originalUrl}:`, err);
  }

  const response = {
    success: false,
    error: err.message || 'Internal Server Error',
  };

  if (isDev && err.stack) {
    response.stack = err.stack;
  }

  return res.status(statusCode).json(response);
}

module.exports = {
  notFoundHandler,
  globalErrorHandler,
};
