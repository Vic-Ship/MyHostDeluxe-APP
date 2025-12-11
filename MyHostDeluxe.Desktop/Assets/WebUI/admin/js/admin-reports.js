// admin-reports.js - Funciones para reportes
class AdminReports {
    constructor() {
        this.currentReport = null;
    }

    init() {
        console.log('Inicializando módulo de reportes...');
        this.setupReportForm();
        this.populateDateSelectors();
    }

    setupReportForm() {
        const form = document.getElementById('form-reporte');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.generateReport();
            });
        }

        const exportBtn = document.getElementById('btnExportarReporte');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportReport());
        }
    }

    populateDateSelectors() {
        // Llenar selector de meses
        const monthSelect = document.getElementById('selectMes');
        if (monthSelect) {
            const months = [
                'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
            ];
            
            months.forEach((month, index) => {
                const option = document.createElement('option');
                option.value = index + 1;
                option.textContent = month;
                monthSelect.appendChild(option);
            });
            
            // Establecer mes actual como seleccionado
            const currentMonth = new Date().getMonth();
            monthSelect.value = currentMonth + 1;
        }

        // Llenar selector de años
        const yearSelect = document.getElementById('selectAnio');
        if (yearSelect) {
            const currentYear = new Date().getFullYear();
            for (let year = currentYear; year >= currentYear - 5; year--) {
                const option = document.createElement('option');
                option.value = year;
                option.textContent = year;
                yearSelect.appendChild(option);
            }
            yearSelect.value = currentYear;
        }
    }

    async generateReport() {
        const formData = new FormData(document.getElementById('form-reporte'));
        const reportData = Object.fromEntries(formData.entries());
        
        console.log('Generando reporte con:', reportData);
        
        // Mostrar loader
        this.showReportLoader(true);
        
        try {
            // Simular generación de reporte
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            this.currentReport = this.createMockReport(reportData);
            this.displayReport(this.currentReport);
            
        } catch (error) {
            console.error('Error generando reporte:', error);
            if (window.adminApp) {
                window.adminApp.mostrarToast('Error generando reporte', 'error');
            }
        } finally {
            this.showReportLoader(false);
        }
    }

    createMockReport(data) {
        return {
            title: `Reporte de ${data.tipoReporte} - ${data.mesReporte}/${data.anioReporte}`,
            generatedAt: new Date().toLocaleString(),
            summary: {
                totalProjects: 156,
                totalRevenue: 45280,
                activeAgents: 23,
                completionRate: '78%'
            },
            details: [
                { metric: 'Proyectos Completados', value: 42, change: '+12%' },
                { metric: 'Ingresos Totales', value: '$15,800', change: '+8%' },
                { metric: 'Nuevos Clientes', value: 28, change: '+5%' },
                { metric: 'Tasa de Retención', value: '92%', change: '+2%' }
            ]
        };
    }

    displayReport(report) {
        const reportContent = document.getElementById('reportContent');
        const initialMessage = document.getElementById('reportInitialMessage');
        
        if (!reportContent || !initialMessage) return;
        
        initialMessage.style.display = 'none';
        reportContent.classList.remove('hidden');
        
        reportContent.innerHTML = `
            <div class="report-header">
                <h4>${report.title}</h4>
                <p class="text-gray-600">Generado: ${report.generatedAt}</p>
            </div>
            
            <div class="report-summary">
                <h5>Resumen Ejecutivo</h5>
                <div class="summary-cards">
                    <div class="summary-card">
                        <div class="summary-value">${report.summary.totalProjects}</div>
                        <div class="summary-label">Proyectos Totales</div>
                    </div>
                    <div class="summary-card">
                        <div class="summary-value">$${report.summary.totalRevenue.toLocaleString()}</div>
                        <div class="summary-label">Ingresos</div>
                    </div>
                    <div class="summary-card">
                        <div class="summary-value">${report.summary.activeAgents}</div>
                        <div class="summary-label">Agentes Activos</div>
                    </div>
                    <div class="summary-card">
                        <div class="summary-value">${report.summary.completionRate}</div>
                        <div class="summary-label">Tasa de Completación</div>
                    </div>
                </div>
            </div>
            
            <div class="report-details">
                <h5>Métricas Detalladas</h5>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Métrica</th>
                            <th>Valor</th>
                            <th>Cambio vs Mes Anterior</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${report.details.map(item => `
                            <tr>
                                <td>${item.metric}</td>
                                <td><strong>${item.value}</strong></td>
                                <td><span class="${item.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}">${item.change}</span></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    exportReport() {
        if (!this.currentReport) {
            if (window.adminApp) {
                window.adminApp.mostrarToast('No hay reporte para exportar', 'warning');
            }
            return;
        }

        // Crear un workbook de Excel
        const wb = XLSX.utils.book_new();
        
        // Crear hoja de resumen
        const wsSummary = XLSX.utils.aoa_to_sheet([
            [this.currentReport.title],
            [`Generado: ${this.currentReport.generatedAt}`],
            [],
            ['Métrica', 'Valor', 'Cambio vs Mes Anterior'],
            ...this.currentReport.details.map(item => [item.metric, item.value, item.change])
        ]);
        
        XLSX.utils.book_append_sheet(wb, wsSummary, 'Reporte');
        
        // Exportar
        const fileName = `Reporte_${new Date().toISOString().slice(0,10)}.xlsx`;
        XLSX.writeFile(wb, fileName);
        
        if (window.adminApp) {
            window.adminApp.mostrarToast('Reporte exportado exitosamente', 'success');
        }
    }

    showReportLoader(show) {
        const loader = document.getElementById('reportLoading');
        const reportContent = document.getElementById('reportContent');
        
        if (loader) loader.classList.toggle('hidden', !show);
        if (reportContent && show) reportContent.classList.add('hidden');
    }
}

window.adminReports = new AdminReports();
