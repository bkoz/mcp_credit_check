# OpenShift Deployment with Kustomize

This directory contains Kustomize-based deployment configurations for the MCP Credit Report Demo on OpenShift.

## Directory Structure

```
openshift/
├── base/                           # Base configurations (environment-agnostic)
│   ├── kustomization.yaml         # Base kustomization file
│   ├── namespace.yaml             # Namespace definition
│   ├── mcp-server/               # MCP Server resources
│   │   ├── kustomization.yaml
│   │   ├── imagestream.yaml
│   │   ├── buildconfig.yaml
│   │   ├── deployment.yaml
│   │   └── service.yaml
│   ├── api-server/               # API Server resources
│   │   ├── kustomization.yaml
│   │   ├── imagestream.yaml
│   │   ├── buildconfig.yaml
│   │   ├── deployment.yaml
│   │   └── service.yaml
│   └── nextjs/                   # Next.js UI resources
│       ├── kustomization.yaml
│       ├── imagestream.yaml
│       ├── buildconfig.yaml
│       ├── deployment.yaml
│       ├── service.yaml
│       └── route.yaml
└── overlays/                      # Environment-specific configurations
    ├── dev/                       # Development environment
    │   ├── kustomization.yaml
    │   ├── namespace.yaml
    │   └── replica-patch.yaml
    └── prod/                      # Production environment
        ├── kustomization.yaml
        ├── namespace.yaml
        ├── replica-patch.yaml
        └── resource-patch.yaml
```

## Prerequisites

1. OpenShift 4.x cluster access
2. `oc` CLI tool installed
3. `kubectl` with Kustomize support (or standalone `kustomize` CLI)
4. Git repository with the application code
5. Equifax credentials
6. GitHub token for GitHub Models API

## Quick Start

### 1. Update Credentials

Edit the `secretGenerator` section in the overlay files:

**For Development** (`overlays/dev/kustomization.yaml`):
```yaml
secretGenerator:
  - name: equifax-credentials
    literals:
      - EQUIFAX_CLIENT_ID=your_dev_equifax_client_id
      - EQUIFAX_CLIENT_SECRET=your_dev_equifax_client_secret
  - name: github-token
    literals:
      - GITHUB_TOKEN=your_dev_github_token
```

**For Production** (`overlays/prod/kustomization.yaml`):
```yaml
secretGenerator:
  - name: equifax-credentials
    literals:
      - EQUIFAX_CLIENT_ID=your_prod_equifax_client_id
      - EQUIFAX_CLIENT_SECRET=your_prod_equifax_client_secret
  - name: github-token
    literals:
      - GITHUB_TOKEN=your_prod_github_token
```

### 2. Update Git Repository URLs

Update the `git.uri` field in all BuildConfig files:
- `base/mcp-server/buildconfig.yaml`
- `base/api-server/buildconfig.yaml`
- `base/nextjs/buildconfig.yaml`

Replace `https://github.com/your-org/mcp_credit_check.git` with your actual repository URL.

### 3. Deploy to Development

```bash
# Login to OpenShift
oc login <your-openshift-cluster-url>

# Preview the generated manifests
oc kustomize overlays/dev

# Apply to cluster
oc apply -k overlays/dev

# Watch deployment progress
oc get pods -n mcp-credit-report-dev -w
```

### 4. Deploy to Production

```bash
# Preview the generated manifests
oc kustomize overlays/prod

# Apply to cluster
oc apply -k overlays/prod

# Watch deployment progress
oc get pods -n mcp-credit-report-prod -w
```

## Kustomize Features Used

### Base Configuration
- Common labels applied to all resources
- Shared resource definitions
- Componentized structure (mcp-server, api-server, nextjs)

### Development Overlay
- **Namespace**: `mcp-credit-report-dev`
- **Name Prefix**: `dev-` (all resources prefixed)
- **Replicas**: 1 for all services
- **Labels**: `environment: dev`
- **Secrets**: Development credentials

### Production Overlay
- **Namespace**: `mcp-credit-report-prod`
- **Name Prefix**: `prod-` (all resources prefixed)
- **Replicas**: 
  - MCP Server: 2
  - API Server: 3
  - Next.js: 3
- **Labels**: `environment: prod`
- **Secrets**: Production credentials
- **Resources**: Increased CPU/memory limits

## Common Operations

### View Generated Manifests

```bash
# Development
oc kustomize overlays/dev > dev-manifests.yaml

# Production
oc kustomize overlays/prod > prod-manifests.yaml
```

### Update Deployment

```bash
# After making changes to kustomization files
oc apply -k overlays/dev

# Or for production
oc apply -k overlays/prod
```

### Trigger Builds

```bash
# Development
oc start-build dev-mcp-server -n mcp-credit-report-dev
oc start-build dev-api-server -n mcp-credit-report-dev
oc start-build dev-nextjs -n mcp-credit-report-dev

# Production
oc start-build prod-mcp-server -n mcp-credit-report-prod
oc start-build prod-api-server -n mcp-credit-report-prod
oc start-build prod-nextjs -n mcp-credit-report-prod
```

### View Logs

```bash
# Development
oc logs -f deployment/dev-mcp-server -n mcp-credit-report-dev
oc logs -f deployment/dev-api-server -n mcp-credit-report-dev
oc logs -f deployment/dev-nextjs -n mcp-credit-report-dev

# Production
oc logs -f deployment/prod-mcp-server -n mcp-credit-report-prod
oc logs -f deployment/prod-api-server -n mcp-credit-report-prod
oc logs -f deployment/prod-nextjs -n mcp-credit-report-prod
```

