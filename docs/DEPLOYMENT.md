# Deployment Strategy Guide

This document compares deployment options, provides cost analysis, and details
blue-green/canary deployment patterns for products built from create-gmacko-app.

> **Quick decision**: Start on Vercel. Move to Kubernetes on Hetzner when monthly
> Vercel spend exceeds ~$150/mo or when you need blue-green deploys, WebSocket
> servers, or background workers that don't fit serverless.

---

## Platform Comparison

### Vercel

**Best for**: Early-stage products, teams of 1-5, apps under $150/mo compute.

| Aspect | Details |
|--------|---------|
| **Deploy model** | Serverless functions + Edge + CDN |
| **Zero-downtime deploys** | Automatic — atomic URL swap per deploy |
| **Rollback** | Instant — promote any previous deployment |
| **Preview environments** | Built-in per-PR with unique URLs |
| **Scaling** | Automatic, per-request |
| **WebSocket support** | Not supported (use Pusher/Ably via `@gmacko/realtime`) |
| **Background jobs** | Cron via Vercel Cron (limited to 60s per invocation) |
| **SSL/TLS** | Automatic via Let's Encrypt |
| **Observability** | Vercel Analytics, Speed Insights, Log Drains |
| **Vendor lock-in** | Medium — uses `output: "standalone"` escape hatch |

**Limitations**:
- No long-running processes (serverless 60s/300s timeout)
- No WebSocket connections
- No custom binary execution
- Cold starts on infrequently-accessed routes
- Bandwidth costs at scale ($40/100GB after free tier)

### Kubernetes (Self-hosted on Hetzner)

**Best for**: Products past PMF, teams that need full control, apps with WebSockets,
background workers, or heavy compute.

| Aspect | Details |
|--------|---------|
| **Deploy model** | Container-based with rolling/blue-green/canary |
| **Zero-downtime deploys** | Rolling update (default), blue-green, canary |
| **Rollback** | `kubectl rollout undo` — instant |
| **Preview environments** | PR-scoped namespaces (already configured in `deploy/k8s/preview/`) |
| **Scaling** | HPA (horizontal pod autoscaler) or manual |
| **WebSocket support** | Full — run `@gmacko/ws` as a sidecar or separate deployment |
| **Background jobs** | Full — CronJobs, worker deployments, queue consumers |
| **SSL/TLS** | cert-manager + Let's Encrypt (already configured) |
| **Observability** | Prometheus + Grafana (scrape `/api/metrics`) |
| **Vendor lock-in** | None — standard K8s manifests, portable anywhere |

**Complexity costs**:
- Cluster management (mitigated by managed K8s: Hetzner Cloud, k3s)
- Networking (Ingress, DNS, TLS cert rotation)
- Monitoring setup (Prometheus, Grafana, alerting)
- Security patching (base images, node OS)

### SST (AWS)

**Best for**: Teams already on AWS, need serverless + full AWS service access.

| Aspect | Details |
|--------|---------|
| **Deploy model** | AWS Lambda + CloudFront |
| **Zero-downtime deploys** | Automatic via CloudFront swap |
| **Cost model** | Pay-per-request (Lambda) + data transfer |
| **Best use case** | Hybrid — Next.js on Lambda, workers on ECS |

---

## Cost Analysis

### Scenario: Early Product (< 50K monthly visitors)

| Platform | Monthly Cost | Notes |
|----------|-------------|-------|
| **Vercel Pro** | $20/seat | Includes 1TB bandwidth, 100GB-hrs compute |
| **Hetzner CX22** | €4.49/mo (~$5) | 2 vCPU, 4GB RAM, 40GB SSD — runs k3s |
| **Hetzner CX32** | €7.49/mo (~$8) | 4 vCPU, 8GB RAM — comfortable for app + DB + Redis |
| **Neon Free** | $0 | 0.5GB storage, 10 compute-hours |
| **Total (Vercel)** | ~$20/mo | |
| **Total (Hetzner)** | ~$13/mo | CX32 + Neon Free |

**Verdict**: Vercel is simpler. Hetzner is cheaper but requires K8s knowledge.

### Scenario: Growing Product (50K-500K monthly visitors)

