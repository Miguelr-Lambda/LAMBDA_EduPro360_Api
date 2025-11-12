from django.shortcuts import get_object_or_404
from django.core.mail import send_mail
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from rest_framework.pagination import PageNumberPagination

from .models import Usuario
from .serializers import (
    UsuarioSerializer, UsuarioCrearSerializer, UsuarioActualizarSerializer, CambiarContrasenaSerializer
)

# ---------- Utilidad de paginación ----------
class Paginador(PageNumberPagination):
    page_size_query_param = "page_size"  # permite ?page_size=10

def paginar_queryset(request, queryset, serializer_class):
    paginator = Paginador()
    page = paginator.paginate_queryset(queryset, request)
    serializer = serializer_class(page, many=True)
    return paginator.get_paginated_response(serializer.data)

# ---------- USUARIOS ----------
class UsuarioListCreate(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = Usuario.objects.all().order_by("-fecha_creacion")
        return paginar_queryset(request, qs, UsuarioSerializer)

    def post(self, request):
        ser = UsuarioCrearSerializer(data=request.data)
        if ser.is_valid():
            usuario = ser.save()
            return Response(UsuarioSerializer(usuario).data, status=status.HTTP_201_CREATED)
        return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)

class UsuarioDetail(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        obj = get_object_or_404(Usuario, pk=pk)
        return Response(UsuarioSerializer(obj).data)

    def put(self, request, pk):
        obj = get_object_or_404(Usuario, pk=pk)
        ser = UsuarioActualizarSerializer(obj, data=request.data)
        if ser.is_valid():
            ser.save()
            return Response(UsuarioSerializer(obj).data)
        return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        obj = get_object_or_404(Usuario, pk=pk)
        ser = UsuarioActualizarSerializer(obj, data=request.data, partial=True)
        if ser.is_valid():
            ser.save()
            return Response(UsuarioSerializer(obj).data)
        return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        obj = get_object_or_404(Usuario, pk=pk)
        obj.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

# ---------- Acciones: activar / desactivar ----------
class UsuarioActivar(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        obj = get_object_or_404(Usuario, pk=pk)
        obj.activo = True
        obj.is_active = True  # opcional, para login si luego usas auth
        obj.save(update_fields=["activo", "is_active"])
        return Response({"ok": True, "id": obj.id, "activo": obj.activo}, status=200)

class UsuarioDesactivar(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        obj = get_object_or_404(Usuario, pk=pk)
        obj.activo = False
        obj.is_active = False
        obj.save(update_fields=["activo", "is_active"])
        return Response({"ok": True, "id": obj.id, "activo": obj.activo}, status=200)

# ---------- Acción: cambiar contraseña ----------
class UsuarioCambiarContrasena(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        obj = get_object_or_404(Usuario, pk=pk)
        ser = CambiarContrasenaSerializer(data=request.data)
        if not ser.is_valid():
            return Response(ser.errors, status=400)

        nueva = ser.validated_data["nueva_contrasena"]
        obj.set_password(nueva)
        obj.save(update_fields=["password"])
        return Response({"ok": True}, status=200)

# ---------- Acción: enviar correo de bienvenida ----------
class UsuarioEnviarBienvenida(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        obj = get_object_or_404(Usuario, pk=pk)
        if not obj.email:
            return Response({"detail": "El usuario no tiene email."}, status=400)

        try:
            send_mail(
                subject="¡Bienvenido!",
                message=(
                    f"Hola {obj.first_name or obj.username},\n\n"
                    "Tu cuenta ha sido creada correctamente.\n\n"
                    "Saludos."
                ),
                from_email=None,  # usa DEFAULT_FROM_EMAIL si está configurado
                recipient_list=[obj.email],
                fail_silently=False,
            )
            return Response({"ok": True, "mensaje": "Correo enviado"}, status=200)
        except Exception as e:
            return Response({"ok": False, "error": str(e)}, status=500)
