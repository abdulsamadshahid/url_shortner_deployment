# URL Shortener — DevOps Deployment Project

A containerized URL Shortener application deployed using **Docker, AWS, Terraform, and GitHub Actions**.

This project was built as a hands-on DevOps deployment project to practice containerization, infrastructure provisioning, CI/CD automation, cloud deployment, and troubleshooting.

---

## 🚀 Project Overview

The application allows users to enter a long URL and generate a shortened URL.

The application consists of two services:

* **Frontend** — React + Vite application served through Nginx
* **Backend** — Node.js + Express REST API

The application is containerized with Docker and deployed to AWS infrastructure provisioned using Terraform.

A GitHub Actions workflow automates the deployment process whenever changes are pushed to the main branch.

---

## 🏗️ Architecture

```text
                         Developer
                            │
                            │ git push
                            ▼
                    ┌─────────────────┐
                    │     GitHub      │
                    │   Repository    │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ GitHub Actions  │
                    │     CI/CD       │
                    └────────┬────────┘
                             │
                  ┌──────────┴──────────┐
                  │                     │
                  ▼                     ▼
           Build Frontend        Build Backend
             Docker Image          Docker Image
                  │                     │
                  └──────────┬──────────┘
                             │
                             ▼
                       Amazon ECR
                             │
                             │ Pull images
                             ▼
                    ┌─────────────────┐
                    │    AWS EC2      │
                    │                 │
                    │ ┌─────────────┐ │
                    │ │   Nginx     │ │
                    │ │  Frontend   │ │
                    │ └──────┬──────┘ │
                    │        │         │
                    │        ▼         │
                    │ ┌─────────────┐ │
                    │ │   Node.js   │ │
                    │ │   Backend   │ │
                    │ └─────────────┘ │
                    │                 │
                    │ Docker          │
                    └─────────────────┘

              Infrastructure provisioned
                    using Terraform
```

---

## 🛠️ Tech Stack

### Application

* React
* Vite
* Nginx
* Node.js
* Express.js

### DevOps

* Docker
* Docker Compose
* Git
* GitHub
* GitHub Actions
* AWS
* Amazon EC2
* Amazon ECR
* Terraform
* Linux
* Shell scripting

### AWS

* EC2
* ECR
* VPC
* Subnet
* Security Group
* IAM
* IAM Role
* GitHub Actions OIDC

---

## 📁 Project Structure

```text
url_shortner_deployment/
│
├── .github/
│   └── workflows/
│       └── workflow.yml
│
├── url-shortener/
│   ├── frontend/
│   │   ├── src/
│   │   ├── Dockerfile
│   │   ├── nginx.conf
│   │   └── ...
│   │
│   ├── backend/
│   │   ├── src/
│   │   ├── Dockerfile
│   │   └── ...
│   │
│   └── docker-compose.yml
│
└── README.md
```

---

# 🔄 CI/CD Pipeline

The deployment pipeline is triggered when code is pushed to the `main` branch.

```text
Git Push
   │
   ▼
GitHub Actions
   │
   ├── Checkout repository
   │
   ├── Authenticate with AWS
   │
   ├── Login to Amazon ECR
   │
   ├── Build frontend Docker image
   │
   ├── Build backend Docker image
   │
   ├── Push images to ECR
   │
   ├── Connect to EC2 through SSH
   │
   ├── Pull latest images
   │
   └── Restart application containers
```

This removes the need to manually build and deploy the application after every change.

---

# 🐳 Docker

The application is split into separate containers.

### Frontend

The React application is built using Vite and served using Nginx.

```text
React/Vite
    │
    ▼
Production Build
    │
    ▼
Nginx
    │
    ▼
Port 80
```

### Backend

The backend runs as a Node.js/Express container.

```text
Node.js
   │
   ▼
Express API
   │
   ▼
Port 5000
```

Docker Compose is used to manage the application services.

---

# ☁️ AWS Infrastructure

