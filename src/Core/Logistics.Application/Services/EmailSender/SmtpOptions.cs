﻿namespace Logistics.Application.Services;

internal class SmtpOptions
{
    public string? SenderEmail { get; set; }
    public string? SenderName { get; set; }
    public string? UserName { get; set; }
    public string? Password { get; set; }
    public string? Host { get; set; }
    public int Port { get; set; } = 587;
}