| Platform | Monthly Cost | Notes |
|----------|-------------|-------|
| **Vercel Pro** | $60-200/mo | 2-3 seats + bandwidth overages |
| **Hetzner CX32 × 2** | ~$16/mo | App server + DB/Redis server |
| **Hetzner CX42** | €14.49/mo (~$16) | 8 vCPU, 16GB RAM — single box |
| **Neon Launch** | $19/mo | 10GB storage, 300 compute-hours |
| **Total (Vercel)** | ~$80-220/mo | |
| **Total (Hetzner)** | ~$35/mo | CX42 + Neon Launch |

**Verdict**: Hetzner starts making sense. Save $50-180/mo.

### Scenario: Scaled Product (500K+ monthly visitors, B2B)

| Platform | Monthly Cost | Notes |
|----------|-------------|-------|
| **Vercel Enterprise** | $500+/mo | Custom pricing, SSO, audit logs |
| **Hetzner CAX31 × 3** | ~$36/mo | ARM, 8 vCPU, 16GB — 3 node cluster |
| **Hetzner Dedicated** | ~$45/mo | AX42, 8-core Ryzen, 64GB RAM |
| **Neon Scale** | $69/mo | 50GB storage, 750 compute-hours |
| **Total (Vercel)** | $500+/mo | |
| **Total (Hetzner)** | ~$80-115/mo | 3-node cluster + Neon Scale |

**Verdict**: Hetzner is 4-6x cheaper. Blue-green deploys become valuable here.

### Break-even Point

Switch from Vercel to self-hosted when:
1. Monthly Vercel bill exceeds ~$150/mo consistently
2. You need WebSocket connections or long-running workers
3. You need blue-green deploys for zero-risk releases
4. Bandwidth costs dominate (video, large file uploads)
5. You want to run Postgres locally instead of Neon ($0 vs $19-69/mo)

---

## Blue-Green Deployment (Kubernetes)

Blue-green deploys maintain two identical environments. The "green" (new) receives
a small amount of traffic first. If healthy, all traffic switches. If not, instant
rollback to "blue" (current).

### Architecture

```
                    ┌─────────────────┐
                    │   Ingress /      │
                    │   Load Balancer  │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  Service (swap  │
                    │  selector)      │
                    └───┬─────────┬───┘
                        │         │
              ┌─────────▼──┐  ┌──▼─────────┐
              │  Blue       │  │  Green      │
              │  (current)  │  │  (new)      │
              │  v1.2.3     │  │  v1.2.4     │
              │  2 replicas │  │  2 replicas │
              └─────────────┘  └─────────────┘
```

### Implementation

Add to `deploy/k8s/`:

```yaml
# blue-green-deploy.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: gmacko-web-${COLOR}    # blue or green
  labels:
    app: gmacko-web
    slot: ${COLOR}
    version: ${VERSION}
spec:
  replicas: ${REPLICAS:-2}
  selector:
    matchLabels:
      app: gmacko-web
      slot: ${COLOR}
  template:
    metadata:
      labels:
        app: gmacko-web
        slot: ${COLOR}
        version: ${VERSION}
    spec:
      containers:
        - name: web
          image: ${IMAGE_TAG}
          ports:
            - containerPort: 3000
          envFrom:
            - secretRef:
                name: gmacko-env
          livenessProbe:
            httpGet:
              path: /api/health/live
              port: 3000
            initialDelaySeconds: 10
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /api/health/ready
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 5
          startupProbe:
            httpGet:
              path: /api/health
              port: 3000
            failureThreshold: 30
            periodSeconds: 2
          resources:
            requests:
              memory: "256Mi"
              cpu: "100m"
            limits:
              memory: "512Mi"
              cpu: "500m"
```

### Deploy Script

