from datetime import datetime, timedelta

from datetime import datetime, timedelta

from django.core.mail import send_mail
from django.db.models import Avg, Q, Sum
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from Usuarios.models import Usuario
from Usuarios.permisos import PermisoEnRol, _es_admin
from .models import Asignatura, Entrega, RecordatorioTarea, ReporteMensual, Tarea
from .tasks import enviar_recordatorios_vencimiento, generar_reporte_mensual
from .serializers import (
    AsignaturaSerializer,
    CalificarEntregaSerializer,
    EntregaSerializer,
    GenerarReporteSerializer,
    TareaSerializer,
)


def _enviar_correo(asunto, mensaje, destinatarios):
    if not destinatarios:
        return
    send_mail(asunto, mensaje, None, destinatarios, fail_silently=True)


def _notificar_docente_asignatura(asignatura):
    docente = asignatura.docente_responsable
    if docente and docente.email:
        _enviar_correo(
            "Nueva asignatura asignada",
            f"Hola {docente.first_name or docente.username}, ahora eres responsable de {asignatura.nombre}.",
            [docente.email],
        )


def _notificar_estudiantes_tarea(tarea):
    estudiantes = tarea.asignatura.estudiantes.exclude(email="")
    correos = [alumno.email for alumno in estudiantes if alumno.email]
    _enviar_correo(
        "Nueva actividad publicada",
        (
            f"Se publicó {tarea.titulo} en la asignatura {tarea.asignatura.nombre}.\n"
            f"Vence el {tarea.fecha_vencimiento}."
        ),
        correos,
    )


def _notificar_docente_entrega(entrega):
    docente = entrega.tarea.asignatura.docente_responsable
    if docente and docente.email:
        _enviar_correo(
            "Nueva entrega registrada",
            (
                f"El estudiante {entrega.estudiante.get_full_name() or entrega.estudiante.username} "
                f"envió la tarea {entrega.tarea.titulo}."
            ),
            [docente.email],
        )


def _notificar_estudiante_calificacion(entrega):
    estudiante = entrega.estudiante
    if estudiante.email:
        _enviar_correo(
            "Calificación publicada",
            (
                f"Tu entrega de {entrega.tarea.titulo} fue calificada con {entrega.nota}.\n"
                f"Retroalimentación: {entrega.retroalimentacion_docente or 'Sin comentarios.'}"
            ),
            [estudiante.email],
        )


def _programar_recordatorios(tarea):
    for dias, tipo in ((3, "3_DIAS"), (1, "1_DIA")):
        fecha_envio = datetime.combine(tarea.fecha_vencimiento - timedelta(days=dias), datetime.min.time())
        if timezone.is_naive(fecha_envio):
            fecha_envio = timezone.make_aware(fecha_envio, timezone.get_current_timezone())
        if fecha_envio < timezone.now():
            continue
        RecordatorioTarea.objects.update_or_create(
            tarea=tarea,
            tipo_recordatorio=tipo,
            defaults={"fecha_programada": fecha_envio, "enviado": False, "fecha_envio": None},
        )


def _promedio_acumulado(asignatura: Asignatura, estudiante: Usuario) -> float:
    """Calcula el promedio ponderado del estudiante en la asignatura."""

    tareas = asignatura.tareas.all()
    promedio = 0
    for tarea in tareas:
        entrega = Entrega.objects.filter(tarea=tarea, estudiante=estudiante).first()
        if entrega and entrega.nota is not None:
            promedio += float(entrega.nota) * float(tarea.peso_porcentual) / 100
    return round(promedio, 2) if tareas else 0


def _tiene_permiso(usuario: Usuario, permiso: str) -> bool:
    rol = getattr(usuario, "rol", None)
    permisos = rol.permisos_asignados if rol else []
    return bool(_es_admin(usuario) or (permiso in permisos))


