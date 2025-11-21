from decimal import Decimal

from django.db.models import Sum
from django.utils import timezone
from rest_framework import serializers

from .models import Asignatura, Entrega, RecordatorioTarea, Tarea


class AsignaturaSerializer(serializers.ModelSerializer):
    docente_nombre = serializers.CharField(source="docente_responsable.get_full_name", read_only=True)

    class Meta:
        model = Asignatura
        fields = [
            "id",
            "nombre",
            "codigo",
            "descripcion",
            "estado",
            "fecha_creacion",
            "docente_responsable",
            "docente_nombre",
            "periodo_academico",
            "estudiantes",
        ]
        read_only_fields = ["id", "fecha_creacion", "docente_nombre"]


class TareaSerializer(serializers.ModelSerializer):
    asignatura_nombre = serializers.CharField(source="asignatura.nombre", read_only=True)

    class Meta:
        model = Tarea
        fields = [
            "id",
            "asignatura",
            "asignatura_nombre",
            "titulo",
            "descripcion",
            "fecha_publicacion",
            "fecha_vencimiento",
            "peso_porcentual",
            "tipo_tarea",
            "estado",
        ]
        read_only_fields = ["id", "asignatura_nombre"]

    def validate(self, attrs):
        fecha_publicacion = attrs.get("fecha_publicacion", getattr(self.instance, "fecha_publicacion", None))
        fecha_vencimiento = attrs.get("fecha_vencimiento", getattr(self.instance, "fecha_vencimiento", None))
        if fecha_publicacion and fecha_vencimiento and fecha_vencimiento < fecha_publicacion:
            raise serializers.ValidationError("La fecha de vencimiento no puede ser anterior a la publicación.")

        asignatura = attrs.get("asignatura", getattr(self.instance, "asignatura", None))
        peso = Decimal(attrs.get("peso_porcentual", getattr(self.instance, "peso_porcentual", 0)))
        if asignatura:
            tareas = Tarea.objects.filter(asignatura=asignatura).exclude(pk=getattr(self.instance, "pk", None))
            total = tareas.aggregate(total=Sum("peso_porcentual"))['total'] or Decimal("0")
            nuevo_total = total + peso
            if nuevo_total > Decimal("100"):
                raise serializers.ValidationError("La suma de pesos de la asignatura no puede superar el 100%.")
            if nuevo_total != Decimal("100"):
                faltante = Decimal("100") - nuevo_total
                raise serializers.ValidationError(
                    f"El plan de evaluación debe sumar 100%. Ajuste los pesos (faltan {faltante}%)."
                )
        return attrs


class EntregaSerializer(serializers.ModelSerializer):
    tarea_titulo = serializers.CharField(source="tarea.titulo", read_only=True)
    estudiante_nombre = serializers.CharField(source="estudiante.get_full_name", read_only=True)

    class Meta:
        model = Entrega
        fields = [
            "id",
            "tarea",
            "tarea_titulo",
            "estudiante",
            "estudiante_nombre",
            "archivo_entrega",
            "comentarios_estudiante",
            "fecha_entrega",
            "estado_entrega",
            "nota",
            "retroalimentacion_docente",
            "fecha_calificacion",
            "estado_calificacion",
        ]
        read_only_fields = [
            "id",
            "tarea_titulo",
            "estudiante_nombre",
            "fecha_entrega",
            "nota",
            "retroalimentacion_docente",
            "fecha_calificacion",
            "estado_calificacion",
        ]

    def validate(self, attrs):
        tarea = attrs.get("tarea")
        estudiante = attrs.get("estudiante")
        if tarea and tarea.fecha_vencimiento < timezone.now().date():
            raise serializers.ValidationError("La tarea ya está vencida.")
        if tarea and estudiante:
            if not tarea.asignatura.estudiantes.filter(pk=estudiante.pk).exists():
                raise serializers.ValidationError("El estudiante no pertenece a la asignatura.")
        return attrs


class CalificarEntregaSerializer(serializers.Serializer):
    nota = serializers.DecimalField(max_digits=5, decimal_places=2)
    retroalimentacion_docente = serializers.CharField(required=False, allow_blank=True)


class RecordatorioSerializer(serializers.ModelSerializer):
    class Meta:
        model = RecordatorioTarea
        fields = ["id", "tarea", "tipo_recordatorio", "fecha_programada", "enviado", "fecha_envio"]
        read_only_fields = ["id", "enviado", "fecha_envio"]


class GenerarReporteSerializer(serializers.Serializer):
    periodo = serializers.CharField(required=False)