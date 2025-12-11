using System;
using System.IO;

namespace MyHostDeluxe.Desktop.Utils
{
    public static class ConfigManager
    {
        private static readonly string ConfigFilePath = Path.Combine(
            AppDomain.CurrentDomain.BaseDirectory, "Assets", "Config", "app.config");
        
        public static string ApiBaseUrl { get; private set; }
        public static string WebUIPath { get; private set; }
        public static string AuthToken { get; set; }
        public static int UserId { get; set; }
        public static string UserRole { get; set; }

        public static void Initialize()
        {
            ApiBaseUrl = "http://localhost:3001/api";
            WebUIPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Assets", "WebUI");
            CreateDirectoryStructure();
            LoadConfiguration();
        }

        private static void CreateDirectoryStructure()
        {
            var directories = new[]
            {
                Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Assets"),
                Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Assets", "Config"),
                Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Assets", "Images"),
                Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Assets", "WebUI"),
                Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Assets", "WebUI", "login"),
                Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Assets", "WebUI", "admin"),
                Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Assets", "WebUI", "agent"),
                Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Assets", "WebUI", "shared"),
                Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Logs")
            };

            foreach (var dir in directories)
            {
                if (!Directory.Exists(dir))
                    Directory.CreateDirectory(dir);
            }
        }

        private static void LoadConfiguration()
        {
            try
            {
                if (File.Exists(ConfigFilePath))
                {
                    var lines = File.ReadAllLines(ConfigFilePath);
                    foreach (var line in lines)
                    {
                        if (string.IsNullOrWhiteSpace(line) || line.StartsWith("#"))
                            continue;

                        var parts = line.Split('=');
                        if (parts.Length == 2)
                        {
                            var key = parts[0].Trim();
                            var value = parts[1].Trim();

                            switch (key)
                            {
                                case "ApiBaseUrl":
                                    ApiBaseUrl = value;
                                    break;
                                case "WebUIPath":
                                    WebUIPath = value;
                                    break;
                            }
                        }
                    }
                }
                else
                {
                    CreateDefaultConfig();
                }
            }
            catch (Exception ex)
            {
                Logger.LogError($"Error loading configuration: {ex.Message}");
            }
        }

        private static void CreateDefaultConfig()
        {
            var defaultConfig = @"# MyHostDeluxe Desktop Configuration
# ==================================

# API Configuration
ApiBaseUrl=http://localhost:3001/api

# Web UI Path (relative to application directory)
WebUIPath=Assets\WebUI

# Logging
LogLevel=Debug
LogToFile=true

# Application Settings
AppTitle=MyHostDeluxe Desktop
AppVersion=1.0.0
MaximizeOnStart=false
CheckForUpdates=true";

            File.WriteAllText(ConfigFilePath, defaultConfig);
        }

        public static void SaveConfiguration()
        {
            try
            {
                var config = $@"# MyHostDeluxe Desktop Configuration
ApiBaseUrl={ApiBaseUrl}
WebUIPath={WebUIPath}
UserToken={AuthToken}
UserId={UserId}
UserRole={UserRole}";

                File.WriteAllText(ConfigFilePath, config);
            }
            catch (Exception ex)
            {
                Logger.LogError($"Error saving configuration: {ex.Message}");
            }
        }
    }
}
