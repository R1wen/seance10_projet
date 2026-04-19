# TP10 — Ecommerce DevOps

Projet e-commerce full-stack déployé sur AWS avec pipeline CI/CD, infrastructure Terraform et monitoring CloudWatch.

## Prérequis

| Outil | Version minimale |
|---|---|
| Node.js | 20.x |
| npm | 10.x |
| Docker | 24.x |
| Docker Compose | v2 |
| Terraform | 1.6+ |
| AWS CLI | 2.x (pour le déploiement) |

## Stack

| Couche | Technologie |
|---|---|
| Backend | Node.js 20, Express, TypeScript, Prisma 7 |
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| Base de données | PostgreSQL 16 |
| Infrastructure | AWS ECS Fargate, RDS, ALB, ECR (Terraform) |
| CI/CD | GitHub Actions |
| Monitoring | CloudWatch, SNS |

## Structure du projet

```
.
├── src/
│   ├── backend/          # API Express + Prisma
│   └── frontend/         # React + Vite
├── infrastructure/
│   ├── terraform/        # Infrastructure AWS (IaC)
│   └── cloudwatch/       # Config CloudWatch Agent
├── .github/workflows/    # Pipelines CI/CD
└── docs/
    └── openapi.yaml      # Spécification API
```

## Variables d'environnement

Copier `.env.example` → `.env` et renseigner les valeurs :

| Variable | Description | Exemple |
|---|---|---|
| `DATABASE_URL` | URL de connexion PostgreSQL | `postgresql://user:pass@localhost:5432/ecommerce` |
| `JWT_SECRET` | Clé secrète pour signer les tokens JWT | chaîne aléatoire longue |
| `JWT_EXPIRES_IN` | Durée de validité du token | `7d` |
| `NODE_ENV` | Environnement Node | `development` / `production` |
| `PORT` | Port du serveur backend | `3000` |
| `FRONTEND_URL` | Origine autorisée par CORS | `http://localhost:5173` |
| `VITE_API_URL` | URL de l'API consommée par le frontend | `http://localhost:3000/api` |

## Lancement local (Docker Compose)

```bash
# Copier les variables d'environnement
cp .env.example .env

# Démarrer tous les services (backend + frontend + postgres)
docker compose up --build

# Accès
# Frontend : http://localhost:5173
# Backend  : http://localhost:3000
# API docs : docs/openapi.yaml
```

**Compte admin par défaut :** `admin@ecommerce.com` / `admin123`

## Développement sans Docker

```bash
# Backend
cd src/backend
npm install
npm run dev      # port 3000

# Frontend
cd src/frontend
npm install
npm run dev      # port 5173
```

## Visualiser l'API (Swagger UI)

```bash
# Via Docker (pas d'installation nécessaire)
docker run -p 8080:8080 -e SWAGGER_JSON=/docs/openapi.yaml \
  -v $(pwd)/docs:/docs swaggerapi/swagger-ui

# Ouvrir http://localhost:8080
```

