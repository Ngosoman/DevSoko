from django.urls import path
from . import views

urlpatterns = [
    path('mpesa/stk-push/', views.stk_push, name='stk_push'),
    path('mpesa/callback/', views.mpesa_callback, name='mpesa_callback'),
    path('mpesa/get-ngrok-url/', views.get_ngrok_url, name='get_ngrok_url'),
    path('mpesa/set-callback-url/', views.set_callback_url, name='set_callback_url'),
    path('pesapal/methods/', views.pesapal_payment_methods, name='pesapal_payment_methods'),
    path('pesapal/register-ipn/', views.pesapal_register_ipn, name='pesapal_register_ipn'),
    path('pesapal/submit-order/', views.pesapal_submit_order, name='pesapal_submit_order'),
    path('pesapal/status/<str:merchant_reference>/', views.pesapal_transaction_status, name='pesapal_transaction_status'),
    path('pesapal/callback/', views.pesapal_callback, name='pesapal_callback'),
    path('pesapal/transactions/', views.user_pesapal_transactions, name='user_pesapal_transactions'),
    path('orders/', views.user_orders, name='user_orders'),
    path('register/', views.register_user, name='register_user'),
]
