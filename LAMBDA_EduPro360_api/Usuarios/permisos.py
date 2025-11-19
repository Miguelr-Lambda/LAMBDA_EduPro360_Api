from rest_framework.permissions import BasePermission
from .models import Usuario


class EsAdministrador(BasePermission):
    """
    Permite el acceso solo a usuarios con rol ADMIN.
    """

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and getattr(user, "rol", None) == Usuario.Roles.ADMIN
        )


class EsAdministradorODueno(BasePermission):
    """
    Permite el acceso al ADMIN o al mismo usuario dueño del recurso.
    Útil para cosas tipo "cambiar mi propia contraseña" o "ver mi propio perfil".
    """

    def has_object_permission(self, request, view, obj):
        user = request.user
        # obj es una instancia de Usuario
        return bool(
            user
            and user.is_authenticated
            and (
                getattr(user, "rol", None) == Usuario.Roles.ADMIN
                or obj == user
            )
        )
