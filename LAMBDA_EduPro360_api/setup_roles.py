"""
Script para crear los roles básicos del sistema EduPro360.
Ejecutar con: python manage.py shell < setup_roles.py
"""

from Usuarios.models import Rol

# Eliminar roles existentes si los hay
Rol.objects.all().delete()

# Crear roles básicos
roles_data = [
    {
        "nombre": "Administrador",
        "permisos_asignados": [
            "crear_usuarios",
            "editar_usuarios",
            "eliminar_usuarios",
            "gestionar_roles",
            "ver_reportes",
            "gestionar_asignaturas",
            "gestionar_tareas",
            "gestionar_calificaciones",
        ]
    },
    {
        "nombre": "Docente",
        "permisos_asignados": [
            "crear_asignaturas",
            "editar_asignaturas",
            "crear_tareas",
            "editar_tareas",
            "calificar_entregas",
            "ver_estudiantes",
        ]
    },
    {
        "nombre": "Estudiante",
        "permisos_asignados": [
            "ver_asignaturas",
            "enviar_entregas",
            "ver_tareas",
            "ver_calificaciones",
        ]
    },
]

created_roles = []
for rol_data in roles_data:
    rol = Rol.objects.create(**rol_data)
    created_roles.append(rol)
    print(f"✓ Rol creado: {rol.nombre}")

print(f"\n{len(created_roles)} roles creados exitosamente!")
