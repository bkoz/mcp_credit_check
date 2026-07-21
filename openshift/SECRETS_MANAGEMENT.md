# Secrets Management Guide

## Overview

This deployment uses a **template-based approach** to manage secrets securely without committing them to Git.

## Quick Start

### Development Environment

```bash
cd openshift/overlays/dev

# Create secrets from template
cp secrets.yaml.template secrets.yaml

# Edit with your actual credentials
vim secrets.yaml
# or
nano secrets.yaml

# Deploy
oc apply -k .
```

### Production Environment

```bash
cd openshift/overlays/prod

# Create secrets from template
cp secrets.yaml.template secrets.yaml

# Edit with your actual PRODUCTION credentials
vim secrets.yaml

# Deploy
oc apply -k .
```

## Security Guarantees

✅ **secrets.yaml files are in .gitignore** - Won't be committed  
✅ **Only templates are in Git** - No real credentials tracked  
✅ **Separate dev/prod credentials** - Environment isolation  
✅ **Local-only secrets** - Stay on your machine  

## File Structure

```
overlays/
├── dev/
│   ├── secrets.yaml.template    ← Committed to Git (safe)
│   └── secrets.yaml              ← NOT in Git (your credentials)
└── prod/
    ├── secrets.yaml.template    ← Committed to Git (safe)
    └── secrets.yaml              ← NOT in Git (your credentials)
```

## Required Secrets

### Equifax Credentials

```yaml
EQUIFAX_CLIENT_ID: "your_client_id"
EQUIFAX_CLIENT_SECRET: "your_client_secret"
```

