using System;
using System.Windows.Forms;
using MyHostDeluxe.Desktop.Forms;
using MyHostDeluxe.Desktop.Utils;

namespace MyHostDeluxe.Desktop
{
    internal static class Program
    {
        [STAThread]
        static void Main()
        {
            // Configuración de aplicación
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            
            // Mostrar splash screen
            var splashForm = new SplashForm();
            splashForm.Show();
            Application.DoEvents();
            
            // Inicializar configuraciones
            ConfigManager.Initialize();
            
            // Cerrar splash y abrir main form
            splashForm.Close();
            Application.Run(new MainForm());
        }
    }
}
