variable "location" {
    type        = string
    description = "Azure region for resources."
    default     = "eastus"
}

variable "resource_group_name" {
    type        = string
    description = "Name of the resource group."
}

variable "tags" {
    type        = map(string)
    description = "Common resource tags."
    default     = {}
}