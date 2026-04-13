from django.shortcuts import render


#Mpesa Views

from rest_framework import status
from rest_framework import viewsets 
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import MpesaRequest, MpesaResponse, Order
from .serializers import MpesaRequestSerializer, MpesaResponseSerializer, OrderSerializer, CallbackURLSerializer
from django.conf import settings
from django_ratelimit.decorators import ratelimit
import base64
import requests
from datetime import datetime
from decimal import Decimal

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@ratelimit(key='user', rate='5/m', method='POST', block=True)
def stk_push(request):
    print("Received STK push request:", request.data)  # <-- This will show in backend terminal
    data = request.data.copy()
    data.pop('product_id', None)  # Remove product_id as it's not needed for MpesaRequest
    data['amount'] = Decimal(str(data['amount']))
    serializer = MpesaRequestSerializer(data=data)
    if serializer.is_valid():
        order = Order.objects.create(buyer=request.user, product=data.get('account_reference'), status='pending')
        mpesa_request = serializer.save(order=order)
        response_data = initiate_stk_push(mpesa_request)
        print("Mpesa API response:", response_data)
        if response_data.get('ResponseCode') != '0':
            mpesa_response = MpesaResponse.objects.create(
                request=mpesa_request,
                merchant_request_id=response_data.get('MerchantRequestID', ''),
                checkout_request_id=response_data.get('CheckoutRequestID', ''),
                response_description=response_data.get('ResponseDescription', ''),
                response_code=response_data.get('ResponseCode', ''),
                customer_message=response_data.get('CustomerMessage', ''),
            )
            return Response({'detail': 'STK push failed', 'error': response_data}, status=400)
        mpesa_response = MpesaResponse.objects.create(
            request=mpesa_request,
            merchant_request_id=response_data.get('MerchantRequestID', ''),
            checkout_request_id=response_data.get('CheckoutRequestID', ''),
            response_description=response_data.get('ResponseDescription', ''),
            response_code=response_data.get('ResponseCode', ''),
            customer_message=response_data.get('CustomerMessage', ''),
        )
        response_serializer = MpesaResponseSerializer(mpesa_response)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)
    else:
        print("Serializer errors:", serializer.errors)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

def initiate_stk_push(mpesa_request):
    access_token = get_access_token()
    
    if not access_token:
        return {
            'ResponseCode': '1',
            'ResponseDescription': 'Failed to get Mpesa access token. Please check your credentials.',
            'ErrorMessage': 'Mpesa credentials not configured or invalid'
        }
    
    # Use dynamic URL from settings based on environment
    api_url = settings.MPESA_STK_PUSH_URL
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    
    print("Access Token:", access_token[:20] + "...")  # Debugging line
    print("Using M-Pesa API URL:", api_url)  # Debugging line
    
    # Format phone number properly
    phone = mpesa_request.phone_number
    # Remove any + prefix
    phone = phone.lstrip('+')
    # Ensure it starts with 254
    if not phone.startswith('254'):
        phone = '254' + phone.lstrip('0')
    
    # Check if shortcode is configured
    shortcode = settings.MPESA_SHORTCODE
    if shortcode == 'your_shortcode_here':
        return {
            'ResponseCode': '1',
            'ResponseDescription': 'Mpesa shortcode not configured',
            'ErrorMessage': 'Please configure MPESA_SHORTCODE in .env file'
        }
    
    payload = {
        "BusinessShortCode": shortcode,
        "Password": generate_password(),
        "Timestamp": datetime.now().strftime('%Y%m%d%H%M%S'),
        "TransactionType": "CustomerPayBillOnline",
        "Amount": int(float(mpesa_request.amount)),  # Convert to integer
        "PartyA": phone,
        "PartyB": shortcode,
        "PhoneNumber": phone,
        "CallBackURL": _dynamic_callback_url if _dynamic_callback_url else settings.MPESA_CALLBACK_URL,
        "AccountReference": mpesa_request.account_reference,
        "TransactionDesc": mpesa_request.transaction
    }
    
    print("STK Push Payload:", payload)  # Debugging line
    
    try:
        response = requests.post(api_url, json=payload, headers=headers, timeout=30)
        response_data = response.json()
        print("Mpesa API Response:", response_data)
        return response_data
    except requests.exceptions.RequestException as e:
        print(f"ERROR: STK Push request failed: {str(e)}")
        return {
            'ResponseCode': '1',
            'ResponseDescription': 'Network error occurred',
            'ErrorMessage': str(e)
        }
    except ValueError as e:
        print(f"ERROR: Failed to parse Mpesa response: {str(e)}")
        return {
            'ResponseCode': '1',
            'ResponseDescription': 'Invalid response from Mpesa',
            'ErrorMessage': str(e)
        }