**How to obtain:**
1. Sign up at [Equifax Developer Portal](https://developer.equifax.com/)
2. Create a sandbox application
3. Copy Client ID and Client Secret

### GitHub Token

```yaml
GITHUB_TOKEN: "ghp_xxxxxxxxxxxx"
```

**How to obtain:**
1. Go to GitHub Settings → Developer settings → Personal access tokens
2. Generate new token (classic)
3. No scopes needed for GitHub Models (public access)
4. Copy the token

## Validation

### Check if secrets.yaml exists

```bash
# Development
ls -la overlays/dev/secrets.yaml

# Production
ls -la overlays/prod/secrets.yaml
```

### Validate secrets format

```bash
# Development
oc apply --dry-run=client -k overlays/dev

# Production
oc apply --dry-run=client -k overlays/prod
```

### Verify secrets are not in Git

```bash
# This should show only the template
git ls-files | grep secrets

# Output should be:
# openshift/overlays/dev/secrets.yaml.template
# openshift/overlays/prod/secrets.yaml.template
```

## Production Best Practices

### 1. Use Different Credentials

**❌ Don't:**
- Copy dev credentials to prod
- Share credentials between environments

**✅ Do:**
- Use separate Equifax accounts for dev/prod
- Use separate GitHub tokens
- Rotate credentials regularly

### 2. Access Control

```bash
# Restrict file permissions
chmod 600 overlays/dev/secrets.yaml
chmod 600 overlays/prod/secrets.yaml

# Verify
ls -l overlays/*/secrets.yaml
# Should show: -rw------- (owner read/write only)
```

### 3. Audit Trail

```bash
# Check who can access secrets in cluster
oc get rolebindings -n mcp-credit-report-dev
oc get rolebindings -n mcp-credit-report-prod

# Check secret usage
oc get secrets -n mcp-credit-report-dev
oc get secrets -n mcp-credit-report-prod
```

## Advanced Options

### Option 1: OpenShift Sealed Secrets (Recommended for GitOps)

[Sealed Secrets](https://github.com/bitnami-labs/sealed-secrets) encrypt secrets that can be safely committed to Git.

```bash
# Install Sealed Secrets operator
oc apply -f https://github.com/bitnami-labs/sealed-secrets/releases/download/v0.24.0/controller.yaml

# Create sealed secret
kubeseal --format yaml < secrets.yaml > sealed-secrets.yaml

# Commit sealed-secrets.yaml to Git
git add sealed-secrets.yaml
git commit -m "Add sealed secrets"
```

Update `kustomization.yaml`:
```yaml
resources:
  - sealed-secrets.yaml  # Instead of secrets.yaml
```

### Option 2: External Secrets Operator

[External Secrets Operator](https://external-secrets.io/) integrates with external secret stores.

**Supported backends:**
- AWS Secrets Manager
- Azure Key Vault
- HashiCorp Vault
- Google Secret Manager

```yaml
apiVersion: external-secrets.io/v1beta1
kind: SecretStore
metadata:
  name: vault-backend
spec:
  provider:
    vault:
      server: "http://vault:8200"
      path: "secret"
      auth:
        kubernetes:
          mountPath: "kubernetes"
          role: "mcp-credit-report"

---
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: equifax-credentials
spec:
  secretStoreRef:
    name: vault-backend
  target:
    name: equifax-credentials
  data:
    - secretKey: EQUIFAX_CLIENT_ID
      remoteRef:
        key: equifax
        property: client_id
```

### Option 3: Environment Variables (CI/CD)

For CI/CD pipelines, use environment variables:

```bash
# In your CI/CD pipeline
export EQUIFAX_CLIENT_ID="xxx"
export EQUIFAX_CLIENT_SECRET="xxx"
export GITHUB_TOKEN="xxx"

# Generate secrets on-the-fly
cat > overlays/dev/secrets.yaml <<EOF
apiVersion: v1
kind: Secret
metadata:
  name: equifax-credentials
type: Opaque
stringData:
  EQUIFAX_CLIENT_ID: "${EQUIFAX_CLIENT_ID}"
  EQUIFAX_CLIENT_SECRET: "${EQUIFAX_CLIENT_SECRET}"
---
apiVersion: v1
kind: Secret
metadata:
  name: github-token
type: Opaque
stringData:
  GITHUB_TOKEN: "${GITHUB_TOKEN}"
EOF

# Deploy
oc apply -k overlays/dev

# Clean up
rm overlays/dev/secrets.yaml
```

### Option 4: OpenShift Secret Management

Use OpenShift's built-in secret commands:

```bash
# Create secret directly in cluster
oc create secret generic equifax-credentials \
  --from-literal=EQUIFAX_CLIENT_ID=xxx \
  --from-literal=EQUIFAX_CLIENT_SECRET=xxx \
  -n mcp-credit-report-dev

oc create secret generic github-token \
  --from-literal=GITHUB_TOKEN=xxx \
  -n mcp-credit-report-dev

# Update kustomization.yaml to not include secrets.yaml
# Or create an empty secrets.yaml file
```

## Troubleshooting

### Error: secrets.yaml not found

```
Error: accumulating resources: accumulation err='accumulating resources from 'secrets.yaml': 
evalsymlink failure on '/path/to/secrets.yaml'
```

**Solution:**
```bash
cd overlays/dev  # or overlays/prod
cp secrets.yaml.template secrets.yaml
# Edit secrets.yaml with your credentials
```

### Error: Invalid secret format

```
Error: unable to recognize "secrets.yaml": no matches for kind "Secret"
```

**Solution:**
Check YAML syntax:
```bash
yamllint secrets.yaml
# or
oc apply --dry-run=client -f secrets.yaml
```

### Secrets not being used by pods

```bash
# Check if secret exists
oc get secret equifax-credentials -n mcp-credit-report-dev

# Check pod environment variables
oc set env deployment/dev-mcp-server --list -n mcp-credit-report-dev

# Describe pod to see events
oc describe pod <pod-name> -n mcp-credit-report-dev
```

## Security Checklist

Before deploying to production:

- [ ] secrets.yaml files are NOT in Git
- [ ] .gitignore includes secrets.yaml
- [ ] Different credentials for dev/prod
- [ ] File permissions set to 600
- [ ] Secrets rotated regularly (quarterly)
- [ ] Access logging enabled
- [ ] Backup of secret values in secure location
- [ ] Team members have their own credentials
- [ ] Service accounts have minimal permissions
- [ ] Secrets encrypted at rest (OpenShift default)

## Credential Rotation

### Rotate Equifax Credentials

```bash
# 1. Generate new credentials in Equifax portal
# 2. Update secrets.yaml
# 3. Apply changes
oc apply -k overlays/prod

# 4. Restart deployments to use new secrets
oc rollout restart deployment/prod-mcp-server -n mcp-credit-report-prod

# 5. Verify pods are running
oc get pods -n mcp-credit-report-prod

# 6. Revoke old credentials in Equifax portal
```

### Rotate GitHub Token

```bash
# 1. Generate new token in GitHub
# 2. Update secrets.yaml
# 3. Apply changes
oc apply -k overlays/prod

# 4. Restart deployments
oc rollout restart deployment/prod-api-server -n mcp-credit-report-prod

# 5. Verify
oc get pods -n mcp-credit-report-prod

# 6. Revoke old token in GitHub
```

## Backup & Recovery

### Backup Secrets

```bash
# Export secrets to encrypted file
oc get secret equifax-credentials -n mcp-credit-report-prod -o yaml > backup-equifax.yaml
oc get secret github-token -n mcp-credit-report-prod -o yaml > backup-github.yaml

# Encrypt backups
gpg --encrypt --recipient your@email.com backup-equifax.yaml
gpg --encrypt --recipient your@email.com backup-github.yaml

# Store encrypted files in secure location
# Delete plaintext backups
rm backup-equifax.yaml backup-github.yaml
```

### Restore Secrets

```bash
# Decrypt backup
gpg --decrypt backup-equifax.yaml.gpg > backup-equifax.yaml

# Apply to cluster
oc apply -f backup-equifax.yaml -n mcp-credit-report-prod

# Verify
oc get secret equifax-credentials -n mcp-credit-report-prod

# Clean up
rm backup-equifax.yaml
```

## Team Workflow

### For Developers

1. Clone repository
2. Copy template: `cp secrets.yaml.template secrets.yaml`
3. Request credentials from team lead
4. Add to local secrets.yaml
5. Deploy: `oc apply -k overlays/dev`
6. **Never commit secrets.yaml**

### For DevOps/Platform Team

1. Maintain production secrets in secure vault
2. Rotate credentials quarterly
3. Audit secret access regularly
4. Monitor for leaked credentials
5. Implement automated secret scanning
6. Set up alerts for secret exposure

## References

- [OpenShift Secrets Documentation](https://docs.openshift.com/container-platform/latest/nodes/pods/nodes-pods-secrets.html)
- [Kubernetes Secrets Best Practices](https://kubernetes.io/docs/concepts/configuration/secret/)
- [Sealed Secrets](https://github.com/bitnami-labs/sealed-secrets)
- [External Secrets Operator](https://external-secrets.io/)
- [OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