Ou importer `docs/openapi.yaml` directement sur [editor.swagger.io](https://editor.swagger.io).

## API

La spécification complète est dans [docs/openapi.yaml](docs/openapi.yaml) (format OpenAPI 3.0).

### Endpoints principaux

| Méthode | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | — | Créer un compte |
| POST | `/api/auth/login` | — | Se connecter |
| GET | `/api/auth/me` | JWT | Profil courant |
| GET | `/api/products` | — | Liste produits (filtres, pagination) |
| GET | `/api/products/:id` | — | Détail produit |
| POST | `/api/products` | Admin | Créer un produit |
| PUT | `/api/products/:id` | Admin | Modifier un produit |
| DELETE | `/api/products/:id` | Admin | Supprimer un produit |
| GET | `/api/users` | JWT | Liste utilisateurs |
| GET | `/api/health` | — | État du service + DB |
| GET | `/api/metrics` | — | Métriques applicatives |

### Authentification

Les routes protégées nécessitent un header :

```
Authorization: Bearer <token>
```

Le token est retourné par `/api/auth/login` et `/api/auth/register`.

## Tests

```bash
cd src/backend
npm test              # Jest avec coverage
npm run test:watch    # Mode watch
```

Couverture actuelle : ~91% statements.

## Infrastructure AWS (Terraform)

> Prérequis : créer manuellement le bucket S3 `ecommerce-terraform-state-tp10` avant le premier `terraform init`.

```bash
cd infrastructure/terraform

# Initialiser (télécharge providers, configure backend S3)
terraform init

# Vérifier le plan
terraform plan -var-file="terraform.tfvars"

# Déployer
terraform apply -var-file="terraform.tfvars"

# Détruire
terraform destroy -var-file="terraform.tfvars"
```

Copier `terraform.tfvars.example` → `terraform.tfvars` et remplir les valeurs sensibles (`db_username`, `db_password`, `jwt_secret`, `backend_image`, `frontend_image`).

### Ressources créées

- **VPC** : 2 sous-réseaux publics + 2 privés, NAT Gateway
- **ECR** : 2 registres Docker (backend, frontend)
- **RDS** : PostgreSQL 16 db.t3.micro, chiffré, backups 7 jours
- **ECS Fargate** : services backend (port 3000) et frontend (port 80)
- **ALB** : HTTP 80 — `/api/*` → backend, reste → frontend
- **SSM** : secrets DATABASE_URL et JWT_SECRET en SecureString
- **CloudWatch** : 6 alarmes + dashboard + log groups

## CI/CD (GitHub Actions)

Le pipeline `.github/workflows/` s'exécute à chaque push sur `main` :

1. **Tests** — `npm test` avec coverage
2. **Build Docker** — images backend et frontend
3. **Push ECR** — images taguées avec le SHA du commit
4. **Deploy ECS** — mise à jour des services via `aws ecs update-service`

### Secrets GitHub requis

```
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
AWS_REGION
ECR_REGISTRY
JWT_SECRET
DATABASE_URL
```

## Architecture et décisions techniques

### Schéma d'architecture

```
Internet
    │
    ▼
[ALB - port 80]
    ├── /api/*  ──► [ECS Fargate: Backend :3000]
    │                        │
    │                        ▼
    │               [RDS PostgreSQL 16]
    │               (sous-réseau privé)
    │
    └── /*      ──► [ECS Fargate: Frontend :80]
                     (Nginx servant les fichiers Vite)

[ECR] ──► images Docker pull par ECS
[SSM] ──► secrets injectés dans les containers ECS
[CloudWatch] ◄── logs & métriques des containers
[SNS] ──► alertes email
```

### Décisions techniques

**ECS Fargate vs EC2**
Fargate supprime la gestion des serveurs (patching OS, scaling du cluster EC2). Pour un TP, c'est le bon compromis : on déploie des containers sans gérer d'infrastructure sous-jacente.

**Terraform vs scripts AWS CLI**
Terraform rend l'infrastructure déclarative et versionnable. Un `terraform destroy` supprime proprement toutes les ressources sans oublier de dépendances. Le state en S3 permet le travail en équipe.

**Prisma vs SQL brut / autre ORM**
Prisma génère des types TypeScript depuis le schéma — les requêtes sont type-safe à la compilation, pas seulement à l'exécution. La migration `prisma migrate` est reproductible.

**JWT sans refresh token**
Pour simplifier le TP. En production, il faudrait ajouter un refresh token en base avec révocation possible.

**SSM Parameter Store pour les secrets**
Les secrets (DATABASE_URL, JWT_SECRET) ne sont jamais dans les variables d'environnement ECS en clair ni dans le code source. SSM SecureString chiffre avec KMS et l'accès est contrôlé par IAM.

**ALB listener rule `/api/*` → backend**
Un seul point d'entrée public (le DNS de l'ALB) pour les deux services. Le frontend peut appeler `/api/products` sans CORS puisque l'ALB est sur le même domaine.

**Nginx pour le frontend**
Le build Vite produit des fichiers statiques. Nginx les sert avec compression gzip et gère le routing SPA (`try_files $uri /index.html`).

## Monitoring

### Alarmes CloudWatch

| Alarme | Condition | Seuil |
|---|---|---|
| `backend-cpu-high` | CPU ECS backend | > 80% sur 2 min |
| `backend-tasks-zero` | Tasks ECS en cours | < 1 |
| `alb-5xx-high` | Erreurs 5xx ALB | > 10 / min |
| `alb-unhealthy-hosts` | Hosts unhealthy ALB | > 0 |
| `rds-connections-high` | Connexions RDS | > 80 |
| `rds-storage-low` | Stockage libre RDS | < 2 GB |

Les notifications sont envoyées par email via SNS (configurer `alert_email` dans `terraform.tfvars`).

### Métriques applicatives

L'endpoint `GET /api/metrics` expose en temps réel :
- Nombre de requêtes par route
- Durée moyenne de réponse
- Taux d'erreurs 4xx / 5xx
- Utilisation mémoire Node.js
