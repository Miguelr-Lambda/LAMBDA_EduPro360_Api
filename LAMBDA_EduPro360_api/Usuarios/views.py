from datetime import timedelta

from django.core.mail import send_mail
from django.shortcuts import get_object_or_404
from django.utils import timezone

from rest_framework import status
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import RecuperacionContrasena, Rol, Usuario
from .permisos import EsAdministrador, EsAdministradorODueno
from .serializers import (
    CambiarContrasenaSerializer,
    RecuperarContrasenaSerializer,
    RolSerializer,
    SolicitarRecuperacionSerializer,
    UsuarioActualizarSerializer,
    UsuarioCrearSerializer,
    UsuarioSerializer,
)


# ---------- Paginación sencilla ----------
class Paginador(PageNumberPagination):
    # permite ?page_size=10
    page_size_query_param = "page_size"


def paginar_queryset(request, queryset, serializer_class):
    paginator = Paginador()
    page = paginator.paginate_queryset(queryset, request)
    if page is not None:
        serializer = serializer_class(page, many=True)
        return paginator.get_paginated_response(serializer.data)
    serializer = serializer_class(queryset, many=True)
    return Response(serializer.data)


# ---------- Utilidades de correo ----------
def enviar_bienvenida(usuario):
    if not usuario.email:
        return
    send_mail(
        subject="¡Bienvenido a EduPro 360!",
        message=(
            f"Hola {usuario.first_name or usuario.username},\n\n"
            "Tu cuenta ha sido creada correctamente. "
            "Ya puedes iniciar sesión con tus credenciales.\n\n"
            "Equipo EduPro 360"
        ),
        from_email=None,
        recipient_list=[usuario.email],
        fail_silently=True,
    )


def enviar_confirmacion_cambio(usuario):
    if not usuario.email:
        return
    send_mail(
        subject="Cambio de contraseña",
        message=(
            f"Hola {usuario.first_name or usuario.username},\n\n"
            "Confirmamos que tu contraseña ha sido actualizada correctamente.\n\n"
            "Si no fuiste tú, comunícate con el administrador."
        ),
        from_email=None,
        recipient_list=[usuario.email],
        fail_silently=True,
    )


# ---------- Registro y recuperación de contraseña ----------

