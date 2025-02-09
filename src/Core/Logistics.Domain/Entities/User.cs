﻿using Logistics.Domain.Core;
using Microsoft.AspNetCore.Identity;

namespace Logistics.Domain.Entities;

public class User : IdentityUser, IEntity<string>, IAuditableEntity
{
    public string FirstName { get; set; } = null!;
    public string LastName { get; set; } = null!;
    public string JoinedTenantIds { get; set; } = string.Empty;
    public DateTime Created { get; set; } = DateTime.UtcNow;
    public string? CreatedBy { get; set; }
    public DateTime? LastModified { get; set; }
    public string? LastModifiedBy { get; set; }

    public void JoinTenant(string tenantId)
    {
        var tenantIds = JoinedTenantIds.Split(',');

        if (tenantIds.Contains(tenantId))
            return;

        JoinedTenantIds = string.IsNullOrEmpty(JoinedTenantIds) ?
            string.Join(',', tenantId) : string.Join(',', JoinedTenantIds, tenantId);
    }

    public void RemoveTenant(string tenantId)
    {
        JoinedTenantIds = JoinedTenantIds.Replace($",{tenantId}", "")
            .Replace(tenantId, "");
    }

    public string GetFullName()
    {
        return string.Join(" ", FirstName, LastName);
    }

    public string[] GetJoinedTenantIds()
    {
        return string.IsNullOrEmpty(JoinedTenantIds) ? [] : JoinedTenantIds.Split(',');
    }
}
