from rest_framework import serializers
from .models import MpesaRequest, MpesaResponse, Order
import re
from django.core.validators import URLValidator
from django.core.exceptions import ValidationError

class CallbackURLSerializer(serializers.Serializer):
    callback_url = serializers.URLField()

    def validate_callback_url(self, value):
        # Additional validation for callback URL
        if not value.startswith(('http://', 'https://')):
            raise serializers.ValidationError("URL must start with http:// or https://")
        if len(value) > 500:
            raise serializers.ValidationError("URL is too long")
        # Prevent localhost in production
        if 'localhost' in value and not settings.DEBUG:
            raise serializers.ValidationError("Localhost URLs not allowed in production")
        return value

class OrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = ['id', 'product', 'quantity', 'status', 'timestamp']

class MpesaRequestSerializer(serializers.ModelSerializer):
    phone_number = serializers.CharField(
        max_length=15,
        validators=[RegexValidator(
            regex=r'^254[0-9]{9}$',
            message='Phone number must be in format 254XXXXXXXXX'
        )]
    )
    amount = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        min_value=0.01
    )
    account_reference = serializers.CharField(
        max_length=50,
        validators=[RegexValidator(
            regex=r'^[a-zA-Z0-9\-_]+$',
            message='Account reference can only contain letters, numbers, hyphens, and underscores'
        )]
    )
    transaction = serializers.CharField(
        max_length=255,
        validators=[RegexValidator(
            regex=r'^[a-zA-Z0-9\s\-_.,]+$',
            message='Transaction description contains invalid characters'
        )]
    )

    class Meta:
        model = MpesaRequest
        fields = ['phone_number', 'amount', 'account_reference', 'transaction']

    def validate_phone_number(self, value):
        # Additional validation
        if not value.startswith('254'):
            raise serializers.ValidationError("Phone number must start with 254")
        if len(value) != 12:
            raise serializers.ValidationError("Phone number must be exactly 12 digits")
        return value

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Amount must be positive")
        if value > 100000:  # Reasonable max
            raise serializers.ValidationError("Amount exceeds maximum allowed")
        return value

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        ret['amount'] = str(instance.amount)
        return ret

class MpesaResponseSerializer(serializers.ModelSerializer):
    class Meta:
        model = MpesaResponse
        fields = '__all__'
    def to_representation(self, instance):
        ret = super().to_representation(instance)
        return ret

