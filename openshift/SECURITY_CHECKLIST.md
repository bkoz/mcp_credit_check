# Security Checklist

## Before Committing to Git

Run this checklist before every commit:

```bash
cd openshift
./verify-no-secrets.sh
```

### Manual Checks

- [ ] No `secrets.yaml` files in Git
- [ ] Only `secrets.yaml.template` files committed
- [ ] `.gitignore` includes `secrets.yaml` patterns
- [ ] No real credentials in any tracked files
- [ ] No API keys, tokens, or passwords in code

## Before Deploying

### Development

- [ ] `overlays/dev/secrets.yaml` exists
- [ ] All placeholder values replaced with real credentials
- [ ] File permissions set to 600: `chmod 600 overlays/dev/secrets.yaml`
- [ ] Using development/sandbox credentials (not production)

### Production

- [ ] `overlays/prod/secrets.yaml` exists
- [ ] All placeholder values replaced with real PRODUCTION credentials
- [ ] File permissions set to 600: `chmod 600 overlays/prod/secrets.yaml`
- [ ] Using different credentials than development
- [ ] Credentials from production Equifax account
- [ ] Production GitHub token (not personal dev token)
- [ ] Secrets backed up in secure location (encrypted)

## Git Repository Security

### Setup Pre-commit Hook

```bash
# Install pre-commit hook
cp openshift/pre-commit-hook.sh .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

This hook will:
- Prevent committing `secrets.yaml` files
- Scan for secret patterns in staged changes
- Block commits containing potential secrets

### Verify Repository

```bash
# Run verification script
cd openshift
./verify-no-secrets.sh

# Check git history for secrets (one-time audit)
git log -p | grep -E "EQUIFAX_CLIENT_ID|EQUIFAX_CLIENT_SECRET|GITHUB_TOKEN" | grep -v "REPLACE_WITH"
```

### If Secrets Were Committed

**CRITICAL: Act immediately if secrets were committed to Git!**

```bash
# 1. Rotate ALL affected credentials IMMEDIATELY
# - Generate new Equifax credentials
# - Generate new GitHub token
# - Update local secrets.yaml files

