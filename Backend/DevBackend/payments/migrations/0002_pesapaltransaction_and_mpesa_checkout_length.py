from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ('payments', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='mpesaresponse',
            name='checkout_request_id',
            field=models.CharField(max_length=255),
        ),
        migrations.CreateModel(
            name='PesapalTransaction',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('merchant_reference', models.CharField(max_length=120, unique=True)),
                ('order_tracking_id', models.CharField(blank=True, default='', max_length=120)),
                ('payment_method', models.CharField(choices=[('mpesa', 'M-Pesa'), ('airtel_money', 'Airtel Money'), ('visa', 'Visa Card'), ('mastercard', 'Mastercard')], max_length=20)),
                ('amount', models.DecimalField(decimal_places=2, max_digits=10)),
                ('currency', models.CharField(default='KES', max_length=3)),
                ('description', models.CharField(max_length=255)),
                ('status', models.CharField(choices=[('pending', 'Pending'), ('processing', 'Processing'), ('completed', 'Completed'), ('failed', 'Failed'), ('cancelled', 'Cancelled')], default='pending', max_length=20)),
                ('checkout_url', models.URLField(blank=True, default='', max_length=500)),
                ('request_payload', models.JSONField(blank=True, default=dict)),
                ('response_payload', models.JSONField(blank=True, default=dict)),
                ('status_payload', models.JSONField(blank=True, default=dict)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('order', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='pesapal_transactions', to='payments.order')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='pesapal_transactions', to='auth.user')),
            ],
        ),
    ]
