from datetime import datetime, timedelta

from django.core.mail import send_mail
from django.db.models import Avg
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from Usuarios.models import Usuario
from .models import Asignatura, Entrega, RecordatorioTarea, ReporteMensual, Tarea
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


class AsignaturaListCreate(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = Asignatura.objects.select_related("docente_responsable").all()
        serializer = AsignaturaSerializer(qs, many=True)
        return Response(serializer.data)

    def post(self, request):
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
        serializer = TareaSerializer(tarea, data=request.data)
        if serializer.is_valid():
            tarea = serializer.save()
            _programar_recordatorios(tarea)
            return Response(TareaSerializer(tarea).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        tarea = get_object_or_404(Tarea, pk=pk)
        serializer = TareaSerializer(tarea, data=request.data, partial=True)
        if serializer.is_valid():
            tarea = serializer.save()
            _programar_recordatorios(tarea)
            return Response(TareaSerializer(tarea).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        Tarea.objects.filter(pk=pk).delete()
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
        serializer = CalificarEntregaSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        entrega.nota = serializer.validated_data["nota"]
        entrega.retroalimentacion_docente = serializer.validated_data.get("retroalimentacion_docente", "")
        entrega.fecha_calificacion = timezone.now()
        entrega.estado_calificacion = "CALIFICADO"
        entrega.save(update_fields=["nota", "retroalimentacion_docente", "fecha_calificacion", "estado_calificacion"])
        _notificar_estudiante_calificacion(entrega)
        return Response(EntregaSerializer(entrega).data)


class NotasEstudianteView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        usuario = request.user
        asignatura_id = request.query_params.get("asignatura")
        if not asignatura_id:
            return Response({"detail": "Debe indicar la asignatura."}, status=status.HTTP_400_BAD_REQUEST)

        asignatura = get_object_or_404(Asignatura, pk=asignatura_id)
        pertenece = asignatura.estudiantes.filter(pk=usuario.pk).exists()
        if (
            usuario != asignatura.docente_responsable
            and not usuario.is_staff
            and not pertenece
        ):
            return Response({"detail": "No tienes acceso a esta asignatura."}, status=status.HTTP_403_FORBIDDEN)

        tareas = asignatura.tareas.order_by("fecha_vencimiento")
        resultado = []
        promedio = 0
        for tarea in tareas:
            entrega = Entrega.objects.filter(tarea=tarea, estudiante=usuario).first()
            nota = entrega.nota if entrega else None
            retro = entrega.retroalimentacion_docente if entrega else ""
            estado = entrega.estado_calificacion if entrega else "SIN_CALIFICAR"
            if nota is not None:
                promedio += float(nota) * float(tarea.peso_porcentual) / 100
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
        response = {
            "tareas": resultado,
            "promedio_general": round(promedio, 2) if resultado else 0,
        }
        return Response(response)


class EjecutarRecordatoriosView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        enviados = 0
        pendientes = RecordatorioTarea.objects.filter(enviado=False, fecha_programada__lte=timezone.now())
        for recordatorio in pendientes:
            tarea = recordatorio.tarea
            estudiantes = tarea.asignatura.estudiantes.exclude(email="")
            correos = [al.email for al in estudiantes if al.email]
            if recordatorio.tipo_recordatorio == "1_DIA":
                docente = tarea.asignatura.docente_responsable
                if docente and docente.email:
                    correos.append(docente.email)
            if correos:
                _enviar_correo(
                    "Recordatorio de tarea",
                    f"La tarea {tarea.titulo} vence el {tarea.fecha_vencimiento}.",
                    correos,
                )
                recordatorio.enviado = True
                recordatorio.fecha_envio = timezone.now()
                recordatorio.save(update_fields=["enviado", "fecha_envio"])
                enviados += 1
        return Response({"recordatorios_enviados": enviados})


class ReporteMensualView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = GenerarReporteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        periodo = serializer.validated_data.get("periodo")
        if not periodo:
            ahora = timezone.now()
            periodo = f"{ahora.year}-{ahora.month:02d}"

        datos = []
        asignaturas = Asignatura.objects.all()
        peores = []
        mejores_docentes = []
        for asignatura in asignaturas:
            entregas = Entrega.objects.filter(tarea__asignatura=asignatura, estado_calificacion="CALIFICADO")
            promedio = entregas.aggregate(avg=Avg("nota"))['avg'] or 0
            total_estudiantes = asignatura.estudiantes.count()
            reprobados = entregas.filter(nota__lt=3).count()
            total_calificadas = entregas.count() or 1
            tasa_aprobacion = 100 - ((reprobados / total_calificadas) * 100)
            tareas_pendientes = asignatura.tareas.filter(fecha_vencimiento__gte=timezone.now().date()).count()
            datos.append(
                {
                    "asignatura": asignatura.nombre,
                    "periodo": periodo,
                    "total_estudiantes": total_estudiantes,
                    "promedio_general": round(float(promedio), 2),
                    "tasa_aprobacion": round(tasa_aprobacion, 2),
                    "tareas_pendientes": tareas_pendientes,
                }
            )
            peores.append((asignatura.nombre, reprobados))
            if promedio:
                mejores_docentes.append((asignatura.docente_responsable.get_full_name() or asignatura.docente_responsable.username, promedio))

        peores.sort(key=lambda x: x[1], reverse=True)
        mejores_docentes.sort(key=lambda x: x[1], reverse=True)
        resumen = {
            "periodo": periodo,
            "detalle": datos,
            "asignaturas_con_mayor_reprobacion": [nombre for nombre, _ in peores[:3]],
            "docentes_con_mejor_promedio": [nombre for nombre, _ in mejores_docentes[:3]],
        }
        ReporteMensual.objects.create(periodo=periodo, datos=resumen)

        destinatarios = Usuario.objects.filter(
            rol__permisos_asignados__contains=["recibir_notificacion_estado_mensual"]
        ).exclude(email="")
        correos = [user.email for user in destinatarios if user.email]
        _enviar_correo(
            "Reporte mensual EduPro 360",
            (
                f"Reporte del periodo {periodo}.\n"
                f"Asignaturas analizadas: {len(datos)}.\n"
                f"Docentes destacados: {', '.join(resumen['docentes_con_mejor_promedio']) or 'N/A'}."
            ),
            correos,
        )
        return Response(resumen, status=status.HTTP_201_CREATED)