The infrastructure required for the deployment is provisioned using Terraform.

The environment includes:

* VPC
* Public subnet
* Internet connectivity
* EC2 instance
* Security Group
* Amazon ECR repositories
* IAM permissions
* IAM role for GitHub Actions

The goal is to avoid manually creating infrastructure through the AWS console.

---

# 🏗️ Infrastructure as Code

Terraform is used to define the AWS infrastructure.

Instead of manually configuring AWS resources, the infrastructure can be created from configuration files.

Typical workflow:

```bash
terraform init
terraform plan
terraform apply
```

To remove the infrastructure:

```bash
terraform destroy
```

---

# 🔐 GitHub Actions → AWS Authentication

The CI/CD pipeline uses **GitHub Actions OIDC** to authenticate with AWS.

Instead of storing long-lived AWS access keys inside GitHub Secrets, GitHub Actions assumes an AWS IAM role using an OIDC trust relationship.

```text
GitHub Actions
      │
      │ OIDC Token
      ▼
AWS STS
      │
      │ Assume Role
      ▼
IAM Role
      │
      ▼
AWS Resources
```

This provides temporary AWS credentials during the workflow.

---

# 🖥️ Running Locally

## Prerequisites

Make sure the following are installed:

* Docker
* Docker Compose
* Git
* Node.js (for development)

Clone the repository:

```bash
git clone https://github.com/abdulsamadshahid/url_shortner_deployment.git
```

Navigate into the application:

```bash
cd url_shortner_deployment/url-shortener
```

Start the application:

```bash
docker compose up --build
```

The frontend should then be available at:

```text
http://localhost:3000
```

The backend runs on:

```text
http://localhost:5000
```

---

# 🧪 Health Checks

Both services include health-check functionality to help verify that containers are operating correctly.

Example backend health endpoint:

```text
/health
```

Health checks were also useful during deployment troubleshooting to identify container networking and service availability issues.

---

# 🔧 Troubleshooting Experience

This project was intentionally used as a practical troubleshooting exercise rather than simply following a deployment tutorial.

Issues encountered and resolved included:

* Docker container health-check failures
* `localhost` / IPv6 container networking behavior
* Frontend Nginx connectivity issues
* Backend health-check configuration
* Docker build and rebuild problems
* Container-to-container communication
* AWS deployment configuration
* ECR authentication
* EC2 Docker permissions
* GitHub Actions deployment failures

The debugging process involved inspecting container status, logs, health checks, networking, and deployment configuration.

---

# 📚 What I Practiced

This project helped strengthen practical experience with:

* Containerizing applications
* Writing Dockerfiles
* Docker Compose
* Nginx
* Linux administration
* AWS EC2
* Amazon ECR
* VPC networking
* Security Groups
* IAM
* IAM roles
* GitHub Actions
* CI/CD pipelines
* GitHub OIDC authentication
* Terraform
* Infrastructure as Code
* SSH-based deployment
* Application troubleshooting
* Container health checks

---

# 🎯 Project Goal

The primary goal of this project was not to build a production-scale URL shortening service.

The goal was to practice the **DevOps lifecycle of taking an application from source code to a running cloud deployment**:

```text
Application
     ↓
Docker
     ↓
AWS Infrastructure
     ↓
Terraform
     ↓
ECR
     ↓
GitHub Actions
     ↓
Automated Deployment
     ↓
Running Application
```

This project is part of my hands-on DevOps learning portfolio.

---

## 👨‍💻 Author

**Abdul Samad Shahid**

GitHub: [abdulsamadshahid](https://github.com/abdulsamadshahid)

---

## 📌 Future Improvements

Possible future improvements include:

* HTTPS with a custom domain
* AWS Application Load Balancer
* Route 53
* Automated infrastructure deployment through Terraform
* Improved monitoring and logging
* Kubernetes deployment
* More advanced CI/CD strategies
* Infrastructure and application security improvements
