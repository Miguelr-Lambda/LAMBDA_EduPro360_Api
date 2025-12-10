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
        usuario = request.user
        qs = Asignatura.objects.select_related("docente_responsable").all()

        # Admin ve todas las asignaturas
        if _es_admin(usuario):
            serializer = AsignaturaSerializer(qs, many=True)
            return Response(serializer.data)

        # Docente ve solo sus asignaturas asignadas
        if _tiene_permiso(usuario, "ver_asignaturas_propias"):
            qs = qs.filter(docente_responsable=usuario)
            serializer = AsignaturaSerializer(qs, many=True)
            return Response(serializer.data)

        # Estudiante ve solo asignaturas donde está inscrito
        if _tiene_permiso(usuario, "ver_asignaturas_inscritas"):
            qs = qs.filter(estudiantes=usuario)
            serializer = AsignaturaSerializer(qs, many=True)
            return Response(serializer.data)

        return Response({"detail": "No tienes permiso para ver asignaturas."}, status=status.HTTP_403_FORBIDDEN)

    def post(self, request):
        # Solo Admin puede crear asignaturas
        if not _tiene_permiso(request.user, "crear_asignatura"):
            return Response(
                {"detail": "Solo los administradores pueden crear asignaturas."},
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
        usuario = request.user

        # Verificar que el usuario tenga permiso para ver esta asignatura
        if not _es_admin(usuario):
            # Docente: solo puede ver si es el docente responsable
            if _tiene_permiso(usuario, "ver_asignaturas_propias") and asignatura.docente_responsable != usuario:
                return Response({"detail": "No tienes permiso para ver esta asignatura."}, status=status.HTTP_403_FORBIDDEN)
            # Estudiante: solo puede ver si está inscrito
            if _tiene_permiso(usuario, "ver_asignaturas_inscritas") and not asignatura.estudiantes.filter(pk=usuario.pk).exists():
                return Response({"detail": "No tienes permiso para ver esta asignatura."}, status=status.HTTP_403_FORBIDDEN)

        return Response(AsignaturaSerializer(asignatura).data)

    def put(self, request, pk):
        # Solo Admin puede editar asignaturas
        if not _tiene_permiso(request.user, "editar_asignatura"):
            return Response(
                {"detail": "Solo los administradores pueden editar asignaturas."},
                status=status.HTTP_403_FORBIDDEN,
            )
        asignatura = get_object_or_404(Asignatura, pk=pk)
        serializer = AsignaturaSerializer(asignatura, data=request.data)
        if serializer.is_valid():
            asignatura = serializer.save()
            return Response(AsignaturaSerializer(asignatura).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        # Solo Admin puede editar asignaturas
        if not _tiene_permiso(request.user, "editar_asignatura"):
            return Response(
                {"detail": "Solo los administradores pueden editar asignaturas."},
                status=status.HTTP_403_FORBIDDEN,
            )
        asignatura = get_object_or_404(Asignatura, pk=pk)
        serializer = AsignaturaSerializer(asignatura, data=request.data, partial=True)
        if serializer.is_valid():
            asignatura = serializer.save()
            return Response(AsignaturaSerializer(asignatura).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        # Solo Admin puede eliminar asignaturas
        if not _tiene_permiso(request.user, "eliminar_asignatura"):
            return Response(
                {"detail": "Solo los administradores pueden eliminar asignaturas."},
                status=status.HTTP_403_FORBIDDEN,
            )
        Asignatura.objects.filter(pk=pk).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class TareaListCreate(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        usuario = request.user
        asignatura_id = request.query_params.get("asignatura")
        qs = Tarea.objects.select_related("asignatura").all()

        if asignatura_id:
            qs = qs.filter(asignatura_id=asignatura_id)

        # Admin ve todas las tareas
        if _es_admin(usuario):
            serializer = TareaSerializer(qs, many=True)
            return Response(serializer.data)

        # Docente ve tareas de sus asignaturas
        if _tiene_permiso(usuario, "ver_tareas"):
            qs = qs.filter(asignatura__docente_responsable=usuario)
            serializer = TareaSerializer(qs, many=True)
            return Response(serializer.data)

        # Estudiante ve tareas de sus asignaturas inscritas
        if _tiene_permiso(usuario, "ver_tareas_propias"):
            qs = qs.filter(asignatura__estudiantes=usuario)
            serializer = TareaSerializer(qs, many=True)
            return Response(serializer.data)

        return Response({"detail": "No tienes permiso para ver tareas."}, status=status.HTTP_403_FORBIDDEN)

    def post(self, request):
        usuario = request.user

        # Solo Admin y Docente pueden crear tareas
        if not _tiene_permiso(usuario, "crear_tarea"):
            return Response(
                {"detail": "Solo administradores y docentes pueden crear tareas."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = TareaSerializer(data=request.data)
        if serializer.is_valid():
            asignatura_id = serializer.validated_data.get("asignatura").id

            # Si es docente, verificar que sea responsable de la asignatura
            if not _es_admin(usuario):
                asignatura = Asignatura.objects.filter(pk=asignatura_id, docente_responsable=usuario).first()
                if not asignatura:
                    return Response(
                        {"detail": "Solo puedes crear tareas en asignaturas donde eres docente responsable."},
                        status=status.HTTP_403_FORBIDDEN,
                    )

            tarea = serializer.save()
            _programar_recordatorios(tarea)
            _notificar_estudiantes_tarea(tarea)
            return Response(TareaSerializer(tarea).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class TareaDetail(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        tarea = get_object_or_404(Tarea.objects.select_related("asignatura"), pk=pk)
        if tarea.estado != "ACTIVA":
            return Response({"detail": "Solo se pueden editar tareas activas."}, status=status.HTTP_400_BAD_REQUEST)
        return Response(TareaSerializer(tarea).data)

    def put(self, request, pk):
        tarea = get_object_or_404(Tarea, pk=pk)
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
        usuario = request.user
        entrega = get_object_or_404(Entrega, pk=pk)

        # Solo docentes pueden calificar
        if not _tiene_permiso(usuario, "calificar_tarea"):
            return Response(
                {"detail": "Solo los docentes pueden calificar entregas."},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Verificar que el docente sea responsable de la asignatura (a menos que sea admin)
        if not _es_admin(usuario):
            if entrega.tarea.asignatura.docente_responsable != usuario:
                return Response(
                    {"detail": "Solo puedes calificar entregas de tus asignaturas."},
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
        # Permitir que se especifique el estudiante solo si es admin o docente
        estudiante_id = request.query_params.get("estudiante")
        asignatura_id = request.query_params.get("asignatura")
        periodo = request.query_params.get("periodo")

        # Determinar qué estudiante consultar
        if estudiante_id:
            # Solo admin y docentes pueden consultar notas de otros estudiantes
            if not (_es_admin(usuario) or _tiene_permiso(usuario, "ver_estudiantes_asignatura")):
                return Response(
                    {"detail": "No tienes permiso para ver calificaciones de otros estudiantes."},
                    status=status.HTTP_403_FORBIDDEN,
                )
            estudiante = get_object_or_404(Usuario, pk=estudiante_id)
        else:
            # Si no se especifica, el estudiante es el usuario actual
            estudiante = usuario

        # Si es estudiante común, solo puede ver sus propias calificaciones
        if not _es_admin(usuario) and not _tiene_permiso(usuario, "ver_estudiantes_asignatura"):
            if estudiante != usuario:
                return Response(
                    {"detail": "Solo puedes ver tus propias calificaciones."},
                    status=status.HTTP_403_FORBIDDEN,
                )

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

        # Filtrar asignaturas según el rol
        if not _es_admin(usuario):
            # Docentes pueden ver asignaturas donde son responsables
            if _tiene_permiso(usuario, "ver_estudiantes_asignatura"):
                asignaturas = asignaturas.filter(docente_responsable=usuario)
            # Estudiantes solo ven sus asignaturas inscritas
            else:
                asignaturas = asignaturas.filter(estudiantes=estudiante)

        if not asignaturas.exists():
            return Response({"detail": "No hay asignaturas con esos filtros."}, status=status.HTTP_404_NOT_FOUND)

        respuesta = []
        for asignatura in asignaturas:
            tareas = asignatura.tareas.order_by("fecha_vencimiento")
            resultado = []
            for tarea in tareas:
                entrega = Entrega.objects.filter(tarea=tarea, estudiante=estudiante).first()
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
                    "promedio_general": _promedio_acumulado(asignatura, estudiante),
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

        