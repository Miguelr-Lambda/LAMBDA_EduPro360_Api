from django.db import models
from django.utils import timezone

from Usuarios.models import Usuario


class Asignatura(models.Model):
    ESTADOS_CHOICES = (("ACTIVA", "Activa"), ("INACTIVA", "Inactiva"))

    nombre = models.CharField(max_length=150)
    codigo = models.CharField(max_length=50, unique=True)
    descripcion = models.TextField(blank=True)
    estado = models.CharField(max_length=15, choices=ESTADOS_CHOICES, default="ACTIVA")
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    docente_responsable = models.ForeignKey(
        Usuario, related_name="asignaturas_dirigidas", on_delete=models.PROTECT
    )
    periodo_academico = models.CharField(max_length=50)
    estudiantes = models.ManyToManyField(Usuario, related_name="asignaturas_inscritas", blank=True)

    class Meta:
        ordering = ["nombre"]

    def __str__(self):
        return f"{self.nombre} ({self.codigo})"


class Tarea(models.Model):
    TIPOS = (("TAREA", "Tarea"), ("EXAMEN", "Examen"))
    ESTADOS = (("ACTIVA", "Activa"), ("INACTIVA", "Inactiva"))

    asignatura = models.ForeignKey(Asignatura, related_name="tareas", on_delete=models.CASCADE)
    titulo = models.CharField(max_length=150)
    descripcion = models.TextField()
    fecha_publicacion = models.DateField(default=timezone.now)
    fecha_vencimiento = models.DateField()
    peso_porcentual = models.DecimalField(max_digits=5, decimal_places=2)
    tipo_tarea = models.CharField(max_length=20, choices=TIPOS)
    estado = models.CharField(max_length=15, choices=ESTADOS, default="ACTIVA")

    class Meta:
        ordering = ["-fecha_publicacion"]

    def __str__(self):
        return f"{self.titulo} - {self.asignatura.nombre}"


class Entrega(models.Model):
    ESTADOS_ENTREGA = (("PENDIENTE", "Pendiente"), ("ENTREGADO", "Entregado"))
    ESTADOS_CALIFICACION = (("SIN_CALIFICAR", "Sin calificar"), ("CALIFICADO", "Calificado"))

    tarea = models.ForeignKey(Tarea, related_name="entregas", on_delete=models.CASCADE)
    estudiante = models.ForeignKey(Usuario, related_name="entregas", on_delete=models.CASCADE)
    archivo_entrega = models.CharField(max_length=255)
    comentarios_estudiante = models.TextField(blank=True)
    fecha_entrega = models.DateTimeField(auto_now_add=True)
    estado_entrega = models.CharField(max_length=15, choices=ESTADOS_ENTREGA, default="ENTREGADO")
    nota = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    retroalimentacion_docente = models.TextField(blank=True)
    fecha_calificacion = models.DateTimeField(null=True, blank=True)
    estado_calificacion = models.CharField(max_length=20, choices=ESTADOS_CALIFICACION, default="SIN_CALIFICAR")

    class Meta:
        unique_together = ("tarea", "estudiante")

    def __str__(self):
        return f"Entrega {self.estudiante.username} - {self.tarea.titulo}"


class RecordatorioTarea(models.Model):
    TIPOS = (("3_DIAS", "Tres días antes"), ("1_DIA", "Un día antes"))

    tarea = models.ForeignKey(Tarea, related_name="recordatorios", on_delete=models.CASCADE)
    tipo_recordatorio = models.CharField(max_length=10, choices=TIPOS)
    fecha_programada = models.DateTimeField()
    enviado = models.BooleanField(default=False)
    fecha_envio = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ("tarea", "tipo_recordatorio")

    def __str__(self):
        return f"Recordatorio {self.tarea.titulo} {self.tipo_recordatorio}"


class ReporteMensual(models.Model):
    periodo = models.CharField(max_length=20)
    datos = models.JSONField()
    fecha_generacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-fecha_generacion"]

    def __str__(self):
        return f"Reporte {self.periodo}"