def get_access_token():
    consumer_key = settings.MPESA_CONSUMER_KEY
    consumer_secret = settings.MPESA_CONSUMER_SECRET
    
    # Check if credentials are set
    if consumer_key == 'your_consumer_key_here' or consumer_secret == 'your_consumer_secret_here':
        print("ERROR: Mpesa credentials not configured in .env file")
        return None
    
    # Use dynamic URL from settings based on environment
    api_url = settings.MPESA_AUTH_URL
    
    try:
        response = requests.get(api_url, auth=(consumer_key, consumer_secret), timeout=30)
        response_data = response.json()
        
        if response.status_code != 200:
            print(f"ERROR: Failed to get access token. Status: {response.status_code}, Response: {response_data}")
            return None
            
        access_token = response_data.get('access_token')
        if not access_token:
            print(f"ERROR: No access token in response: {response_data}")
            return None
            
        return access_token
    except requests.exceptions.RequestException as e:
        print(f"ERROR: Request failed: {str(e)}")
        return None
    except ValueError as e:
        print(f"ERROR: Failed to parse response: {str(e)}")
        return None

def generate_password():
    shortcode = settings.MPESA_SHORTCODE
    passkey = settings.MPESA_PASSKEY
    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
    data_to_encode = shortcode + passkey + timestamp
    encoded_string = base64.b64encode(data_to_encode.encode())
    return encoded_string.decode('utf-8')

@api_view(['POST'])
@permission_classes([AllowAny])
def mpesa_callback(request):
    try:
        callback_data = request.data
        if not isinstance(callback_data, dict):
            return Response({'error': 'Invalid data format'}, status=400)
        
        stk_callback = callback_data.get('Body', {}).get('stkCallback', {})
        if not stk_callback:
            return Response({'error': 'Invalid callback structure'}, status=400)
        
        checkout_request_id = stk_callback.get('CheckoutRequestID')
        if not checkout_request_id or not isinstance(checkout_request_id, str) or len(checkout_request_id) > 50:
            return Response({'error': 'Invalid checkout request ID'}, status=400)
        
        result_code = stk_callback.get('ResultCode')
        if result_code is None or not isinstance(result_code, int):
            return Response({'error': 'Invalid result code'}, status=400)
        
        result_desc = stk_callback.get('ResultDesc', '')
        if not isinstance(result_desc, str) or len(result_desc) > 255:
            return Response({'error': 'Invalid result description'}, status=400)
        
        # Process the callback
        try:
            mpesa_request = MpesaRequest.objects.get(mpesa_response__checkout_request_id=checkout_request_id)
            mpesa_response = mpesa_request.mpesa_response
            mpesa_response.result_code = result_code
            mpesa_response.result_desc = result_desc
            mpesa_response.save()
            if result_code == 0:
                mpesa_request.order.status = 'paid'
                mpesa_request.order.save()
        except MpesaRequest.DoesNotExist:
            pass  # Log or handle
        
        return Response({'success': True})
    except Exception as e:
        logger.error(f'Callback processing error: {str(e)}')
        return Response({'error': 'Processing failed'}, status=500)
    return Response({'ResultCode': 0, 'ResultDesc': 'Success'})