class RegistroUsuarioView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UsuarioCrearSerializer(data=request.data)
        if serializer.is_valid():
            usuario = serializer.save()
            enviar_bienvenida(usuario)
            # Generar tokens JWT (access + refresh) para el usuario creado
            refresh = RefreshToken.for_user(usuario)
            tokens = {"access": str(refresh.access_token), "refresh": str(refresh)}

            return Response(
                {"user": UsuarioSerializer(usuario).data, "tokens": tokens},
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class SolicitarRecuperacionView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = SolicitarRecuperacionSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        email = serializer.validated_data["email"]
        usuario = get_object_or_404(
            Usuario,
            email=email,
            activo=True,
            is_active=True,
        )

        token = RecuperacionContrasena.objects.create(
            usuario=usuario,
            expira_en=timezone.now() + timedelta(hours=1),
        )

        if usuario.email:
            send_mail(
                subject="Recupera tu contraseña",
                message=(
                    f"Hola {usuario.first_name or usuario.username},\n\n"
                    "Usa el siguiente token para restablecer tu contraseña durante la próxima hora:\n"
                    f"{token.token}\n\n"
                    "Si no solicitaste el cambio, ignora este mensaje."
                ),
                from_email=None,
                recipient_list=[usuario.email],
                fail_silently=True,
            )

        return Response(
            {"mensaje": "Se envió el enlace de recuperación"},
            status=status.HTTP_200_OK,
        )


class ConfirmarRecuperacionView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RecuperarContrasenaSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        token_valor = serializer.validated_data["token"]
        token = get_object_or_404(RecuperacionContrasena, token=token_valor)

        if not token.esta_vigente():
            return Response(
                {"detail": "Token inválido o expirado."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        usuario = token.usuario
        usuario.set_password(serializer.validated_data["nueva_contrasena"])
        usuario.save(update_fields=["password"])

        token.usado = True
        token.save(update_fields=["usado"])

        enviar_confirmacion_cambio(usuario)
        return Response({"ok": True}, status=status.HTTP_200_OK)


# ---------- Roles ----------

class RolListCreate(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = Rol.objects.all()
        return paginar_queryset(request, qs, RolSerializer)

    def post(self, request):
        serializer = RolSerializer(data=request.data)
        if serializer.is_valid():
            rol = serializer.save()
            return Response(
                RolSerializer(rol).data,
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class RolDetail(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        rol = get_object_or_404(Rol, pk=pk)
        return Response(RolSerializer(rol).data)

    def put(self, request, pk):
        rol = get_object_or_404(Rol, pk=pk)
        serializer = RolSerializer(rol, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        rol = get_object_or_404(Rol, pk=pk)
        serializer = RolSerializer(rol, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        rol = get_object_or_404(Rol, pk=pk)
        rol.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ---------- Usuarios CRUD ----------

class UsuarioListCreate(APIView):
    permission_classes = [IsAuthenticated, EsAdministrador]

    def get(self, request):
        qs = Usuario.objects.all().order_by("-fecha_creacion")
        return paginar_queryset(request, qs, UsuarioSerializer)

    def post(self, request):
        serializer = UsuarioCrearSerializer(data=request.data)
        if serializer.is_valid():
            usuario = serializer.save()
            enviar_bienvenida(usuario)
            # Generar tokens JWT (access + refresh) para el usuario creado por admin
            refresh = RefreshToken.for_user(usuario)
            tokens = {"access": str(refresh.access_token), "refresh": str(refresh)}

            return Response(
                {"user": UsuarioSerializer(usuario).data, "tokens": tokens},
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UsuarioDetail(APIView):
    permission_classes = [IsAuthenticated, EsAdministrador]

    def get(self, request, pk):
        usuario = get_object_or_404(Usuario, pk=pk)
        return Response(UsuarioSerializer(usuario).data)

    def put(self, request, pk):
        usuario = get_object_or_404(Usuario, pk=pk)
        serializer = UsuarioActualizarSerializer(usuario, data=request.data)
        if serializer.is_valid():
            usuario = serializer.save()
            return Response(UsuarioSerializer(usuario).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        usuario = get_object_or_404(Usuario, pk=pk)
        serializer = UsuarioActualizarSerializer(
            usuario,
            data=request.data,
            partial=True,
        )
        if serializer.is_valid():
            usuario = serializer.save()
            return Response(UsuarioSerializer(usuario).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        usuario = get_object_or_404(Usuario, pk=pk)
        usuario.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ---------- Activar / Desactivar ----------

class UsuarioActivar(APIView):
    permission_classes = [IsAuthenticated, EsAdministrador]

    def post(self, request, pk):
        usuario = get_object_or_404(Usuario, pk=pk)
        usuario.activo = True
        usuario.is_active = True
        usuario.save(update_fields=["activo", "is_active"])
        return Response(
            {"ok": True, "id": usuario.id, "activo": usuario.activo},
            status=status.HTTP_200_OK,
        )


class UsuarioDesactivar(APIView):
    permission_classes = [IsAuthenticated, EsAdministrador]

    def post(self, request, pk):
        usuario = get_object_or_404(Usuario, pk=pk)
        usuario.activo = False
        usuario.is_active = False
        usuario.save(update_fields=["activo", "is_active"])
        return Response(
            {"ok": True, "id": usuario.id, "activo": usuario.activo},
            status=status.HTTP_200_OK,
        )


# ---------- Cambiar contraseña ----------

class UsuarioCambiarContrasena(APIView):
    permission_classes = [IsAuthenticated, EsAdministradorODueno]

    def post(self, request, pk):
        usuario = get_object_or_404(Usuario, pk=pk)

        # Valida permiso por objeto (admin o dueño)
        self.check_object_permissions(request, usuario)

        serializer = CambiarContrasenaSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        if not usuario.check_password(serializer.validated_data["contrasena_actual"]):
            return Response(
                {"detail": "La contraseña actual no coincide."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        nueva = serializer.validated_data["nueva_contrasena"]
        usuario.set_password(nueva)
        usuario.save(update_fields=["password"])
        return Response({"ok": True}, status=status.HTTP_200_OK)


class UsuarioEnviarBienvenida(APIView):
    """
    Enviar (o simular) un correo de bienvenida a un usuario.
    """
    permission_classes = [IsAuthenticated, EsAdministrador]

    def post(self, request, pk):
        usuario = get_object_or_404(Usuario, pk=pk)

        if not usuario.email:
            return Response(
                {"detail": "El usuario no tiene email."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        enviar_bienvenida(usuario)
        return Response(
            {"ok": True, "mensaje": "Correo enviado"},
            status=status.HTTP_200_OK,
        )
