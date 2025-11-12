from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from .models import Usuario

class UsuarioSerializer(serializers.ModelSerializer):
    """Salida/lectura de usuario."""
    class Meta:
        model = Usuario
        fields = [
            "id", "username", "first_name", "last_name", "email",
            "telefono", "rol", "activo", "fecha_creacion"
        ]
        read_only_fields = ["id", "fecha_creacion"]

class UsuarioCrearSerializer(serializers.ModelSerializer):
    """Creación con contraseña."""
    password = serializers.CharField(write_only=True)

    class Meta:
        model = Usuario
        fields = [
            "username", "password", "first_name", "last_name",
            "email", "telefono", "rol", "activo"
        ]

    def validate_password(self, value):
        try:
            validate_password(value)
        except ValidationError as e:
            raise serializers.ValidationError(e.messages)
        return value

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = Usuario(**validated_data)
        user.set_password(password)
        user.save()
        return user

class UsuarioActualizarSerializer(serializers.ModelSerializer):
    """Actualización parcial o total (sin contraseña)."""
    class Meta:
        model = Usuario
        fields = ["first_name", "last_name", "email", "telefono", "rol", "activo"]

class CambiarContrasenaSerializer(serializers.Serializer):
    nueva_contrasena = serializers.CharField(write_only=True)

    def validate_nueva_contrasena(self, value):
        try:
            validate_password(value)
        except ValidationError as e:
            raise serializers.ValidationError(e.messages)
        return value
