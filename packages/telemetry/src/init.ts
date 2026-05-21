import { integrations } from "@gmacko/config";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-http";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { HostMetrics } from "@opentelemetry/host-metrics";
import { FetchInstrumentation } from "@opentelemetry/instrumentation-fetch";
import { HttpInstrumentation } from "@opentelemetry/instrumentation-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";
import { NodeSDK } from "@opentelemetry/sdk-node";
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
  SEMRESATTRS_DEPLOYMENT_ENVIRONMENT,
} from "@opentelemetry/semantic-conventions";

let initialized = false;

export function initTelemetry(): void {
  if (initialized) return;
  if (!integrations.telemetry) return;
  if (process.env.OTEL_ENABLED === "false") return;

  const endpoint =
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT ||
    (process.env.FG_APP ? "https://otlp.forgegraf.com" : "");
  if (!endpoint) return;

  initialized = true;

  try {
    const serviceName =
      process.env.FG_APP ||
      process.env.OTEL_SERVICE_NAME ||
      process.env.SERVICE_NAME ||
      "gmacko-app";

    const resource = resourceFromAttributes({
      [ATTR_SERVICE_NAME]: serviceName,
      [SEMRESATTRS_DEPLOYMENT_ENVIRONMENT]:
        process.env.FG_STAGE || process.env.NODE_ENV || "development",
      [ATTR_SERVICE_VERSION]:
        process.env.FG_COMMIT_HASH ||
        process.env.npm_package_version ||
        "0.0.0",
      ...(process.env.FG_NODE && { "host.name": process.env.FG_NODE }),
    });

    const traceExporter = new OTLPTraceExporter({
      url: `${endpoint}/v1/traces`,
    });
    const metricExporter = new OTLPMetricExporter({
      url: `${endpoint}/v1/metrics`,
    });

    const sdk = new NodeSDK({
      resource,
      traceExporter,
      metricReader: new PeriodicExportingMetricReader({
        exporter: metricExporter,
        exportIntervalMillis: 60_000,
      }),
      instrumentations: [new HttpInstrumentation(), new FetchInstrumentation()],
    });

    sdk.start();

    const hostMetrics = new HostMetrics();
    hostMetrics.start();

    const shutdown = () => {
      sdk.shutdown().catch(() => {});
    };

    process.once("SIGTERM", shutdown);
    process.once("SIGINT", shutdown);
  } catch (error) {
    console.error("[telemetry] Failed to initialize OTel SDK:", error);
  }
}
