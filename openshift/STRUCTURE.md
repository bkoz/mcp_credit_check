# OpenShift Kustomize Deployment Structure

## Directory Tree

```
openshift/
├── README.md                           # Comprehensive deployment guide
├── QUICKSTART.md                       # 5-minute quick start guide
├── STRUCTURE.md                        # This file - deployment structure overview
├── Makefile                            # Make targets for common operations
├── deploy-dev.sh                       # Development deployment script
├── deploy-prod.sh                      # Production deployment script
│
├── base/                               # Base Kustomize resources (environment-agnostic)
│   ├── kustomization.yaml             # Main base kustomization
│   ├── namespace.yaml                 # Base namespace definition
│   │
│   ├── mcp-server/                    # MCP Server component
│   │   ├── kustomization.yaml
│   │   ├── imagestream.yaml           # Image stream for builds
│   │   ├── buildconfig.yaml           # Build configuration
│   │   ├── deployment.yaml            # Deployment spec
│   │   └── service.yaml               # Internal service
│   │
│   ├── api-server/                    # API Server component
│   │   ├── kustomization.yaml
│   │   ├── imagestream.yaml           # Image stream for builds
│   │   ├── buildconfig.yaml           # Build configuration
│   │   ├── deployment.yaml            # Deployment spec
│   │   └── service.yaml               # Internal service
│   │
│   └── nextjs/                        # Next.js UI component
│       ├── kustomization.yaml
│       ├── imagestream.yaml           # Image stream for builds
│       ├── buildconfig.yaml           # Build configuration
│       ├── deployment.yaml            # Deployment spec
│       ├── service.yaml               # Internal service
│       └── route.yaml                 # External route (HTTPS)
│
└── overlays/                          # Environment-specific overlays
    ├── dev/                           # Development environment
    │   ├── kustomization.yaml         # Dev kustomization (secrets, patches)
    │   ├── namespace.yaml             # Dev namespace (mcp-credit-report-dev)
    │   └── replica-patch.yaml         # Replica counts (1 each)
    │
    └── prod/                          # Production environment
        ├── kustomization.yaml         # Prod kustomization (secrets, patches)
        ├── namespace.yaml             # Prod namespace (mcp-credit-report-prod)
        ├── replica-patch.yaml         # Replica counts (2-3 each)
        └── resource-patch.yaml        # Resource limits (higher for prod)
```

## File Count Summary

- **Total Files**: 29
- **Base Resources**: 18 files
- **Dev Overlay**: 3 files
- **Prod Overlay**: 4 files
- **Scripts & Docs**: 4 files

## Resource Types

### Base Resources (per component)

Each component (mcp-server, api-server, nextjs) includes:
- **ImageStream** - Container image storage
- **BuildConfig** - Docker build configuration from Git
- **Deployment** - Pod template and replica management
- **Service** - Internal cluster networking

Additionally:
- **Route** (nextjs only) - External HTTPS access
- **Namespace** - Resource isolation

### Generated Resources (per environment)

Kustomize generates these from secretGenerator:
- **equifax-credentials** - Equifax API credentials
- **github-token** - GitHub Models API token

## Deployment Targets

### Development Environment

```yaml
Namespace: mcp-credit-report-dev
Prefix: dev-
Replicas: 1 (all services)
Resources: Standard limits
Secrets: Development credentials
```

**Resources:**
- dev-mcp-server (1 replica)
- dev-api-server (1 replica)
- dev-nextjs (1 replica)

### Production Environment

```yaml
Namespace: mcp-credit-report-prod
Prefix: prod-
Replicas: 2-3 (scaled)
Resources: Enhanced limits
Secrets: Production credentials
```

**Resources:**
- prod-mcp-server (2 replicas)
- prod-api-server (3 replicas)
- prod-nextjs (3 replicas)

## Kustomize Transformations

### Common Labels (All Environments)

```yaml
app.kubernetes.io/name: mcp-credit-report
app.kubernetes.io/part-of: mcp-credit-report
app.kubernetes.io/component: <component-name>
```

### Dev-Specific Labels

```yaml
environment: dev
```

### Prod-Specific Labels

```yaml
environment: prod
```

## Component Dependencies

```
Internet → Route → Next.js Service → Next.js Pods
                         ↓
                    API Server Service → API Server Pods
                         ↓
                    MCP Server Service → MCP Server Pods
                         ↓
                    Equifax API (external)
```

## Build Process

