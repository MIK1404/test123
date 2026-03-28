resource_group_name      = "my-resource-group"
location                 = "East US"
storage_account_name     = "mystorageaccount001"
account_tier             = "Standard"
account_replication_type = "LRS"
https_traffic_only_enabled = true
min_tls_version          = "TLS1_2"
environment              = "dev"

tags = {
  "Environment" = "Development"
  "ManagedBy"   = "Terraform"
  "Project"     = "StorageAccount"
}