### Get Application URL

```bash
# Development
oc get route dev-nextjs -n mcp-credit-report-dev -o jsonpath='{.spec.host}'

# Production
oc get route prod-nextjs -n mcp-credit-report-prod -o jsonpath='{.spec.host}'
```

### Scale Deployments

```bash
# Development
oc scale deployment/dev-api-server --replicas=2 -n mcp-credit-report-dev

# Production
oc scale deployment/prod-nextjs --replicas=5 -n mcp-credit-report-prod
```

## Customization

### Adding a New Environment

1. Create a new overlay directory:
```bash
mkdir -p overlays/staging
```

2. Create `overlays/staging/kustomization.yaml`:
```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

namespace: mcp-credit-report-staging
namePrefix: staging-

bases:
  - ../../base

secretGenerator:
  - name: equifax-credentials
    literals:
      - EQUIFAX_CLIENT_ID=your_staging_id
      - EQUIFAX_CLIENT_SECRET=your_staging_secret
  - name: github-token
    literals:
      - GITHUB_TOKEN=your_staging_token

commonLabels:
  environment: staging
```

3. Deploy:
```bash
oc apply -k overlays/staging
```

### Patching Resources

Create patch files in overlay directories to modify base resources:

**Example: Adding environment variables**

Create `overlays/dev/env-patch.yaml`:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-server
spec:
  template:
    spec:
      containers:
        - name: api-server
          env:
            - name: LOG_LEVEL
              value: debug
```

Add to `overlays/dev/kustomization.yaml`:
```yaml
patchesStrategicMerge:
  - env-patch.yaml
```

### Using ConfigMaps

Add ConfigMap generator to overlay:

```yaml
configMapGenerator:
  - name: app-config
    literals:
      - API_TIMEOUT=30000
      - MAX_RETRIES=3
```

Reference in deployment patch:
```yaml
spec:
  template:
    spec:
      containers:
        - name: api-server
          envFrom:
            - configMapRef:
                name: app-config
```

## Resource Requirements by Environment

### Development
- **MCP Server**: 256Mi-512Mi memory, 100m-500m CPU
- **API Server**: 256Mi-512Mi memory, 100m-500m CPU
- **Next.js**: 512Mi-1Gi memory, 200m-1000m CPU

### Production
- **MCP Server**: 512Mi-1Gi memory, 200m-1000m CPU
- **API Server**: 512Mi-1Gi memory, 200m-1000m CPU
- **Next.js**: 1Gi-2Gi memory, 500m-2000m CPU

## Troubleshooting

### Kustomize Build Errors

```bash
# Validate kustomization.yaml syntax
oc kustomize overlays/dev --enable-alpha-plugins

# Check for resource conflicts
oc diff -k overlays/dev
```

### Secret Issues

```bash
# View generated secrets (without values)
oc get secrets -n mcp-credit-report-dev

# Describe secret
oc describe secret dev-equifax-credentials -n mcp-credit-report-dev
```

### Build Failures

```bash
# Check BuildConfig
oc get bc -n mcp-credit-report-dev

# View build logs
oc logs -f build/dev-mcp-server-1 -n mcp-credit-report-dev
```

### Deployment Issues

```bash
# Check deployment status
oc get deployment -n mcp-credit-report-dev

# Describe deployment
oc describe deployment dev-mcp-server -n mcp-credit-report-dev

# View events
oc get events -n mcp-credit-report-dev --sort-by='.lastTimestamp'
```

## Cleanup

### Delete Specific Environment

```bash
# Development
oc delete -k overlays/dev

# Production
oc delete -k overlays/prod
```

### Delete Namespace Only

```bash
# Development
oc delete namespace mcp-credit-report-dev

# Production
oc delete namespace mcp-credit-report-prod
```

## CI/CD Integration

### GitOps with ArgoCD

Create an ArgoCD Application:

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: mcp-credit-report-dev
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/your-org/mcp_credit_check.git
    targetRevision: main
    path: openshift/overlays/dev
  destination:
    server: https://kubernetes.default.svc
    namespace: mcp-credit-report-dev
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
```

### Tekton Pipeline

Example Tekton pipeline for building and deploying:

```yaml
apiVersion: tekton.dev/v1beta1
kind: Pipeline
metadata:
  name: mcp-credit-report-pipeline
spec:
  params:
    - name: environment
      default: dev
  tasks:
    - name: build-images
      taskRef:
        name: openshift-build
    - name: deploy
      taskRef:
        name: kustomize-deploy
      params:
        - name: overlay
          value: $(params.environment)
```

## Best Practices

1. **Never commit real credentials** - Use sealed secrets or external secret management
2. **Use separate namespaces** for each environment
3. **Apply resource quotas** to prevent resource exhaustion
4. **Enable monitoring** and alerting for production
5. **Implement RBAC** with least-privilege access
6. **Regular backups** of configurations and data
7. **Use image tags** instead of `latest` for production
8. **Implement network policies** to restrict pod-to-pod communication
9. **Regular security scanning** of container images
10. **Document all customizations** in overlay-specific README files

## Additional Resources

- [Kustomize Documentation](https://kustomize.io/)
- [OpenShift Documentation](https://docs.openshift.com/)
- [kubectl Kustomize](https://kubernetes.io/docs/tasks/manage-kubernetes-objects/kustomization/)
