resource "azurerm_storage_account" "storage" {
  name                     = var.storage_account_name
  resource_group_name      = var.resource_group_name
  location                 = var.location
  account_tier             = var.account_tier
  account_replication_type = var.account_replication_type

  https_traffic_only_enabled = var.https_traffic_only_enabled
  min_tls_version            = var.min_tls_version

  tags = merge(
    var.tags,
    {
      "Name" = var.storage_account_name
    }
  )
}