# 2. Remove from Git history (use with caution)
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch openshift/overlays/*/secrets.yaml" \
  --prune-empty --tag-name-filter cat -- --all

# 3. Force push (if repository is private and you're the only user)
git push origin --force --all

# 4. Contact team members to re-clone
# 5. Report incident if required by policy
```

## OpenShift Cluster Security

### Namespace Isolation

- [ ] Dev and prod in separate namespaces
- [ ] Network policies configured (if required)
- [ ] Resource quotas defined
- [ ] Limit ranges applied

### RBAC

```bash
# Verify who has access to secrets
oc get rolebindings -n mcp-credit-report-dev
oc get rolebindings -n mcp-credit-report-prod

# Check service account permissions
oc get sa -n mcp-credit-report-dev
oc describe sa default -n mcp-credit-report-dev
```

### Secret Encryption

- [ ] Verify secrets are encrypted at rest (OpenShift default)
- [ ] TLS enabled on routes
- [ ] Internal service communication uses ClusterIP (not exposed)

### Audit Logging

```bash
# Check who accessed secrets
oc get events -n mcp-credit-report-prod --field-selector involvedObject.kind=Secret

# View pod logs for suspicious activity
oc logs -l app.kubernetes.io/name=mcp-credit-report -n mcp-credit-report-prod --tail=100
```

## Credential Management

### Rotation Schedule

- [ ] Equifax credentials rotated quarterly (every 90 days)
- [ ] GitHub tokens rotated quarterly
- [ ] Service account tokens rotated annually
- [ ] Rotation documented in change log

### Rotation Procedure

```bash
# 1. Generate new credentials
# 2. Update secrets.yaml
# 3. Apply to cluster
oc apply -k overlays/prod

# 4. Restart deployments to use new secrets
oc rollout restart deployment/prod-mcp-server -n mcp-credit-report-prod
oc rollout restart deployment/prod-api-server -n mcp-credit-report-prod

# 5. Verify pods are healthy
oc get pods -n mcp-credit-report-prod

# 6. Test application functionality

# 7. Revoke old credentials
```

### Access Control

- [ ] Principle of least privilege applied
- [ ] Each developer has their own credentials (not shared)
- [ ] Production credentials restricted to ops team
- [ ] Service accounts used for automation (not personal credentials)
- [ ] Multi-factor authentication enabled on Equifax/GitHub accounts

## Backup & Recovery

### Backup Secrets

```bash
# Export and encrypt secrets
oc get secret -n mcp-credit-report-prod -o yaml > backup.yaml
gpg --encrypt --recipient ops@company.com backup.yaml
rm backup.yaml

# Store encrypted backup in secure location:
# - Password manager (1Password, LastPass)
# - Encrypted vault (HashiCorp Vault)
# - Encrypted cloud storage (with access logging)
```

### Recovery Test

- [ ] Secrets backup verified and accessible
- [ ] Decryption tested
- [ ] Recovery procedure documented
- [ ] Recovery tested in dev environment

## Monitoring & Alerting

### Enable Alerts

```yaml
# Example: Alert on secret access
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: secret-access-alert
spec:
  groups:
    - name: secrets
      rules:
        - alert: SecretAccessed
          expr: |
            increase(apiserver_audit_event_total{
              objectRef_resource="secrets",
              verb="get"
            }[5m]) > 10
          annotations:
            message: "High number of secret accesses detected"
```

### Regular Audits

- [ ] Weekly: Review access logs
- [ ] Monthly: Scan for exposed secrets in Git
- [ ] Quarterly: Rotate credentials
- [ ] Annually: Security audit of deployment

## Compliance

### Data Protection

- [ ] Secrets stored encrypted at rest
- [ ] Secrets transmitted over TLS
- [ ] No secrets in logs
- [ ] No secrets in error messages
- [ ] No secrets in metrics/monitoring

### Regulatory Requirements

- [ ] PCI-DSS compliance (if applicable)
- [ ] SOC 2 requirements met (if applicable)
- [ ] GDPR compliance for EU data (if applicable)
- [ ] Industry-specific regulations followed

## Incident Response

### If Credentials Are Compromised

1. **Immediate Actions** (within 1 hour)
   - [ ] Revoke compromised credentials
   - [ ] Generate and deploy new credentials
   - [ ] Check audit logs for unauthorized access
   - [ ] Notify security team

2. **Investigation** (within 24 hours)
   - [ ] Determine scope of compromise
   - [ ] Identify how credentials were exposed
   - [ ] Review all access during compromise window
   - [ ] Document findings

3. **Remediation** (within 1 week)
   - [ ] Fix root cause
   - [ ] Update security procedures
   - [ ] Implement additional controls
   - [ ] Train team on lessons learned

4. **Reporting**
   - [ ] Document incident
   - [ ] Report to management
   - [ ] Report to legal/compliance (if required)
   - [ ] Update incident response plan

## Tools & Automation

### Recommended Tools

- **Sealed Secrets**: Encrypt secrets for GitOps
  ```bash
  kubeseal --format yaml < secrets.yaml > sealed-secrets.yaml
  ```

- **External Secrets Operator**: Sync from external vaults
  ```bash
  oc apply -f https://raw.githubusercontent.com/external-secrets/external-secrets/main/deploy/crds/bundle.yaml
  ```

- **Git-secrets**: Prevent committing secrets
  ```bash
  git secrets --install
  git secrets --register-aws
  ```

- **TruffleHog**: Scan Git history for secrets
  ```bash
  trufflehog git https://github.com/your-org/repo
  ```

### CI/CD Integration

```yaml
# Example GitHub Action to verify no secrets
name: Security Check
on: [push, pull_request]
jobs:
  verify-no-secrets:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Verify no secrets
        run: |
          cd openshift
          ./verify-no-secrets.sh
```

## Training & Awareness

### Team Education

- [ ] All team members trained on secrets management
- [ ] Documentation reviewed and understood
- [ ] Incident response procedures practiced
- [ ] Regular security awareness updates

### Documentation

- [ ] Secrets management procedures documented
- [ ] Rotation schedule maintained
- [ ] Contact list for security incidents
- [ ] Escalation procedures defined

## Checklist Summary

**Daily:**
- Run `verify-no-secrets.sh` before commits

**Weekly:**
- Review access logs
- Check for failed authentication attempts

**Monthly:**
- Audit Git repository for secrets
- Review RBAC permissions

**Quarterly:**
- Rotate all credentials
- Security review of deployment
- Update documentation

**Annually:**
- Comprehensive security audit
- Penetration testing (if applicable)
- Update security policies

---

**Last Updated**: 2026-07-20  
**Owner**: DevOps/Platform Team  
**Review Date**: 2026-10-20
