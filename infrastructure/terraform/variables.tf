variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name used as prefix for all resources"
  type        = string
  default     = "ecommerce"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

# --- Networking ---

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

# --- Database ---

variable "db_username" {
  description = "RDS master username"
  type        = string
  sensitive   = true
}

variable "db_password" {
  description = "RDS master password"
  type        = string
  sensitive   = true
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

# --- ECS ---

variable "backend_image" {
  description = "Docker image for the backend (ECR URI:tag)"
  type        = string
}

variable "frontend_image" {
  description = "Docker image for the frontend (ECR URI:tag)"
  type        = string
}

variable "backend_cpu" {
  description = "CPU units for backend task (1 vCPU = 1024)"
  type        = number
  default     = 256
}

variable "backend_memory" {
  description = "Memory (MB) for backend task"
  type        = number
  default     = 512
}

variable "frontend_cpu" {
  description = "CPU units for frontend task"
  type        = number
  default     = 256
}

variable "frontend_memory" {
  description = "Memory (MB) for frontend task"
  type        = number
  default     = 512
}

variable "backend_desired_count" {
  description = "Number of backend task instances"
  type        = number
  default     = 1
}

variable "frontend_desired_count" {
  description = "Number of frontend task instances"
  type        = number
  default     = 1
}

# --- App secrets ---

variable "jwt_secret" {
  description = "JWT secret key for the backend"
  type        = string
  sensitive   = true
}
