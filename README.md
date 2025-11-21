# LAMBDA EduPro360 API

## Instalación rápida

1. Crea y activa tu entorno virtual de Python.
2. Instala dependencias desde la raíz del repo:

   ```bash
   pip install -r requirements.txt
   ```

El archivo `requirements.txt` incluye Django, DRF y `djangorestframework-simplejwt` para que los imports como `rest_framework_simplejwt` no aparezcan como faltantes en tu editor.

## Pruebas rápidas en Postman

1. Importa la colección `postman/EduPro360.postman_collection.json`.
2. Importa el ambiente `postman/EduPro360.postman_environment.json` y confirma que `base_url` apunte a tu servidor (por defecto `http://localhost:8000`).
3. Ejecuta la carpeta **Auth → Login (correo + contraseña)** con un usuario válido. El test guarda automáticamente `access_token` y `refresh_token` en el ambiente.
4. Lanza las peticiones de **Usuarios y Roles** y **Académico**. Todas usan `Authorization: Bearer {{access_token}}` y cuerpos de ejemplo listos para copiar/ajustar.
5. Para los endpoints de Celery (recordatorios y reporte mensual), asegúrate de tener tu worker/broker en marcha antes de enviar la solicitud.
