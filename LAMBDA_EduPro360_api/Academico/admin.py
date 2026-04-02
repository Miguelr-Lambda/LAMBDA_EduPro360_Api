from django.contrib import admin
from django.utils.html import format_html
from django.db.models import Count, Avg
from .models import Asignatura, Tarea, Entrega, RecordatorioTarea, ReporteMensual


class TareaInline(admin.TabularInline):
    """Inline para mostrar tareas dentro de asignaturas"""
    model = Tarea
    extra = 0
    fields = ('titulo', 'tipo_tarea', 'fecha_vencimiento', 'peso_porcentual', 'estado')
    readonly_fields = ('fecha_publicacion',)
    can_delete = False


@admin.register(Asignatura)
class AsignaturaAdmin(admin.ModelAdmin):
    list_display = (
        'codigo',
        'nombre',
        'docente_responsable',
        'periodo_academico',
        'total_estudiantes',
        'total_tareas',
        'estado_badge',
        'fecha_creacion'
    )
    list_filter = ('estado', 'periodo_academico', 'docente_responsable')
    search_fields = ('nombre', 'codigo', 'docente_responsable__username', 'docente_responsable__email')
    filter_horizontal = ('estudiantes',)
    inlines = [TareaInline]

    fieldsets = (
        ('Información General', {
            'fields': ('nombre', 'codigo', 'descripcion', 'estado')
        }),
        ('Gestión Académica', {
            'fields': ('docente_responsable', 'periodo_academico', 'estudiantes')
        }),
        ('Fechas', {
            'fields': ('fecha_creacion',),
            'classes': ('collapse',)
        })
    )

    readonly_fields = ('fecha_creacion',)

    def total_estudiantes(self, obj):
        """Número de estudiantes inscritos"""
        count = obj.estudiantes.count()
        return format_html('<b>{}</b> estudiantes', count)
    total_estudiantes.short_description = 'Inscritos'

    def total_tareas(self, obj):
        """Número de tareas asociadas"""
        count = obj.tareas.count()
        return format_html('<b>{}</b> tareas', count)
    total_tareas.short_description = 'Tareas'

    def estado_badge(self, obj):
        """Badge con color según estado"""
        if obj.estado == 'ACTIVA':
            color = '#28a745'
        else:
            color = '#dc3545'
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; border-radius: 3px;">{}</span>',
            color,
            obj.get_estado_display()
        )
    estado_badge.short_description = 'Estado'

    actions = ['activar_asignaturas', 'desactivar_asignaturas', 'clonar_asignatura']

    def activar_asignaturas(self, request, queryset):
        """Activa las asignaturas seleccionadas"""
        updated = queryset.update(estado='ACTIVA')
        self.message_user(request, f'{updated} asignatura(s) activada(s) correctamente.')
    activar_asignaturas.short_description = "Activar asignaturas seleccionadas"

    def desactivar_asignaturas(self, request, queryset):
        """Desactiva las asignaturas seleccionadas"""
        updated = queryset.update(estado='INACTIVA')
        self.message_user(request, f'{updated} asignatura(s) desactivada(s) correctamente.')
    desactivar_asignaturas.short_description = "Desactivar asignaturas seleccionadas"


@admin.register(Tarea)
class TareaAdmin(admin.ModelAdmin):
    list_display = (
        'titulo',
        'asignatura',
        'tipo_tarea',
        'fecha_publicacion',
        'fecha_vencimiento',
        'peso_porcentual',
        'total_entregas',
        'promedio_nota',
        'estado_badge'
    )
    list_filter = ('estado', 'tipo_tarea', 'asignatura', 'fecha_vencimiento')
    search_fields = ('titulo', 'asignatura__nombre', 'asignatura__codigo')
    date_hierarchy = 'fecha_vencimiento'

    fieldsets = (
        ('Información General', {
            'fields': ('asignatura', 'titulo', 'descripcion', 'tipo_tarea', 'estado')
        }),
        ('Fechas', {
            'fields': ('fecha_publicacion', 'fecha_vencimiento')
        }),
        ('Evaluación', {
            'fields': ('peso_porcentual',),
            'description': 'El peso debe ser un porcentaje. La suma de todos los pesos de la asignatura debe ser 100%.'
        })
    )

    readonly_fields = ('fecha_publicacion',)

    def total_entregas(self, obj):
        """Número de entregas recibidas"""
        count = obj.entregas.count()
        total_estudiantes = obj.asignatura.estudiantes.count()
        return format_html(
            '<b>{}</b> de {} estudiantes',
            count,
            total_estudiantes
        )
    total_entregas.short_description = 'Entregas'

    def promedio_nota(self, obj):
        """Promedio de las calificaciones"""
        promedio = obj.entregas.filter(
            estado_calificacion='CALIFICADO'
        ).aggregate(Avg('nota'))['nota__avg']

        if promedio:
            return format_html('<b>{:.2f}</b>', promedio)
        return '-'
    promedio_nota.short_description = 'Promedio'

    def estado_badge(self, obj):
        """Badge con color según estado"""
        if obj.estado == 'ACTIVA':
            color = '#28a745'
        else:
            color = '#dc3545'
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; border-radius: 3px;">{}</span>',
            color,
            obj.get_estado_display()
        )
    estado_badge.short_description = 'Estado'

    actions = ['activar_tareas', 'desactivar_tareas']

    def activar_tareas(self, request, queryset):
        """Activa las tareas seleccionadas"""
        updated = queryset.update(estado='ACTIVA')
        self.message_user(request, f'{updated} tarea(s) activada(s) correctamente.')
    activar_tareas.short_description = "Activar tareas seleccionadas"

    def desactivar_tareas(self, request, queryset):
        """Desactiva las tareas seleccionadas"""
        updated = queryset.update(estado='INACTIVA')
        self.message_user(request, f'{updated} tarea(s) desactivada(s) correctamente.')
    desactivar_tareas.short_description = "Desactivar tareas seleccionadas"


