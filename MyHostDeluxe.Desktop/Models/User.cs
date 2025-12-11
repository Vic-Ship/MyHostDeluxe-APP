using System;

namespace MyHostDeluxe.Desktop.Models
{
    public class User
    {
        public int UsuarioID { get; set; }
        public string NombreUsuario { get; set; }
        public string CorreoElectronico { get; set; }
        public int RolID { get; set; }
        public string RolNombre { get; set; }
        public bool EstaActivo { get; set; }
        public DateTime? UltimoInicioSesion { get; set; }
        public DateTime CreadoEn { get; set; }
    }
}