# Dynamic callback URL management
_dynamic_callback_url = None

@api_view(['GET'])
@permission_classes([IsAuthenticated])
@ratelimit(key='user', rate='10/m', method='GET', block=True)
def get_ngrok_url(request):
    """Get current callback URL configuration"""
    return Response({
        'current_callback_url': _dynamic_callback_url or settings.MPESA_CALLBACK_URL,
        'is_dynamic': _dynamic_callback_url is not None
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@ratelimit(key='user', rate='5/m', method='POST', block=True)
def set_callback_url(request):
    serializer = CallbackURLSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    new_url = serializer.validated_data['callback_url']
    
    # Additional security check
    if not new_url.startswith('http'):
        return Response({'error': 'Invalid URL format'}, status=400)
    
    global _dynamic_callback_url
    _dynamic_callback_url = new_url
    print(f"Updated callback URL to: {_dynamic_callback_url}")
    
    return Response({
        'success': True,
        'callback_url': _dynamic_callback_url
    })

@api_view(['POST'])
@permission_classes([AllowAny])
@ratelimit(key='ip', rate='3/h', method='POST', block=True)
def register_user(request):
    # This endpoint can be used to register users if needed
    # For now, just rate limit registration attempts
    # Actual registration is handled by Firebase on frontend
    return Response({'message': 'Registration handled on frontend'}, status=200)

# Modified initiate_stk_push to use dynamic callback URL
def initiate_stk_push_with_dynamic_callback(mpesa_request):
    """Modified version that uses dynamic callback URL if set"""
    access_token = get_access_token()
    
    if not access_token:
        return {
            'ResponseCode': '1',
            'ResponseDescription': 'Failed to get Mpesa access token. Please check your credentials.',
            'ErrorMessage': 'Mpesa credentials not configured or invalid'
        }
    
    # Use dynamic URL from settings based on environment
    api_url = settings.MPESA_STK_PUSH_URL
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    
    print("Access Token:", access_token[:20] + "...")
    
    # Format phone number properly
    phone = mpesa_request.phone_number
    phone = phone.lstrip('+')
    if not phone.startswith('254'):
        phone = '254' + phone.lstrip('0')
    
    # Check if shortcode is configured
    shortcode = settings.MPESA_SHORTCODE
    if shortcode == 'your_shortcode_here':
        return {
            'ResponseCode': '1',
            'ResponseDescription': 'Mpesa shortcode not configured',
            'ErrorMessage': 'Please configure MPESA_SHORTCODE in .env file'
        }
    
    # Use dynamic callback URL if set, otherwise use settings
    callback_url = _dynamic_callback_url if _dynamic_callback_url else settings.MPESA_CALLBACK_URL
    
    payload = {
        "BusinessShortCode": shortcode,
        "Password": generate_password(),
        "Timestamp": datetime.now().strftime('%Y%m%d%H%M%S'),
        "TransactionType": "CustomerPayBillOnline",
        "Amount": int(float(mpesa_request.amount)),
        "PartyA": phone,
        "PartyB": shortcode,
        "PhoneNumber": phone,
        "CallBackURL": callback_url,
        "AccountReference": mpesa_request.account_reference,
        "TransactionDesc": mpesa_request.transaction
    }
    
    print("STK Push Payload:", payload)
    
    try:
        response = requests.post(api_url, json=payload, headers=headers, timeout=30)
        response_data = response.json()
        print("Mpesa API Response:", response_data)
        return response_data
    except requests.exceptions.RequestException as e:
        print(f"ERROR: STK Push request failed: {str(e)}")
        return {
            'ResponseCode': '1',
            'ResponseDescription': 'Network error occurred',
            'ErrorMessage': str(e)
        }
    except ValueError as e:
        print(f"ERROR: Failed to parse Mpesa response: {str(e)}")
        return {
            'ResponseCode': '1',
            'ResponseDescription': 'Invalid response from Mpesa',
            'ErrorMessage': str(e)
        }
