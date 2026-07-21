.PHONY: help preview-dev preview-prod deploy-dev deploy-prod delete-dev delete-prod logs-dev logs-prod status-dev status-prod

help:
	@echo "MCP Credit Report - OpenShift Kustomize Deployment"
	@echo ""
	@echo "Available targets:"
	@echo "  preview-dev   - Preview development manifests"
	@echo "  preview-prod  - Preview production manifests"
	@echo "  deploy-dev    - Deploy to development environment"
	@echo "  deploy-prod   - Deploy to production environment"
	@echo "  delete-dev    - Delete development deployment"
	@echo "  delete-prod   - Delete production deployment"
	@echo "  logs-dev      - View development logs"
	@echo "  logs-prod     - View production logs"
	@echo "  status-dev    - Check development status"
	@echo "  status-prod   - Check production status"
	@echo "  build-dev     - Trigger development builds"
	@echo "  build-prod    - Trigger production builds"

preview-dev:
	@echo "Previewing development manifests..."
	oc kustomize overlays/dev

preview-prod:
	@echo "Previewing production manifests..."
	oc kustomize overlays/prod

deploy-dev:
	@echo "Deploying to development..."
	oc apply -k overlays/dev
	@echo "Waiting for rollout..."
	oc rollout status deployment/dev-mcp-server -n mcp-credit-report-dev --timeout=5m
	oc rollout status deployment/dev-api-server -n mcp-credit-report-dev --timeout=5m
	oc rollout status deployment/dev-nextjs -n mcp-credit-report-dev --timeout=5m
	@echo "Deployment complete!"
	@echo "URL: https://$$(oc get route dev-nextjs -n mcp-credit-report-dev -o jsonpath='{.spec.host}')"

deploy-prod:
	@echo "⚠️  Deploying to PRODUCTION..."
	@read -p "Type 'yes' to continue: " confirm && [ "$$confirm" = "yes" ] || exit 1
	oc apply -k overlays/prod
	@echo "Waiting for rollout..."
	oc rollout status deployment/prod-mcp-server -n mcp-credit-report-prod --timeout=5m
	oc rollout status deployment/prod-api-server -n mcp-credit-report-prod --timeout=5m
	oc rollout status deployment/prod-nextjs -n mcp-credit-report-prod --timeout=5m
	@echo "Deployment complete!"
	@echo "URL: https://$$(oc get route prod-nextjs -n mcp-credit-report-prod -o jsonpath='{.spec.host}')"

delete-dev:
	@echo "Deleting development deployment..."
	oc delete -k overlays/dev

delete-prod:
	@echo "⚠️  Deleting PRODUCTION deployment..."
	@read -p "Type 'yes' to continue: " confirm && [ "$$confirm" = "yes" ] || exit 1
	oc delete -k overlays/prod

logs-dev:
	@echo "Select component to view logs:"
	@echo "1) MCP Server"
	@echo "2) API Server"
	@echo "3) Next.js"
	@read -p "Enter choice [1-3]: " choice; \
	case $$choice in \
		1) oc logs -f deployment/dev-mcp-server -n mcp-credit-report-dev ;; \
		2) oc logs -f deployment/dev-api-server -n mcp-credit-report-dev ;; \
		3) oc logs -f deployment/dev-nextjs -n mcp-credit-report-dev ;; \
		*) echo "Invalid choice" ;; \
	esac

logs-prod:
	@echo "Select component to view logs:"
	@echo "1) MCP Server"
	@echo "2) API Server"
	@echo "3) Next.js"
	@read -p "Enter choice [1-3]: " choice; \
	case $$choice in \
		1) oc logs -f deployment/prod-mcp-server -n mcp-credit-report-prod ;; \
		2) oc logs -f deployment/prod-api-server -n mcp-credit-report-prod ;; \
		3) oc logs -f deployment/prod-nextjs -n mcp-credit-report-prod ;; \
		*) echo "Invalid choice" ;; \
	esac

status-dev:
	@echo "Development Environment Status:"
	@echo ""
	@echo "Pods:"
	@oc get pods -n mcp-credit-report-dev
	@echo ""
	@echo "Deployments:"
	@oc get deployments -n mcp-credit-report-dev
	@echo ""
	@echo "Services:"
	@oc get services -n mcp-credit-report-dev
	@echo ""
	@echo "Routes:"
	@oc get routes -n mcp-credit-report-dev

status-prod:
	@echo "Production Environment Status:"
	@echo ""
	@echo "Pods:"
	@oc get pods -n mcp-credit-report-prod
	@echo ""
	@echo "Deployments:"
	@oc get deployments -n mcp-credit-report-prod
	@echo ""
	@echo "Services:"
	@oc get services -n mcp-credit-report-prod
	@echo ""
	@echo "Routes:"
	@oc get routes -n mcp-credit-report-prod

build-dev:
	@echo "Triggering development builds..."
	oc start-build dev-mcp-server -n mcp-credit-report-dev
	oc start-build dev-api-server -n mcp-credit-report-dev
	oc start-build dev-nextjs -n mcp-credit-report-dev

build-prod:
	@echo "Triggering production builds..."
	oc start-build prod-mcp-server -n mcp-credit-report-prod
	oc start-build prod-api-server -n mcp-credit-report-prod
	oc start-build prod-nextjs -n mcp-credit-report-prod