```bash
#!/usr/bin/env bash
# scripts/blue-green-deploy.sh
set -euo pipefail

NAMESPACE="${NAMESPACE:-default}"
SERVICE="gmacko-web"
NEW_VERSION="${1:?Usage: blue-green-deploy.sh <version>}"
IMAGE_TAG="${DOCKER_REGISTRY:-ghcr.io/gmackie}/gmacko-web:${NEW_VERSION}"

# Determine current active color
CURRENT_COLOR=$(kubectl get service "$SERVICE" -n "$NAMESPACE" \
  -o jsonpath='{.spec.selector.slot}' 2>/dev/null || echo "blue")

if [[ "$CURRENT_COLOR" == "blue" ]]; then
  NEW_COLOR="green"
else
  NEW_COLOR="blue"
fi

echo "Current: $CURRENT_COLOR → Deploying: $NEW_COLOR ($NEW_VERSION)"

# 1. Deploy new version to inactive slot
export COLOR="$NEW_COLOR" VERSION="$NEW_VERSION" IMAGE_TAG
envsubst < deploy/k8s/blue-green-deploy.yaml | kubectl apply -n "$NAMESPACE" -f -

# 2. Wait for rollout to complete
echo "Waiting for $NEW_COLOR deployment to be ready..."
kubectl rollout status deployment/"${SERVICE}-${NEW_COLOR}" -n "$NAMESPACE" --timeout=300s

# 3. Run smoke tests against the new deployment
NEW_POD=$(kubectl get pod -n "$NAMESPACE" -l "app=$SERVICE,slot=$NEW_COLOR" \
  -o jsonpath='{.items[0].metadata.name}')
echo "Running health check on $NEW_POD..."

HEALTH=$(kubectl exec -n "$NAMESPACE" "$NEW_POD" -- \
  wget -qO- http://localhost:3000/api/health 2>/dev/null || echo '{"status":"unhealthy"}')

STATUS=$(echo "$HEALTH" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)

if [[ "$STATUS" != "healthy" ]]; then
  echo "ERROR: Health check failed on $NEW_COLOR deployment!"
  echo "  Response: $HEALTH"
  echo "Rolling back — keeping $CURRENT_COLOR active"
  kubectl delete deployment "${SERVICE}-${NEW_COLOR}" -n "$NAMESPACE" || true
  exit 1
fi

# 4. Switch traffic to new deployment
echo "Health check passed. Switching traffic to $NEW_COLOR..."
kubectl patch service "$SERVICE" -n "$NAMESPACE" \
  --type='json' -p="[{\"op\":\"replace\",\"path\":\"/spec/selector/slot\",\"value\":\"${NEW_COLOR}\"}]"

echo "Traffic switched to $NEW_COLOR ($NEW_VERSION)"

# 5. Keep old deployment for 5 minutes (instant rollback window)
echo "Old $CURRENT_COLOR deployment preserved for rollback. To clean up:"
echo "  kubectl delete deployment ${SERVICE}-${CURRENT_COLOR} -n $NAMESPACE"
echo ""
echo "To rollback instantly:"
echo "  kubectl patch service $SERVICE -n $NAMESPACE --type='json' \\"
echo "    -p='[{\"op\":\"replace\",\"path\":\"/spec/selector/slot\",\"value\":\"${CURRENT_COLOR}\"}]'"
```

### Rollback (< 1 second)

```bash
# Instant rollback — just swap the service selector back
kubectl patch service gmacko-web --type='json' \
  -p='[{"op":"replace","path":"/spec/selector/slot","value":"blue"}]'
```

No new pods need to start. Traffic switches immediately because the old pods
are still running.

---

## Canary Deployment (Kubernetes)

For gradual rollouts: send 10% of traffic to the new version, monitor, then
increase to 100%.

### Using NGINX Ingress Annotations

```yaml
# canary-ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: gmacko-web-canary
  annotations:
    kubernetes.io/ingress.class: nginx
    nginx.ingress.kubernetes.io/canary: "true"
    nginx.ingress.kubernetes.io/canary-weight: "10"  # 10% traffic
spec:
  rules:
    - host: ${DOMAIN}
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: gmacko-web-canary
                port:
                  number: 80
```

### Gradual Rollout Script

```bash
#!/usr/bin/env bash
# scripts/canary-deploy.sh
WEIGHTS=(10 25 50 75 100)
PAUSE_SECONDS=120  # Monitor for 2 minutes at each stage

for weight in "${WEIGHTS[@]}"; do
  echo "Setting canary weight to ${weight}%..."
  kubectl annotate ingress gmacko-web-canary \
    nginx.ingress.kubernetes.io/canary-weight="$weight" --overwrite

  echo "Monitoring for ${PAUSE_SECONDS}s at ${weight}% traffic..."
  sleep "$PAUSE_SECONDS"

  # Check error rate from metrics
  # If error rate > threshold, abort and rollback
done

echo "Canary complete. Promoting to primary deployment."
```

---

## Single-Box K8s Setup (Hetzner)

For early-stage products that want K8s capabilities on a single affordable server.

### Recommended Setup

