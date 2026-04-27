terraform {
  required_version = ">= 1.6"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket = "ecommerce-terraform-state-tp10"
    key    = "terraform.tfstate"
    region = "eu-west-3"
  }
}

provider "aws" {
  region = var.aws_region
}

data "aws_availability_zones" "available" {
  state = "available"
}
