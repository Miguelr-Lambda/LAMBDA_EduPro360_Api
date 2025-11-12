from django.db import models
from django.contrib.auth.models import AbstractUser

class Usuario(AbstractUser):
    """Usuario básico del sistema."""

    class Roles(models.TextChoices):
        ESTUDIANTE = "ESTUDIANTE", "Estudiante"
        DOCENTE = "DOCENTE", "Docente"
        ADMIN = "ADMIN", "Administrador"

    telefono = models.CharField("Teléfono", max_length=20, blank=True)
    rol = models.CharField("Rol", max_length=20, choices=Roles.choices, default=Roles.ESTUDIANTE)
    activo = models.BooleanField("Activo", default=True)
    fecha_creacion = models.DateTimeField("Fecha de creación", auto_now_add=True)

    class Meta:
        db_table = "usuarios"
        verbose_name = "Usuario"
        verbose_name_plural = "Usuarios"
        ordering = ["-fecha_creacion"]

    def __str__(self):
        return f"{self.get_full_name() or self.username} ({self.rol})"
