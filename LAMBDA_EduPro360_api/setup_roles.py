"""
Script para crear los roles básicos del sistema EduPro360.
Ejecutar con: python manage.py shell < setup_roles.py
"""

from Usuarios.models import Rol

# Eliminar roles existentes si los hay
Rol.objects.all().delete()

# Crear roles básicos con permisos específicos
roles_data = [
    {
        "nombre": "Administrador",
        "permisos_asignados": [
            # Gestión de usuarios
            "crear_usuarios",
            "editar_usuarios",
            "eliminar_usuarios",
            "ver_usuarios",
            "gestionar_roles",
            # Gestión de asignaturas (EXCLUSIVO del administrador)
            "crear_asignatura",
            "editar_asignatura",
            "eliminar_asignatura",
            "ver_asignaturas",
            "asignar_estudiantes",
            "asignar_docentes",
            # Otras funciones administrativas
            "ver_reportes",
            "generar_reportes",
        ]
    },
    {
        "nombre": "Docente",
        "permisos_asignados": [
            # Ver asignaturas donde es docente responsable
            "ver_asignaturas_propias",
            # Gestión de tareas en sus asignaturas
            "crear_tarea",
            "editar_tarea",
            "eliminar_tarea",
            "ver_tareas",
            # Calificación (EXCLUSIVO del docente)
            "calificar_tarea",
            "ver_entregas",
            "dar_retroalimentacion",
            # Ver estudiantes de sus asignaturas
            "ver_estudiantes_asignatura",
        ]
    },
    {
        "nombre": "Estudiante",
        "permisos_asignados": [
            # Ver solo sus asignaturas inscritas
            "ver_asignaturas_inscritas",
            # Ver tareas de sus asignaturas
            "ver_tareas_propias",
            # Enviar trabajos
            "enviar_entrega",
            "editar_entrega_propia",
            # Ver sus propias calificaciones
            "ver_calificaciones_propias",
        ]
    },
]

created_roles = []
for rol_data in roles_data:
    rol = Rol.objects.create(**rol_data)
    created_roles.append(rol)
    print(f"✓ Rol creado: {rol.nombre}")

print(f"\n{len(created_roles)} roles creados exitosamente!")
