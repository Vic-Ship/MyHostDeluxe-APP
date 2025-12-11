using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;
using System;
using System.Drawing;
using System.Windows.Forms;
using MyHostDeluxe.Desktop.Utils;
using System.IO;
using Newtonsoft.Json.Linq;

namespace MyHostDeluxe.Desktop.Forms
{
    public partial class MainForm : Form
    {
        private string currentUser;
        private string currentRole;

        public MainForm()
        {
            InitializeComponent();
            InitializeWebView();
        }

        private async void InitializeWebView()
        {
            try
            {
                Logger.LogInfo("Initializing WebView2...");

                // Configurar entorno WebView2
                var userDataFolder = Path.Combine(
                    Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                    "MyHostDeluxe",
                    "WebView2");

                var environment = await CoreWebView2Environment.CreateAsync(
                    userDataFolder: userDataFolder);

                await webView.EnsureCoreWebView2Async(environment);

                // Configurar WebView2
                webView.CoreWebView2.Settings.IsScriptEnabled = true;
                webView.CoreWebView2.Settings.AreDefaultScriptDialogsEnabled = true;
                webView.CoreWebView2.Settings.IsWebMessageEnabled = true;
                webView.CoreWebView2.Settings.AreDevToolsEnabled = true;

                // Configurar eventos
                webView.CoreWebView2.WebMessageReceived += WebView_WebMessageReceived;
                webView.CoreWebView2.NavigationStarting += WebView_NavigationStarting;

                // Navegar a la página de login
                NavigateToLogin();

                Logger.LogInfo("WebView2 initialized successfully");
            }
            catch (Exception ex)
            {
                Logger.LogError($"Error initializing WebView2: {ex.Message}");
                MessageBox.Show($"Error initializing WebView2: {ex.Message}. " +
                    "Make sure WebView2 Runtime is installed.",
                    "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        private void WebView_WebMessageReceived(object sender, CoreWebView2WebMessageReceivedEventArgs e)
        {
            try
            {
                var message = e.TryGetWebMessageAsString();
                Logger.LogDebug($"WebMessage received: {message}");

                var json = JObject.Parse(message);
                var action = json["action"]?.ToString();

                switch (action)
                {
                    case "login":
                        HandleLogin(json);
                        break;
                    
                    case "logout":
                        HandleLogout();
                        break;
                    
                    case "navigate":
                        var page = json["page"]?.ToString();
                        NavigateToPage(page);
                        break;
                    
                    default:
                        Logger.LogWarning($"Unknown action: {action}");
                        break;
                }
            }
            catch (Exception ex)
            {
                Logger.LogError($"Error processing web message: {ex.Message}");
            }
        }

        private void WebView_NavigationStarting(object sender, CoreWebView2NavigationStartingEventArgs e)
        {
            // Puedes agregar lógica de navegación aquí si es necesario
        }

        private void HandleLogin(JObject loginData)
        {
            try
            {
                var userData = loginData["userData"]?.ToObject<JObject>();
                var token = loginData["token"]?.ToString();

                if (userData != null)
                {
                    currentUser = userData["email"]?.ToString();
                    currentRole = userData["role"]?.ToString() ?? userData["frontendRole"]?.ToString();

                    // Guardar en configuración
                    ConfigManager.AuthToken = token;
                    ConfigManager.UserId = userData["id"]?.Value<int>() ?? 0;
                    ConfigManager.UserRole = currentRole;

                    Logger.LogInfo($"User logged in: {currentUser} ({currentRole})");

                    // Navegar al dashboard según el rol
                    if (currentRole == "admin" || currentRole == "administrador")
                    {
                        NavigateToAdminDashboard();
                    }
                    else if (currentRole == "agent" || currentRole == "agente")
                    {
                        NavigateToAgentDashboard();
                    }
                    else
                    {
                        MessageBox.Show("Rol no reconocido", "Error", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                    }
                }
            }
            catch (Exception ex)
            {
                Logger.LogError($"Error handling login: {ex.Message}");
            }
        }

        private void HandleLogout()
        {
            try
            {
                Logger.LogInfo($"User logging out: {currentUser}");
                
                // Limpiar configuración
                ConfigManager.AuthToken = null;
                ConfigManager.UserId = 0;
                ConfigManager.UserRole = null;
                
                currentUser = null;
                currentRole = null;
                
                // Navegar de vuelta al login
                NavigateToLogin();
            }
            catch (Exception ex)
            {
                Logger.LogError($"Error handling logout: {ex.Message}");
            }
        }

        private void NavigateToPage(string page)
        {
            switch (page?.ToLower())
            {
                case "admin":
                    NavigateToAdminDashboard();
                    break;
                case "agent":
                    NavigateToAgentDashboard();
                    break;
                case "login":
                    NavigateToLogin();
                    break;
                default:
                    Logger.LogWarning($"Unknown page requested: {page}");
                    break;
            }
        }

        private void NavigateToLogin()
        {
            var loginPath = Path.Combine(ConfigManager.WebUIPath, "login", "index.html");
            if (File.Exists(loginPath))
            {
                webView.CoreWebView2.Navigate($"file:///{loginPath.Replace('\\', '/')}");
            }
            else
            {
                Logger.LogError("Login page not found");
                MessageBox.Show("Login page not found. Please check WebUI installation.", 
                    "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        private void NavigateToAdminDashboard()
        {
            var adminPath = Path.Combine(ConfigManager.WebUIPath, "admin", "index.html");
            if (File.Exists(adminPath))
            {
                webView.CoreWebView2.Navigate($"file:///{adminPath.Replace('\\', '/')}");
            }
            else
            {
                Logger.LogError("Admin dashboard not found");
                MessageBox.Show("Admin dashboard not found. Please check WebUI installation.", 
                    "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        private void NavigateToAgentDashboard()
        {
            var agentPath = Path.Combine(ConfigManager.WebUIPath, "agent", "index.html");
            if (File.Exists(agentPath))
            {
                webView.CoreWebView2.Navigate($"file:///{agentPath.Replace('\\', '/')}");
            }
            else
            {
                Logger.LogError("Agent dashboard not found");
                MessageBox.Show("Agent dashboard not found. Please check WebUI installation.", 
                    "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        protected override void OnFormClosing(FormClosingEventArgs e)
        {
            try
            {
                // Guardar configuración al cerrar
                ConfigManager.SaveConfiguration();
                Logger.LogInfo("Application closing...");
            }
            catch (Exception ex)
            {
                Logger.LogError($"Error during shutdown: {ex.Message}");
            }

            base.OnFormClosing(e);
        }
    }
}



