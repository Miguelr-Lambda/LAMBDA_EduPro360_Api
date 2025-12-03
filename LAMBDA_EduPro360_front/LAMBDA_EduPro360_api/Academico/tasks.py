from datetime import date
from io import BytesIO

import pandas as pd
from celery import shared_task
from django.conf import settings
from django.core.mail import EmailMessage
from django.db.models import Avg
from django.template.defaultfilters import slugify
from django.utils import timezone
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import Paragraph, SimpleDocTemplate

from Usuarios.models import Usuario

from .models import Asignatura, RecordatorioTarea, ReporteMensual


@shared_task
def enviar_recordatorios_vencimiento():
    """Envía recordatorios pendientes a estudiantes y docentes usando Celery."""

    ahora = timezone.now()
    pendientes = RecordatorioTarea.objects.select_related("tarea", "tarea__asignatura").filter(
        enviado=False, fecha_programada__lte=ahora
    )

    for recordatorio in pendientes:
        asignatura = recordatorio.tarea.asignatura
        estudiantes = list(asignatura.estudiantes.values_list("email", flat=True))
        if recordatorio.tipo_recordatorio == "1_DIA":
            estudiantes.append(asignatura.docente_responsable.email)

        if not estudiantes:
            continue

        mensaje = EmailMessage(
            subject=f"Recordatorio: {recordatorio.tarea.titulo}",
            body=(
                f"La tarea '{recordatorio.tarea.titulo}' de {asignatura.nombre} vence el "
                f"{recordatorio.tarea.fecha_vencimiento}. Este correo fue generado por Celery."
            ),
            to=[email for email in estudiantes if email],
        )
        mensaje.send(fail_silently=True)

        recordatorio.enviado = True
        recordatorio.fecha_envio = ahora
        recordatorio.save(update_fields=["enviado", "fecha_envio"])


def _construir_dataframe_reporte(periodo):
    """Devuelve un DataFrame de Pandas con métricas básicas por asignatura."""

    datos = []
    for asignatura in Asignatura.objects.prefetch_related("estudiantes"):
        promedio = (
            asignatura.tareas.filter(entregas__nota__isnull=False)
            .aggregate(promedio=Avg("entregas__nota"))
            .get("promedio")
            or 0
        )
        datos.append(
            {
                "periodo": periodo,
                "asignatura": asignatura.nombre,
                "codigo": asignatura.codigo,
                "total_estudiantes": asignatura.estudiantes.count(),
                "promedio_general": round(float(promedio), 2) if promedio else 0,
            }
        )

    return pd.DataFrame(datos)


def _exportar_excel(df: pd.DataFrame, periodo: str) -> bytes:
    """Genera un Excel usando OpenPyXL como motor para el consolidado."""

    buffer = BytesIO()
    with pd.ExcelWriter(buffer, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="Resumen")
    buffer.seek(0)
    return buffer.read()


def _exportar_pdf(df: pd.DataFrame, periodo: str) -> bytes:
    """Construye un PDF simple con ReportLab a partir del DataFrame."""

    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    styles = getSampleStyleSheet()
    story = [Paragraph(f"Consolidado mensual {periodo}", styles["Title"])]

    for _, fila in df.iterrows():
        story.append(
            Paragraph(
                f"{fila['asignatura']} ({fila['codigo']}): "
                f"Estudiantes {fila['total_estudiantes']} | Promedio {fila['promedio_general']}",
                styles["Normal"],
            )
        )

    doc.build(story)
    buffer.seek(0)
    return buffer.read()


@shared_task
def generar_reporte_mensual(periodo: str | None = None):
    """Genera consolidado mensual y lo envía por correo con adjuntos Excel y PDF."""

    periodo_uso = periodo or date.today().strftime("%Y-%m")
    df = _construir_dataframe_reporte(periodo_uso)
    excel_bytes = _exportar_excel(df, periodo_uso)
    pdf_bytes = _exportar_pdf(df, periodo_uso)

    ReporteMensual.objects.create(periodo=periodo_uso, datos=df.to_dict(orient="records"))

    destinatarios = Usuario.objects.filter(
        rol__permisos_asignados__contains=["recibir_notificacion_estado_mensual"]
    ).values_list("email", flat=True)

    correo = EmailMessage(
        subject=f"Consolidado mensual {periodo_uso}",
        body="Se adjunta el consolidado mensual generado automáticamente por Celery.",
        to=[email for email in destinatarios if email],
        from_email=getattr(settings, "DEFAULT_FROM_EMAIL", "no-reply@edupro360.local"),
    )

    slug_periodo = slugify(periodo_uso)
    correo.attach(filename=f"reporte-{slug_periodo}.xlsx", content=excel_bytes, mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    correo.attach(filename=f"reporte-{slug_periodo}.pdf", content=pdf_bytes, mimetype="application/pdf")
    correo.send(fail_silently=True)