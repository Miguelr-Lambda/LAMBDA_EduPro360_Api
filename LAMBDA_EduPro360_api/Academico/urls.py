from django.urls import path

from . import views

urlpatterns = [
    path("asignaturas/", views.AsignaturaListCreate.as_view(), name="asignaturas_list"),
    path("asignaturas/<int:pk>/", views.AsignaturaDetail.as_view(), name="asignaturas_detail"),
    path("tareas/", views.TareaListCreate.as_view(), name="tareas_list"),
    path("tareas/<int:pk>/", views.TareaDetail.as_view(), name="tareas_detail"),
    path("entregas/", views.EntregaListCreate.as_view(), name="entregas_list"),
    path("entregas/<int:pk>/", views.EntregaDetail.as_view(), name="entregas_detail"),
    path("entregas/<int:pk>/calificar/", views.CalificarEntregaView.as_view(), name="entregas_calificar"),
    path("notas/", views.NotasEstudianteView.as_view(), name="notas_estudiante"),
    path("recordatorios/ejecutar/", views.EjecutarRecordatoriosView.as_view(), name="recordatorios_ejecutar"),
    path("reportes/mensual/", views.ReporteMensualView.as_view(), name="reporte_mensual"),
]