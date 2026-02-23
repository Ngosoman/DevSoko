from django.urls import path
from . import views

urlpatterns = [
    path('mpesa/stk-push/', views.stk_push, name='stk_push'),
    path('mpesa/callback/', views.mpesa_callback, name='mpesa_callback'),
    path('mpesa/get-ngrok-url/', views.get_ngrok_url, name='get_ngrok_url'),
    path('mpesa/set-callback-url/', views.set_callback_url, name='set_callback_url'),
]
