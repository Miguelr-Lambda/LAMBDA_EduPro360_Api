from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
import secrets

class Rol(models.Model):
    """Rol simple con la lista de permisos que habilita."""

    nombre = models.CharField(max_length=100, unique=True)
    permisos_asignados = models.JSONField(default=list, blank=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Rol"
        verbose_name_plural = "Roles"
        ordering = ["nombre"]

    def __str__(self):
        return self.nombre
    
class Usuario(AbstractUser):
    """Usuario básico del sistema."""

    telefono = models.CharField("Teléfono", max_length=20, blank=True)
    
    rol = models.ForeignKey(
        Rol,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="usuarios",
    )
    activo = models.BooleanField("Activo", default=True)
    fecha_creacion = models.DateTimeField("Fecha de creación", auto_now_add=True)

    class Meta:
        db_table = "usuarios"
        verbose_name = "Usuario"
        verbose_name_plural = "Usuarios"
        ordering = ["-fecha_creacion"]

    def __str__(self):
        rol_nombre = self.rol.nombre if self.rol else "Sin rol"
        return f"{self.get_full_name() or self.username} ({rol_nombre})"


class RecuperacionContrasena(models.Model):
    """Token temporal para recuperación de contraseña."""

    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name="tokens_recuperacion")
    token = models.CharField(max_length=255, unique=True, default=secrets.token_urlsafe)
    expira_en = models.DateTimeField()
    usado = models.BooleanField(default=False)
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Recuperación de contraseña"
        verbose_name_plural = "Recuperaciones de contraseñas"

    def esta_vigente(self):
        return (not self.usado) and timezone.now() <= self.expira_en
