using System;
using System.IO;

namespace MyHostDeluxe.Desktop.Utils
{
    public static class Logger
    {
        private static readonly string LogDirectory = Path.Combine(
            AppDomain.CurrentDomain.BaseDirectory, "Logs");
        private static readonly string LogFilePath = Path.Combine(
            LogDirectory, $"app_{DateTime.Now:yyyyMMdd}.log");

        static Logger()
        {
            if (!Directory.Exists(LogDirectory))
                Directory.CreateDirectory(LogDirectory);
        }

        public static void LogInfo(string message)
        {
            Log("INFO", message);
        }

        public static void LogWarning(string message)
        {
            Log("WARN", message);
        }

        public static void LogError(string message)
        {
            Log("ERROR", message);
        }

        public static void LogDebug(string message)
        {
            Log("DEBUG", message);
        }

        private static void Log(string level, string message)
        {
            try
            {
                var logMessage = $"{DateTime.Now:yyyy-MM-dd HH:mm:ss} [{level}] {message}";
                
                // Console output
                Console.WriteLine(logMessage);
                
                // File output
                File.AppendAllText(LogFilePath, logMessage + Environment.NewLine);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Logger error: {ex.Message}");
            }
        }
    }
}
