from rest_framework import serializers
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from .models import Usuario, Rol


class RolSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rol
        fields = ["id", "nombre", "permisos_asignados", "fecha_creacion"]
        read_only_fields = ["id", "fecha_creacion"]


class UsuarioSerializer(serializers.ModelSerializer):
    """Salida/lectura de usuario."""
    rol_detalle = RolSerializer(source="rol", read_only=True)
    is_staff = serializers.BooleanField(read_only=True)
    is_superuser = serializers.BooleanField(read_only=True)
    class Meta:
        model = Usuario
        fields = [
            "id",
            "username",
            "first_name",
            "last_name",
            "email",
            "telefono",
            "rol",
            "rol_detalle",
            "is_staff",
            "is_superuser",
            "activo",
            "fecha_creacion",
        ]
        read_only_fields = ["id", "fecha_creacion"]


class UsuarioCrearSerializer(serializers.ModelSerializer):
    """Creación con contraseña."""
    password = serializers.CharField(write_only=True)

    class Meta:
        model = Usuario
        fields = [
            "username",
            "password",
            "first_name",
            "last_name",
            "email",
            "telefono",
            "rol",
            "activo",
        ]
        # <- aquí estaba el problema de indentación
        extra_kwargs = {
            "email": {"required": True},
        }

    def validate_password(self, value):
        try:
            validate_password(value)
        except ValidationError as e:
            raise serializers.ValidationError(e.messages)
        return value

    def create(self, validated_data):
        password = validated_data.pop("password")
        usuario = Usuario(**validated_data)
        usuario.set_password(password)

        # Si tu modelo tiene el campo "activo"
        # sincronizamos con is_active de Django
        if hasattr(usuario, "activo") and usuario.activo is not None:
            usuario.is_active = usuario.activo

        usuario.save()
        return usuario

    def validate_email(self, value):
        if Usuario.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("Ya existe un usuario con ese correo.")
        return value


class UsuarioCrearPorAdminSerializer(serializers.ModelSerializer):
    """Creación de usuario por el admin (sin necesidad de proporcionar contraseña)."""

    class Meta:
        model = Usuario
        fields = [
            "username",
            "first_name",
            "last_name",
            "email",
            "telefono",
            "rol",
            "activo",
        ]
        extra_kwargs = {
            "email": {"required": True},
            "first_name": {"required": True},
            "last_name": {"required": True},
            "rol": {"required": True},
        }

    def validate_email(self, value):
        if Usuario.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("Ya existe un usuario con ese correo.")
        return value


class UsuarioActualizarSerializer(serializers.ModelSerializer):
    """Actualización parcial o total (sin contraseña)."""

    class Meta:
        model = Usuario
        fields = ["first_name", "last_name", "email", "telefono", "rol", "activo"]

    # <- este método NO debe ir dentro de Meta
    def update(self, instance, validated_data):
        # guardamos el valor de "activo" antes de llamar al super
        activo = validated_data.get("activo", instance.activo)

        usuario = super().update(instance, validated_data)

        # si en la petición venía "activo", sincronizamos is_active
        if "activo" in validated_data and activo is not None:
            usuario.is_active = activo
            usuario.save(update_fields=["is_active"])

        return usuario

    def validate_email(self, value):
        usuario = self.instance
        if (
            value
            and Usuario.objects.exclude(pk=usuario.pk)
            .filter(email__iexact=value)
            .exists()
        ):
            raise serializers.ValidationError("Ya existe un usuario con ese correo.")
        return value


class CambiarContrasenaSerializer(serializers.Serializer):
    contrasena_actual = serializers.CharField(write_only=True)
    nueva_contrasena = serializers.CharField(write_only=True)

    def validate_nueva_contrasena(self, value):
        try:
            validate_password(value)
        except ValidationError as e:
            raise serializers.ValidationError(e.messages)
        return value


class SolicitarRecuperacionSerializer(serializers.Serializer):
    email = serializers.EmailField()


class RecuperarContrasenaSerializer(serializers.Serializer):
    token = serializers.CharField()
    nueva_contrasena = serializers.CharField(write_only=True)

    def validate_nueva_contrasena(self, value):
        try:
            validate_password(value)
        except ValidationError as e:
            raise serializers.ValidationError(e.messages)
        return value

class EmailTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Autenticación SimpleJWT usando correo en lugar de username."""

    username_field = "email"

    def validate(self, attrs):
        email = attrs.get("email")
        password = attrs.get("password")

        if not email or not password:
            raise AuthenticationFailed("Debe enviar correo y contraseña.")

        usuario = Usuario.objects.filter(email__iexact=email).first()
        if not usuario:
            raise AuthenticationFailed("El usuario no existe.")
        if not usuario.is_active or not usuario.activo:
            raise AuthenticationFailed("El usuario está inactivo.")
        if not usuario.check_password(password):
            raise AuthenticationFailed("Credenciales incorrectas.")

        refresh = self.get_token(usuario)

        # Incluir información del usuario con su rol
        return {
            "refresh": str(refresh),
            "access": str(refresh.access_token),
            "user": UsuarioSerializer(usuario).data
        }