class AsignaturaListCreate(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = Asignatura.objects.select_related("docente_responsable").all()
        serializer = AsignaturaSerializer(qs, many=True)
        return Response(serializer.data)

    def post(self, request):
        if not _tiene_permiso(request.user, "crear_asignatura"):
            return Response(
                {"detail": "No tienes permiso para crear asignaturas."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = AsignaturaSerializer(data=request.data)
        if serializer.is_valid():
            asignatura = serializer.save()
            _notificar_docente_asignatura(asignatura)
            return Response(AsignaturaSerializer(asignatura).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AsignaturaDetail(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        asignatura = get_object_or_404(Asignatura, pk=pk)
        return Response(AsignaturaSerializer(asignatura).data)

    def put(self, request, pk):
        asignatura = get_object_or_404(Asignatura, pk=pk)
        serializer = AsignaturaSerializer(asignatura, data=request.data)
        if serializer.is_valid():
            asignatura = serializer.save()
            return Response(AsignaturaSerializer(asignatura).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        asignatura = get_object_or_404(Asignatura, pk=pk)
        serializer = AsignaturaSerializer(asignatura, data=request.data, partial=True)
        if serializer.is_valid():
            asignatura = serializer.save()
            return Response(AsignaturaSerializer(asignatura).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        Asignatura.objects.filter(pk=pk).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class TareaListCreate(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        asignatura_id = request.query_params.get("asignatura")
        qs = Tarea.objects.select_related("asignatura").all()
        if asignatura_id:
            qs = qs.filter(asignatura_id=asignatura_id)
        serializer = TareaSerializer(qs, many=True)
        return Response(serializer.data)

    def post(self, request):
        if not _tiene_permiso(request.user, "crear_tarea"):
            return Response(
                {"detail": "No tienes permiso para crear tareas."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = TareaSerializer(data=request.data)
        if serializer.is_valid():
            tarea = serializer.save()
            _programar_recordatorios(tarea)
            _notificar_estudiantes_tarea(tarea)
            return Response(TareaSerializer(tarea).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class TareaDetail(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        tarea = get_object_or_404(Tarea.objects.select_related("asignatura"), pk=pk)
        return Response(TareaSerializer(tarea).data)

    def put(self, request, pk):
        tarea = get_object_or_404(Tarea, pk=pk)
        if tarea.estado != "ACTIVA":
            return Response({"detail": "Solo se pueden editar tareas activas."}, status=status.HTTP_400_BAD_REQUEST)

        serializer = TareaSerializer(tarea, data=request.data)
        if serializer.is_valid():
            tarea = serializer.save()
            _programar_recordatorios(tarea)
            return Response(TareaSerializer(tarea).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        tarea = get_object_or_404(Tarea, pk=pk)
        if tarea.estado != "ACTIVA":
            return Response({"detail": "Solo se pueden editar tareas activas."}, status=status.HTTP_400_BAD_REQUEST)

        serializer = TareaSerializer(tarea, data=request.data, partial=True)
        if serializer.is_valid():
            tarea = serializer.save()
            _programar_recordatorios(tarea)
            return Response(TareaSerializer(tarea).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        tarea = get_object_or_404(Tarea, pk=pk)
        if tarea.estado != "ACTIVA":
            return Response({"detail": "Solo se pueden eliminar tareas activas."}, status=status.HTTP_400_BAD_REQUEST)

        tarea.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class EntregaListCreate(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        tarea_id = request.query_params.get("tarea")
        qs = Entrega.objects.select_related("tarea", "estudiante")
        if tarea_id:
            qs = qs.filter(tarea_id=tarea_id)
        serializer = EntregaSerializer(qs, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = EntregaSerializer(data=request.data)
        if serializer.is_valid():
            entrega = serializer.save()
            _notificar_docente_entrega(entrega)
            return Response(EntregaSerializer(entrega).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class EntregaDetail(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        entrega = get_object_or_404(Entrega.objects.select_related("tarea", "estudiante"), pk=pk)
        return Response(EntregaSerializer(entrega).data)

    def delete(self, request, pk):
        Entrega.objects.filter(pk=pk).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class CalificarEntregaView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        entrega = get_object_or_404(Entrega, pk=pk)

        if not _tiene_permiso(request.user, "calificar_tarea"):
            return Response(
                {"detail": "No tienes permiso para calificar entregas."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = CalificarEntregaSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        entrega.nota = serializer.validated_data["nota"]
        entrega.retroalimentacion_docente = serializer.validated_data.get("retroalimentacion_docente", "")
        entrega.fecha_calificacion = timezone.now()
        entrega.estado_calificacion = "CALIFICADO"
        entrega.save(update_fields=["nota", "retroalimentacion_docente", "fecha_calificacion", "estado_calificacion"])
        _notificar_estudiante_calificacion(entrega)
        datos = EntregaSerializer(entrega).data
        datos["promedio_acumulado"] = _promedio_acumulado(entrega.tarea.asignatura, entrega.estudiante)
        return Response(datos)


class NotasEstudianteView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        usuario = request.user
        asignatura_id = request.query_params.get("asignatura")
        periodo = request.query_params.get("periodo")
        if not asignatura_id and not periodo:
            return Response(
                {"detail": "Debe indicar la asignatura o el periodo académico."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        asignaturas = Asignatura.objects.all()
        if asignatura_id:
            asignaturas = asignaturas.filter(pk=asignatura_id)
        if periodo:
            asignaturas = asignaturas.filter(periodo_academico=periodo)

        if not _es_admin(usuario):
            asignaturas = asignaturas.filter(Q(estudiantes=usuario) | Q(docente_responsable=usuario)).distinct()

        if not asignaturas.exists():
            return Response({"detail": "No tienes asignaturas con esos filtros."}, status=status.HTTP_404_NOT_FOUND)

        respuesta = []
        for asignatura in asignaturas:
            tareas = asignatura.tareas.order_by("fecha_vencimiento")
            resultado = []
            for tarea in tareas:
                entrega = Entrega.objects.filter(tarea=tarea, estudiante=usuario).first()
                nota = entrega.nota if entrega else None
                retro = entrega.retroalimentacion_docente if entrega else ""
                estado = entrega.estado_calificacion if entrega else "SIN_CALIFICAR"
                resultado.append(
                    {
                        "titulo": tarea.titulo,
                        "tipo_tarea": tarea.tipo_tarea,
                        "nota": nota,
                        "peso_porcentual": tarea.peso_porcentual,
                        "retroalimentacion_docente": retro,
                        "estado_calificacion": estado,
                    }
                )

            respuesta.append(
                {
                    "asignatura": asignatura.nombre,
                    "periodo": asignatura.periodo_academico,
                    "tareas": resultado,
                    "promedio_general": _promedio_acumulado(asignatura, usuario),
                }
            )

        return Response(respuesta if len(respuesta) > 1 else respuesta[0])


class EjecutarRecordatoriosView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        tarea_celery = enviar_recordatorios_vencimiento.delay()
        return Response({"programado": True, "task_id": str(tarea_celery.id)})


class ReporteMensualView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = GenerarReporteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        periodo = serializer.validated_data.get("periodo")
        if not periodo:
            ahora = timezone.now()
            periodo = f"{ahora.year}-{ahora.month:02d}"

        tarea_celery = generar_reporte_mensual.delay(periodo)
        return Response({"programado": True, "periodo": periodo, "task_id": str(tarea_celery.id)}, status=status.HTTP_202_ACCEPTED)