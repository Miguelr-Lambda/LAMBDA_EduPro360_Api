import os

from celery import Celery

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "LAMBDA_EduPro360_api.settings")

app = Celery("LAMBDA_EduPro360_api")
app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks()


@app.task(bind=True)
def debug_task(self):
    """Tarea de depuración para comprobar que Celery está funcionando."""

    return f"Task ejecutada correctamente: {self.request!r}"