```
┌──────────────────────────────────────────────┐
│  Hetzner CX32 (4 vCPU, 8GB RAM, €7.49/mo)  │
│                                               │
│  ┌─────────────┐  ┌──────────────────────┐   │
│  │   k3s       │  │  Traefik Ingress     │   │
│  │  (1 node)   │  │  (auto TLS)          │   │
│  └─────────────┘  └──────────────────────┘   │
│                                               │
│  ┌─────────┐ ┌──────────┐ ┌──────────────┐  │
│  │ App     │ │ App      │ │ PostgreSQL   │  │
│  │ (blue)  │ │ (green)  │ │ (optional)   │  │
│  │ 256Mi   │ │ 256Mi    │ │ 512Mi        │  │
│  └─────────┘ └──────────┘ └──────────────┘  │
│                                               │
│  ┌──────────┐ ┌───────────┐ ┌────────────┐  │
│  │ Redis    │ │ Prometheus│ │ Grafana    │  │
│  │ 128Mi    │ │ 256Mi     │ │ 256Mi      │  │
│  └──────────┘ └───────────┘ └────────────┘  │
└──────────────────────────────────────────────┘
```

### Quick Setup (k3s)

```bash
# 1. Install k3s (lightweight K8s)
curl -sfL https://get.k3s.io | sh -

# 2. Copy kubeconfig
mkdir -p ~/.kube
sudo cp /etc/rancher/k3s/k3s.yaml ~/.kube/config
sudo chown $(id -u):$(id -g) ~/.kube/config

# 3. Install cert-manager for TLS
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.14.0/cert-manager.yaml

# 4. Deploy app
export IMAGE_TAG=ghcr.io/gmackie/gmacko-web:latest
export DOMAIN=app.yourdomain.com
envsubst < deploy/k8s/deployment.yaml | kubectl apply -f -

# 5. Set up blue-green
./scripts/blue-green-deploy.sh v1.0.0
```

### Scaling Up

When single-box capacity is exhausted:

1. **Add a second Hetzner node** (~$8/mo) — join to k3s cluster
2. **Move DB to managed** — Neon or Hetzner managed Postgres
3. **Add load balancer** — Hetzner LB at $6/mo
4. **Total**: ~$22/mo for a 2-node HA cluster with LB

---

## Migration Path: Vercel → Kubernetes

### Pre-migration Checklist

- [ ] App builds with `output: "standalone"` (already configured)
- [ ] Docker image builds and passes health checks locally
- [ ] Environment variables mapped to K8s secrets
- [ ] DNS TTL lowered to 60s (1 week before migration)
- [ ] Monitoring set up on new cluster (Prometheus + Grafana)
- [ ] Load test new deployment at expected traffic level
- [ ] Database connection tested from new cluster
- [ ] SSL/TLS certificate provisioned via cert-manager

### Migration Steps

1. **Set up K8s cluster** (Hetzner CX32 + k3s, ~30 minutes)
2. **Deploy app** in blue-green mode alongside Vercel
3. **Run parallel** for 1 week — both Vercel and K8s serve traffic
4. **Switch DNS** from Vercel to K8s cluster
5. **Monitor** for 24-48 hours
6. **Decommission** Vercel deployment

### What Changes in Codebase

Almost nothing. The app is already container-ready:
- `Dockerfile` — multi-stage build, already exists
- `output: "standalone"` — already configured in `next.config.js`
- Health checks — `/api/health`, `/api/health/live`, `/api/health/ready` already exist
- K8s manifests — already in `deploy/k8s/`

The only additions needed:
- Blue-green deploy script (provided above)
- Prometheus scraping config for `/api/metrics`
- Optional: HPA for auto-scaling

---

## Decision Matrix

| Factor | Vercel | K8s (Hetzner) | SST (AWS) |
|--------|--------|---------------|-----------|
| Setup time | Minutes | Hours | 30 minutes |
| Monthly cost (small) | $20 | $8-16 | $10-30 |
| Monthly cost (medium) | $80-200 | $35-50 | $50-100 |
| Monthly cost (large) | $500+ | $80-115 | $200-400 |
| WebSockets | No | Yes | Via API Gateway |
| Background jobs | Limited (60s) | Unlimited | Via Lambda/ECS |
| Blue-green | N/A (atomic) | Yes | Yes |
| Vendor lock-in | Medium | None | High |
| Team expertise needed | Low | Medium-High | Medium |
| Best for | MVP → PMF | Post-PMF → Scale | AWS shops |
