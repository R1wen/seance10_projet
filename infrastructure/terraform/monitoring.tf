# --- SNS topic for alarm notifications ---

resource "aws_sns_topic" "alerts" {
  name = "${var.project_name}-alerts"

  tags = {
    Name        = "${var.project_name}-alerts"
    Environment = var.environment
  }
}

resource "aws_sns_topic_subscription" "email" {
  count     = var.alert_email != "" ? 1 : 0
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

# --- ECS: backend CPU too high ---

resource "aws_cloudwatch_metric_alarm" "backend_cpu_high" {
  alarm_name          = "${var.project_name}-backend-cpu-high"
  alarm_description   = "Backend ECS CPU usage exceeded 80%"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = 60
  statistic           = "Average"
  threshold           = 80

  dimensions = {
    ClusterName = aws_ecs_cluster.main.name
    ServiceName = aws_ecs_service.backend.name
  }

  alarm_actions = [aws_sns_topic.alerts.arn]
  ok_actions    = [aws_sns_topic.alerts.arn]

  tags = {
    Environment = var.environment
  }
}

# --- ECS: backend has 0 running tasks (crash) ---

resource "aws_cloudwatch_metric_alarm" "backend_tasks_zero" {
  alarm_name          = "${var.project_name}-backend-tasks-zero"
  alarm_description   = "Backend ECS service has no running tasks"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 1
  metric_name         = "RunningTaskCount"
  namespace           = "ECS/ContainerInsights"
  period              = 60
  statistic           = "Average"
  threshold           = 1

  dimensions = {
    ClusterName = aws_ecs_cluster.main.name
    ServiceName = aws_ecs_service.backend.name
  }

  alarm_actions = [aws_sns_topic.alerts.arn]

  tags = {
    Environment = var.environment
  }
}

# --- ALB: 5xx error rate too high ---

resource "aws_cloudwatch_metric_alarm" "alb_5xx_high" {
  alarm_name          = "${var.project_name}-alb-5xx-high"
  alarm_description   = "ALB 5xx error count exceeded threshold"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "HTTPCode_Target_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = 60
  statistic           = "Sum"
  threshold           = 10
  treat_missing_data  = "notBreaching"

  dimensions = {
    LoadBalancer = aws_lb.main.arn_suffix
  }

  alarm_actions = [aws_sns_topic.alerts.arn]

  tags = {
    Environment = var.environment
  }
}

# --- ALB: unhealthy backend targets ---

resource "aws_cloudwatch_metric_alarm" "alb_unhealthy_hosts" {
  alarm_name          = "${var.project_name}-alb-unhealthy-hosts"
  alarm_description   = "Backend has unhealthy hosts behind the ALB"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "UnHealthyHostCount"
  namespace           = "AWS/ApplicationELB"
  period              = 60
  statistic           = "Average"
  threshold           = 0
  treat_missing_data  = "notBreaching"

  dimensions = {
    LoadBalancer = aws_lb.main.arn_suffix
    TargetGroup  = aws_lb_target_group.backend.arn_suffix
  }

  alarm_actions = [aws_sns_topic.alerts.arn]

  tags = {
    Environment = var.environment
  }
}

# --- RDS: high DB connections ---

resource "aws_cloudwatch_metric_alarm" "rds_connections_high" {
  alarm_name          = "${var.project_name}-rds-connections-high"
  alarm_description   = "RDS connection count is too high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = 60
  statistic           = "Average"
  threshold           = 80

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.identifier
  }

  alarm_actions = [aws_sns_topic.alerts.arn]

  tags = {
    Environment = var.environment
  }
}

# --- RDS: low free storage ---

resource "aws_cloudwatch_metric_alarm" "rds_storage_low" {
  alarm_name          = "${var.project_name}-rds-storage-low"
  alarm_description   = "RDS free storage below 2GB"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 1
  metric_name         = "FreeStorageSpace"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 2147483648

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.identifier
  }

  alarm_actions = [aws_sns_topic.alerts.arn]

  tags = {
    Environment = var.environment
  }
}

# --- CloudWatch Dashboard ---

resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${var.project_name}-dashboard"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        width  = 12
        height = 6
        properties = {
          title   = "Backend CPU Utilization"
          region  = var.aws_region
          period  = 60
          stat    = "Average"
          metrics = [["AWS/ECS", "CPUUtilization", "ClusterName", aws_ecs_cluster.main.name, "ServiceName", aws_ecs_service.backend.name]]
        }
      },
      {
        type   = "metric"
        width  = 12
        height = 6
        properties = {
          title   = "ALB Request Count and 5xx Errors"
          region  = var.aws_region
          period  = 60
          stat    = "Sum"
          metrics = [
            ["AWS/ApplicationELB", "RequestCount", "LoadBalancer", aws_lb.main.arn_suffix],
            ["AWS/ApplicationELB", "HTTPCode_Target_5XX_Count", "LoadBalancer", aws_lb.main.arn_suffix]
          ]
        }
      },
      {
        type   = "metric"
        width  = 12
        height = 6
        properties = {
          title   = "ALB Target Response Time"
          region  = var.aws_region
          period  = 60
          stat    = "p99"
          metrics = [["AWS/ApplicationELB", "TargetResponseTime", "LoadBalancer", aws_lb.main.arn_suffix]]
        }
      },
      {
        type   = "metric"
        width  = 12
        height = 6
        properties = {
          title   = "RDS Connections"
          region  = var.aws_region
          period  = 60
          stat    = "Average"
          metrics = [["AWS/RDS", "DatabaseConnections", "DBInstanceIdentifier", aws_db_instance.main.identifier]]
        }
      },
      {
        type   = "metric"
        width  = 12
        height = 6
        properties = {
          title   = "RDS Free Storage"
          region  = var.aws_region
          period  = 60
          stat    = "Average"
          metrics = [["AWS/RDS", "FreeStorageSpace", "DBInstanceIdentifier", aws_db_instance.main.identifier]]
        }
      }
    ]
  })
}