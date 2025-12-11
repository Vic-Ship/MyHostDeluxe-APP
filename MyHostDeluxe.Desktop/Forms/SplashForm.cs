using System;
using System.Drawing;
using System.Windows.Forms;

namespace MyHostDeluxe.Desktop.Forms
{
    public partial class SplashForm : Form
    {
        private System.Windows.Forms.Timer timer;  // Especificar el tipo completo
        private ProgressBar progressBar;
        private Label statusLabel;

        public SplashForm()
        {
            InitializeComponent();
            SetupForm();
        }

        private void InitializeComponent()
        {
            this.SuspendLayout();
            
            // Form properties
            this.FormBorderStyle = FormBorderStyle.None;
            this.StartPosition = FormStartPosition.CenterScreen;
            this.BackColor = Color.FromArgb(33, 37, 41);
            this.Size = new Size(500, 300);
            
            // Logo/Title
            var titleLabel = new Label
            {
                Text = "MyHostDeluxe",
                Font = new Font("Segoe UI", 32, FontStyle.Bold),
                ForeColor = Color.White,
                AutoSize = true,
                Location = new Point(120, 50)
            };
            this.Controls.Add(titleLabel);
            
            // Subtitle
            var subtitleLabel = new Label
            {
                Text = "Desktop Application",
                Font = new Font("Segoe UI", 14),
                ForeColor = Color.FromArgb(108, 117, 125),
                AutoSize = true,
                Location = new Point(160, 110)
            };
            this.Controls.Add(subtitleLabel);
            
            // Progress bar
            progressBar = new ProgressBar
            {
                Style = ProgressBarStyle.Marquee,
                Location = new Point(50, 180),
                Size = new Size(400, 20),
                MarqueeAnimationSpeed = 30
            };
            this.Controls.Add(progressBar);
            
            // Status label
            statusLabel = new Label
            {
                Text = "Initializing application...",
                Font = new Font("Segoe UI", 10),
                ForeColor = Color.FromArgb(173, 181, 189),
                AutoSize = true,
                Location = new Point(50, 210)
            };
            this.Controls.Add(statusLabel);
            
            // Version label
            var versionLabel = new Label
            {
                Text = "v1.0.0",
                Font = new Font("Segoe UI", 8),
                ForeColor = Color.FromArgb(108, 117, 125),
                AutoSize = true,
                Location = new Point(430, 270)
            };
            this.Controls.Add(versionLabel);
            
            this.ResumeLayout(false);
        }

        private void SetupForm()
        {
            // Timer para simular carga
            timer = new System.Windows.Forms.Timer();  // Especificar aquí también
            timer.Interval = 2000; // 2 segundos
            timer.Tick += (s, e) =>
            {
                timer.Stop();
                this.Close();
            };
            timer.Start();
        }

        public void UpdateStatus(string message)
        {
            if (statusLabel.InvokeRequired)
            {
                statusLabel.Invoke(new Action<string>(UpdateStatus), message);
            }
            else
            {
                statusLabel.Text = message;
            }
        }
    }
}
