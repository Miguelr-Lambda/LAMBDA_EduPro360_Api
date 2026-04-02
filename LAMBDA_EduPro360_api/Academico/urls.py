from django.urls import path

from . import views

urlpatterns = [
    # Asignaturas
    path("asignaturas/", views.AsignaturaListCreate.as_view(), name="asignaturas_list"),
    path("asignaturas/<int:pk>/", views.AsignaturaDetail.as_view(), name="asignaturas_detail"),
    path("asignaturas/<int:pk>/inscribir/", views.InscribirEstudiantesView.as_view(), name="asignaturas_inscribir"),
    path("asignaturas/<int:pk>/desinscribir/", views.DesinscribirEstudiantesView.as_view(), name="asignaturas_desinscribir"),
    path("asignaturas/<int:pk>/estudiantes/", views.ListarEstudiantesAsignaturaView.as_view(), name="asignaturas_estudiantes"),

    # Tareas
    path("tareas/", views.TareaListCreate.as_view(), name="tareas_list"),
    path("tareas/<int:pk>/", views.TareaDetail.as_view(), name="tareas_detail"),

    # Entregas
    path("entregas/", views.EntregaListCreate.as_view(), name="entregas_list"),
    path("entregas/<int:pk>/", views.EntregaDetail.as_view(), name="entregas_detail"),
    path("entregas/<int:pk>/calificar/", views.CalificarEntregaView.as_view(), name="entregas_calificar"),

    # Notas
    path("notas/", views.NotasEstudianteView.as_view(), name="notas_estudiante"),

    # Automatización
    path("recordatorios/ejecutar/", views.EjecutarRecordatoriosView.as_view(), name="recordatorios_ejecutar"),
    path("reportes/mensual/", views.ReporteMensualView.as_view(), name="reporte_mensual"),
]