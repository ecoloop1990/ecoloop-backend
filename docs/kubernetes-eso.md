# EcoLoop backend — Kubernetes + External Secrets Operator (ESO)

## Target flow

```
Terraform → AWS (Secrets Manager + SSM Parameter Store)
    → External Secrets Operator → Kubernetes Secret `backend-env` + ConfigMap `backend-config`
    → Deployment `envFrom` → backend container
```

- **`backend-env`** is **created only by ESO** from AWS Secrets Manager secret `ecoloop-backend-core` (JSON keys `DATABASE_URL`, `JWT_SECRET`). Do not `kubectl create secret` for production.
- **`backend-config`** is **created only by ESO** from SSM parameters under `/ecoloop/prod/*`. No manual ConfigMap for runtime config.

Kubernetes consumes AWS; you do not paste Terraform outputs into Git or YAML for secrets.

## Prerequisites

1. **External Secrets Operator** installed (e.g. Helm chart `external-secrets/external-secrets`).
2. **IAM (IRSA) for the ESO controller** — the ServiceAccount referenced in `clustersecretstore-*.yaml` (default: `external-secrets` in `external-secrets` namespace) must assume an IAM role with:
   - `secretsmanager:GetSecretValue` on `ecoloop-backend-core` (and KMS decrypt if applicable)
   - `ssm:GetParameter`, `ssm:GetParameters`, `ssm:GetParametersByPath` for `/ecoloop/prod/*` (and KMS decrypt if applicable)
3. **AWS data**:
   - Secrets Manager: secret **`ecoloop-backend-core`** as JSON: `{ "DATABASE_URL": "...", "JWT_SECRET": "..." }`
   - SSM: one parameter per key (e.g. `/ecoloop/prod/NODE_ENV`, `/ecoloop/prod/PORT`, …) matching `externalsecret-backend-config.yaml`
4. **Align names** in `clustersecretstore-*.yaml`:
   - `region` → your region
   - `serviceAccountRef` → your ESO controller SA if different from `external-secrets` / `external-secrets`

## Apply order

```bash
kubectl apply -f kubernetes/clustersecretstore-aws-secretsmanager.yaml
kubectl apply -f kubernetes/clustersecretstore-aws-parameterstore.yaml
kubectl apply -f kubernetes/serviceaccount.yaml
kubectl apply -f kubernetes/externalsecret-backend-env.yaml
kubectl apply -f kubernetes/externalsecret-backend-config.yaml
# Wait until Secret backend-env and ConfigMap backend-config exist and are Ready
kubectl apply -f kubernetes/deployment.yaml
kubectl apply -f kubernetes/service.yaml
```

Or: `kubectl apply -f kubernetes/*.yaml` after ESO is installed (may error until ClusterSecretStore + AWS resources exist).

## GitHub Actions vs IRSA

- **GitHub OIDC** → IAM role used only by **CI/CD** (push ECR, `aws eks update-kubeconfig`). This is **not** IRSA.
- **IRSA** → IAM roles for **Pods inside EKS** (app `ecoloop-backend`, ESO controller). GitHub Actions does **not** use IRSA.

Store **non-sensitive** deploy metadata as **GitHub Actions variables** (`AWS_REGION`, `AWS_ACCOUNT_ID`, `ECR_REPOSITORY`, `EKS_CLUSTER_NAME`). Use **secrets** only for OIDC role ARN and CI test credentials if needed.
