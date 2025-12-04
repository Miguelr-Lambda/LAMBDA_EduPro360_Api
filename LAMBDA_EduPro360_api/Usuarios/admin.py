from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import RecuperacionContrasena, Rol, Usuario

@admin.register(Usuario)
class UsuarioAdmin(UserAdmin):
    list_display = ("username", "first_name", "last_name", "email", "rol", "activo", "is_staff", "fecha_creacion")
    list_filter = ("rol", "activo", "is_staff", "is_superuser")
    search_fields = ("username", "first_name", "last_name", "email")
    ordering = ("-fecha_creacion",)

    fieldsets = (
        ("Datos de acceso", {"fields": ("username", "password")}),
        ("Información personal", {"fields": ("first_name", "last_name", "email", "telefono")}),
        ("Rol y estado", {"fields": ("rol", "activo")}),
        ("Permisos", {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
        ("Fechas", {"fields": ("last_login", "date_joined", "fecha_creacion")}),
    )

    readonly_fields = ("fecha_creacion",)

@admin.register(Rol)
class RolAdmin(admin.ModelAdmin):
    list_display = ("nombre", "fecha_creacion")
    search_fields = ("nombre",)


@admin.register(RecuperacionContrasena)
class RecuperacionContrasenaAdmin(admin.ModelAdmin):
    list_display = ("usuario", "token", "expira_en", "usado")
    list_filter = ("usado",)
    search_fields = ("usuario__username", "token")