1. **Source**: Git repository specified in BuildConfig
2. **Context**: Component-specific directory (mcp-server/, api-server/, or root)
3. **Strategy**: Docker build using component's Dockerfile
4. **Output**: ImageStream tagged as `latest`
5. **Trigger**: ConfigChange or ImageChange

## Deployment Process

1. **Image Pull**: From internal registry
2. **Secret Injection**: Environment variables from Secrets
3. **Health Checks**: Liveness and readiness probes
4. **Service Discovery**: DNS-based service names
5. **External Access**: Route with TLS edge termination

## Secret Management

### Development Secrets

Located in: `overlays/dev/kustomization.yaml`

```yaml
secretGenerator:
  - name: equifax-credentials
    literals:
      - EQUIFAX_CLIENT_ID=...
      - EQUIFAX_CLIENT_SECRET=...
  - name: github-token
    literals:
      - GITHUB_TOKEN=...
```

### Production Secrets

Located in: `overlays/prod/kustomization.yaml`

```yaml
secretGenerator:
  - name: equifax-credentials
    literals:
      - EQUIFAX_CLIENT_ID=...
      - EQUIFAX_CLIENT_SECRET=...
  - name: github-token
    literals:
      - GITHUB_TOKEN=...
```

**⚠️ Security Note**: In production, consider using:
- OpenShift sealed secrets
- External secret management (Vault, AWS Secrets Manager)
- GitOps with encrypted secrets

## Resource Requirements

### Development

| Component   | CPU Request | CPU Limit | Memory Request | Memory Limit |
|-------------|-------------|-----------|----------------|--------------|
| MCP Server  | 100m        | 500m      | 256Mi          | 512Mi        |
| API Server  | 100m        | 500m      | 256Mi          | 512Mi        |
| Next.js     | 200m        | 1000m     | 512Mi          | 1Gi          |

### Production

| Component   | CPU Request | CPU Limit | Memory Request | Memory Limit |
|-------------|-------------|-----------|----------------|--------------|
| MCP Server  | 200m        | 1000m     | 512Mi          | 1Gi          |
| API Server  | 200m        | 1000m     | 512Mi          | 1Gi          |
| Next.js     | 500m        | 2000m     | 1Gi            | 2Gi          |

## Customization Points

1. **Replicas**: Adjust in `replica-patch.yaml`
2. **Resources**: Modify in `resource-patch.yaml` (prod only)
3. **Environment Variables**: Add to deployment.yaml or create env-patch.yaml
4. **Build Source**: Change Git URL in buildconfig.yaml
5. **Route Hostname**: Add host field in route.yaml
6. **TLS Certificates**: Configure in route.yaml
7. **Network Policies**: Add to base/ or overlays/
8. **Monitoring**: Add ServiceMonitor resources
9. **Autoscaling**: Add HorizontalPodAutoscaler resources
10. **Storage**: Add PersistentVolumeClaim resources

## Next Steps

For new environments (staging, UAT, etc.):

1. Create `overlays/<env>/` directory
2. Copy from existing overlay as template
3. Customize namespace, secrets, and patches
4. Deploy with `oc apply -k overlays/<env>`

## Maintenance

### Updating Credentials

1. Edit overlay kustomization.yaml
2. Update secretGenerator values
3. Apply: `oc apply -k overlays/<env>`
4. Restart pods: `oc rollout restart deployment/<name>`

### Scaling

```bash
# Via patch file
Edit overlays/<env>/replica-patch.yaml
oc apply -k overlays/<env>

# Direct scaling
oc scale deployment/dev-api-server --replicas=3
```

### Resource Updates

```bash
# Edit resource patch
vim overlays/prod/resource-patch.yaml

# Apply changes
oc apply -k overlays/prod
```

## Validation

Test the Kustomize build without applying:

```bash
# Development
oc kustomize overlays/dev > /tmp/dev-manifests.yaml
kubectl apply --dry-run=client -f /tmp/dev-manifests.yaml

# Production
oc kustomize overlays/prod > /tmp/prod-manifests.yaml
kubectl apply --dry-run=server -f /tmp/prod-manifests.yaml
```

## References

- [Kustomize Documentation](https://kustomize.io/)
- [OpenShift Kustomize Integration](https://docs.openshift.com/container-platform/latest/applications/working_with_helm_charts/configuring-custom-helm-chart-repositories.html)
- [Kubernetes Declarative Management](https://kubernetes.io/docs/tasks/manage-kubernetes-objects/kustomization/)
