# Quick Start Guide - OpenShift Deployment

Deploy the MCP Credit Report Demo to OpenShift in 5 minutes.

## Prerequisites

- OpenShift CLI (`oc`) installed
- Access to an OpenShift cluster
- Equifax sandbox credentials
- GitHub token with access to GitHub Models

## Step 1: Login to OpenShift

```bash
oc login <your-cluster-url>
```

## Step 2: Update Credentials

Edit `overlays/dev/kustomization.yaml` and replace the placeholder values:

```yaml
secretGenerator:
  - name: equifax-credentials
    literals:
      - EQUIFAX_CLIENT_ID=YOUR_ACTUAL_CLIENT_ID
      - EQUIFAX_CLIENT_SECRET=YOUR_ACTUAL_CLIENT_SECRET
  - name: github-token
    literals:
      - GITHUB_TOKEN=YOUR_ACTUAL_GITHUB_TOKEN
```

## Step 3: Update Git Repository

Update the Git repository URL in these files:
- `base/mcp-server/buildconfig.yaml`
- `base/api-server/buildconfig.yaml`
- `base/nextjs/buildconfig.yaml`

Replace `https://github.com/your-org/mcp_credit_check.git` with your repository URL.

## Step 4: Deploy

### Option A: Using Make (Recommended)

```bash
cd openshift
make deploy-dev
```

### Option B: Using Shell Script

```bash
cd openshift
./deploy-dev.sh
```

### Option C: Using oc CLI

```bash
cd openshift
oc apply -k overlays/dev

# Start builds
oc start-build dev-mcp-server -n mcp-credit-report-dev
oc start-build dev-api-server -n mcp-credit-report-dev
oc start-build dev-nextjs -n mcp-credit-report-dev

# Watch progress
oc get pods -n mcp-credit-report-dev -w
```

## Step 5: Get Application URL

```bash
# Using Make
make status-dev

# Or using oc
oc get route dev-nextjs -n mcp-credit-report-dev -o jsonpath='{.spec.host}'
```

## Step 6: Access Application

Open your browser to: `https://<route-url-from-step-5>`

## Verify Deployment

```bash
# Check all resources
oc get all -n mcp-credit-report-dev

# Check pod status
oc get pods -n mcp-credit-report-dev

# View logs
oc logs -f deployment/dev-mcp-server -n mcp-credit-report-dev
oc logs -f deployment/dev-api-server -n mcp-credit-report-dev
oc logs -f deployment/dev-nextjs -n mcp-credit-report-dev
```

## Common Commands

```bash
# View status
make status-dev

# View logs
make logs-dev

# Rebuild images
make build-dev

# Delete deployment
make delete-dev
```

## Troubleshooting

### Builds failing?

```bash
# Check build logs
oc logs -f build/dev-mcp-server-1 -n mcp-credit-report-dev
```

### Pods not starting?

```bash
# Describe pod
oc describe pod <pod-name> -n mcp-credit-report-dev

# Check events
oc get events -n mcp-credit-report-dev --sort-by='.lastTimestamp'
```

### Service connectivity issues?

```bash
# Test internal connectivity
oc rsh <pod-name> -n mcp-credit-report-dev
curl http://mcp-server:3001/mcp
```

## Next Steps

- Review the [full README](README.md) for detailed documentation
- Deploy to production using `make deploy-prod`
- Set up CI/CD pipelines
- Configure monitoring and alerting

## Production Deployment

For production deployment:

1. Update credentials in `overlays/prod/kustomization.yaml`
2. Review resource limits in `overlays/prod/resource-patch.yaml`
3. Run: `make deploy-prod`

## Support

For issues or questions, refer to:
- [OpenShift Documentation](https://docs.openshift.com/)
- [Kustomize Documentation](https://kustomize.io/)
- Project README and architecture documentation
