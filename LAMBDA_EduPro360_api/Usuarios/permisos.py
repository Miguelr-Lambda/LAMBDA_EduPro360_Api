from rest_framework.permissions import BasePermission


def _es_admin(user):
    """Valida si el usuario tiene un rol llamado "ADMIN" o es staff."""

    if not user or not user.is_authenticated:
        return False
    rol = getattr(user, "rol", None)
    return bool(user.is_staff or (rol and rol.nombre.upper() == "ADMIN"))

class EsAdministrador(BasePermission):
    """
    Permite el acceso solo a usuarios con rol ADMIN.
    """

    def has_permission(self, request, view):
        return _es_admin(request.user)


class EsAdministradorODueno(BasePermission):
    """
    Permite el acceso al ADMIN o al mismo usuario dueño del recurso.
    Útil para cosas tipo "cambiar mi propia contraseña" o "ver mi propio perfil".
    """

    def has_object_permission(self, request, view, obj):
        user = request.user
        return bool(user and user.is_authenticated and (_es_admin(user) or obj == user))


class PermisoEnRol(BasePermission):
    """Permiso configurable para validar una cadena en ``permisos_asignados`` del rol."""

    permiso_requerido: str | None = None

    def has_permission(self, request, view):
        if _es_admin(request.user):
            return True

        permiso = getattr(view, "permiso_requerido", None) or self.permiso_requerido
        rol = getattr(request.user, "rol", None)
        if not permiso or not rol:
            return False

        permisos = rol.permisos_asignados or []
        return permiso in permisos
       
