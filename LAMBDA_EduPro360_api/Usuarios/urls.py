from django.urls import path
from . import views

urlpatterns = [
    # Auth
    path("auth/login/", views.LoginEmailView.as_view(), name="auth_login"),
    path("auth/registro/", views.RegistroUsuarioView.as_view(), name="auth_registro"),
    path("auth/me/", views.PerfilActualView.as_view(), name="auth_me"),
    path("auth/recuperar/", views.SolicitarRecuperacionView.as_view(), name="auth_recuperar"),
    path("auth/recuperar/confirmar/", views.ConfirmarRecuperacionView.as_view(), name="auth_recuperar_confirmar"),

    # Roles
    path("roles/", views.RolListCreate.as_view(), name="roles_list"),
    path("roles/<int:pk>/", views.RolDetail.as_view(), name="roles_detail"),

    # CRUD
    path("Usuarios/", views.UsuarioListCreate.as_view(), name="usuario_list_create"),
    path("Usuarios/<int:pk>/", views.UsuarioDetail.as_view(), name="usuario_detail"),

    # Acciones
    path("Usuarios/<int:pk>/activar/", views.UsuarioActivar.as_view(), name="usuario_activar"),
    path("Usuarios/<int:pk>/desactivar/", views.UsuarioDesactivar.as_view(), name="usuario_desactivar"),
    path("Usuarios/<int:pk>/cambiar-contrasena/", views.UsuarioCambiarContrasena.as_view(), name="usuario_cambiar_contrasena"),
    path("Usuarios/<int:pk>/enviar-bienvenida/", views.UsuarioEnviarBienvenida.as_view(), name="usuario_enviar_bienvenida"),
]