@admin.register(Entrega)
class EntregaAdmin(admin.ModelAdmin):
    list_display = (
        'estudiante',
        'tarea',
        'asignatura_nombre',
        'fecha_entrega',
        'nota_display',
        'estado_calificacion_badge',
        'estado_entrega'
    )
    list_filter = (
        'estado_calificacion',
        'estado_entrega',
        'tarea__asignatura',
        'fecha_entrega'
    )
    search_fields = (
        'estudiante__username',
        'estudiante__email',
        'tarea__titulo',
        'tarea__asignatura__nombre'
    )
    date_hierarchy = 'fecha_entrega'

    fieldsets = (
        ('Información de la Entrega', {
            'fields': ('tarea', 'estudiante', 'archivo_entrega', 'comentarios_estudiante', 'estado_entrega')
        }),
        ('Calificación', {
            'fields': ('nota', 'retroalimentacion_docente', 'estado_calificacion', 'fecha_calificacion'),
            'classes': ('collapse',)
        }),
        ('Fechas', {
            'fields': ('fecha_entrega',),
            'classes': ('collapse',)
        })
    )

    readonly_fields = ('fecha_entrega', 'fecha_calificacion')

    def asignatura_nombre(self, obj):
        """Nombre de la asignatura"""
        return obj.tarea.asignatura.nombre
    asignatura_nombre.short_description = 'Asignatura'
    asignatura_nombre.admin_order_field = 'tarea__asignatura__nombre'

    def nota_display(self, obj):
        """Muestra la nota con color"""
        if obj.nota is None:
            return format_html('<span style="color: #999;">Sin calificar</span>')

        # Color según la nota (verde >= 3.0, amarillo >= 2.0, rojo < 2.0)
        if obj.nota >= 3.0:
            color = '#28a745'
        elif obj.nota >= 2.0:
            color = '#ffc107'
        else:
            color = '#dc3545'

        return format_html(
            '<b style="color: {};">{:.2f}</b>',
            color,
            obj.nota
        )
    nota_display.short_description = 'Nota'
    nota_display.admin_order_field = 'nota'

    def estado_calificacion_badge(self, obj):
        """Badge con color según estado de calificación"""
        if obj.estado_calificacion == 'CALIFICADO':
            color = '#28a745'
        else:
            color = '#ffc107'
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; border-radius: 3px;">{}</span>',
            color,
            obj.get_estado_calificacion_display()
        )
    estado_calificacion_badge.short_description = 'Estado Calificación'

    actions = ['marcar_como_calificado']

    def marcar_como_calificado(self, request, queryset):
        """Marca entregas como calificadas (solo las que tienen nota)"""
        from django.utils import timezone
        entregas_con_nota = queryset.filter(nota__isnull=False)
        updated = entregas_con_nota.update(
            estado_calificacion='CALIFICADO',
            fecha_calificacion=timezone.now()
        )
        self.message_user(
            request,
            f'{updated} entrega(s) marcada(s) como calificadas. '
            f'{queryset.count() - updated} no tenían nota asignada.'
        )
    marcar_como_calificado.short_description = "Marcar como calificadas (con nota)"


@admin.register(RecordatorioTarea)
class RecordatorioTareaAdmin(admin.ModelAdmin):
    list_display = (
        'tarea',
        'tipo_recordatorio',
        'fecha_programada',
        'enviado_badge',
        'fecha_envio'
    )
    list_filter = ('enviado', 'tipo_recordatorio', 'tarea__asignatura')
    search_fields = ('tarea__titulo', 'tarea__asignatura__nombre')
    date_hierarchy = 'fecha_programada'

    fieldsets = (
        ('Información del Recordatorio', {
            'fields': ('tarea', 'tipo_recordatorio', 'fecha_programada')
        }),
        ('Estado de Envío', {
            'fields': ('enviado', 'fecha_envio')
        })
    )

    readonly_fields = ('fecha_envio',)

    def enviado_badge(self, obj):
        """Badge con color según si fue enviado"""
        if obj.enviado:
            color = '#28a745'
            texto = 'Enviado'
        else:
            color = '#6c757d'
            texto = 'Pendiente'
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; border-radius: 3px;">{}</span>',
            color,
            texto
        )
    enviado_badge.short_description = 'Estado'


@admin.register(ReporteMensual)
class ReporteMensualAdmin(admin.ModelAdmin):
    list_display = (
        'periodo',
        'fecha_generacion',
        'total_asignaturas',
        'ver_datos'
    )
    list_filter = ('fecha_generacion',)
    search_fields = ('periodo',)
    date_hierarchy = 'fecha_generacion'

    readonly_fields = ('periodo', 'datos', 'fecha_generacion')

    def has_add_permission(self, request):
        """No permitir crear reportes manualmente"""
        return False

    def has_change_permission(self, request, obj=None):
        """No permitir editar reportes"""
        return False

    def total_asignaturas(self, obj):
        """Número de asignaturas en el reporte"""
        if obj.datos and 'asignaturas' in obj.datos:
            return len(obj.datos['asignaturas'])
        return 0
    total_asignaturas.short_description = 'Asignaturas'

    def ver_datos(self, obj):
        """Link para ver datos en formato JSON"""
        return format_html(
            '<a href="#" onclick="alert(JSON.stringify({}, null, 2)); return false;">Ver JSON</a>',
            obj.datos
        )
    ver_datos.short_description = 'Datos'
