from django.urls import path
from . import views

urlpatterns = [
    # CRUD
    path("Usuarios/", views.UsuarioListCreate.as_view(), name="usuario_list_create"),
    path("Usuarios/<int:pk>/", views.UsuarioDetail.as_view(), name="usuario_detail"),

    # Acciones
    path("Usuarios/<int:pk>/activar/", views.UsuarioActivar.as_view(), name="usuario_activar"),
    path("Usuarios/<int:pk>/desactivar/", views.UsuarioDesactivar.as_view(), name="usuario_desactivar"),
    path("Usuarios/<int:pk>/cambiar-contrasena/", views.UsuarioCambiarContrasena.as_view(), name="usuario_cambiar_contrasena"),
    path("Usuarios/<int:pk>/enviar-bienvenida/", views.UsuarioEnviarBienvenida.as_view(), name="usuario_enviar_bienvenida"),
]
