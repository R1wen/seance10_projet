import { Request, Response, NextFunction } from 'express';

interface RouteMetric {
  count: number;
  totalDurationMs: number;
  errors4xx: number;
  errors5xx: number;
}

interface MetricsStore {
  startedAt: Date;
  requests: Record<string, RouteMetric>;
  totalRequests: number;
  totalErrors4xx: number;
  totalErrors5xx: number;
}

const store: MetricsStore = {
  startedAt: new Date(),
  requests: {},
  totalRequests: 0,
  totalErrors4xx: 0,
  totalErrors5xx: 0,
};

function routeKey(req: Request): string {
  const route = req.route?.path ?? req.path;
  return `${req.method} ${route}`;
}

export function metricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const startedAt = Date.now();

  res.on('finish', () => {
    const key = routeKey(req);
    const durationMs = Date.now() - startedAt;

    if (!store.requests[key]) {
      store.requests[key] = { count: 0, totalDurationMs: 0, errors4xx: 0, errors5xx: 0 };
    }

    const metric = store.requests[key];
    metric.count++;
    metric.totalDurationMs += durationMs;
    store.totalRequests++;

    if (res.statusCode >= 400 && res.statusCode < 500) {
      metric.errors4xx++;
      store.totalErrors4xx++;
    } else if (res.statusCode >= 500) {
      metric.errors5xx++;
      store.totalErrors5xx++;
    }
  });

  next();
}

export function getMetrics() {
  const uptimeSeconds = Math.floor((Date.now() - store.startedAt.getTime()) / 1000);

  const routes = Object.entries(store.requests).map(([route, m]) => ({
    route,
    requests: m.count,
    avgDurationMs: m.count > 0 ? Math.round(m.totalDurationMs / m.count) : 0,
    errors4xx: m.errors4xx,
    errors5xx: m.errors5xx,
  }));

  return {
    uptimeSeconds,
    totalRequests: store.totalRequests,
    totalErrors4xx: store.totalErrors4xx,
    totalErrors5xx: store.totalErrors5xx,
    errorRate5xx:
      store.totalRequests > 0
        ? parseFloat(((store.totalErrors5xx / store.totalRequests) * 100).toFixed(2))
        : 0,
    routes,
    memory: {
      rssMB: Math.round(process.memoryUsage().rss / 1024 / 1024),
      heapUsedMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      heapTotalMB: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
    },
  };
}
