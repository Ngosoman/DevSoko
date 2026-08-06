import base64
import uuid
from datetime import datetime
from decimal import Decimal
import logging
import requests

from django.conf import settings
from django.contrib.auth.models import User
from django.core.cache import cache
from django_ratelimit.decorators import ratelimit
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import MpesaRequest, MpesaResponse, Order, PesapalTransaction
from .serializers import (
    CallbackURLSerializer,
    MpesaRequestSerializer,
    MpesaResponseSerializer,
    OrderSerializer,
    PesapalCheckoutSerializer,
    PesapalTransactionSerializer,
)

logger = logging.getLogger('payments')

PESAPAL_PAYMENT_OPTIONS = [
    {'code': 'mpesa', 'label': 'M-Pesa'},
    {'code': 'airtel_money', 'label': 'AirtelMoney'},
    {'code': 'visa', 'label': 'VisaCard'},
    {'code': 'mastercard', 'label': 'Mastercard'},
]

PESAPAL_IPN_CACHE_KEY = 'pesapal_runtime_ipn_id'


def _normalize_phone(phone_number):
    phone = str(phone_number or '').strip().lstrip('+')
    if phone.startswith('0'):
        phone = f"254{phone[1:]}"
    return phone


def _safe_json(response):
    try:
        return response.json()
    except ValueError:
        return {'raw': response.text}


def _first_present(data, *keys, default=''):
    for key in keys:
        value = data.get(key)
        if value is not None and value != '':
            return value
    return default


def _request_user_or_none(request):
    user = getattr(request, 'user', None)
    if user and getattr(user, 'is_authenticated', False):
        return user
    return None


def _get_mpesa_access_token():
    if not settings.MPESA_CONSUMER_KEY or not settings.MPESA_CONSUMER_SECRET:
        return None

    response = requests.get(
        settings.MPESA_AUTH_URL,
        auth=(settings.MPESA_CONSUMER_KEY, settings.MPESA_CONSUMER_SECRET),
        timeout=30,
    )

    if response.status_code != 200:
        logger.warning('M-Pesa auth failed: %s', response.status_code)
        return None

    return _safe_json(response).get('access_token')


def _generate_mpesa_password():
    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
    raw_value = f"{settings.MPESA_SHORTCODE}{settings.MPESA_PASSKEY}{timestamp}"
    return base64.b64encode(raw_value.encode()).decode('utf-8')


def _pesapal_get_token():
    if not settings.PESAPAL_CONSUMER_KEY or not settings.PESAPAL_CONSUMER_SECRET:
        return None, {'error': 'Pesapal credentials are missing'}

    payload = {
        'consumer_key': settings.PESAPAL_CONSUMER_KEY,
        'consumer_secret': settings.PESAPAL_CONSUMER_SECRET,
    }

    response = requests.post(settings.PESAPAL_AUTH_URL, json=payload, timeout=30)
    data = _safe_json(response)
    token = data.get('token')

    if response.status_code >= 400 or not token:
        return None, data

    return token, data


def _extract_ipn_id(data):
    return _first_present(data, 'ipn_id', 'ipnId', 'IpnId', default='').strip()


def _resolve_or_register_ipn_id(token, callback_url):
    configured_ipn_id = (settings.PESAPAL_IPN_ID or '').strip()
    if configured_ipn_id:
        return configured_ipn_id, None

    cached_ipn_id = cache.get(PESAPAL_IPN_CACHE_KEY, '')
    cached_ipn_id = (cached_ipn_id or '').strip()
    if cached_ipn_id:
        return cached_ipn_id, None

    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json',
    }
    payload = {
        'url': callback_url,
        'ipn_notification_type': 'POST',
    }

    response = requests.post(settings.PESAPAL_REGISTER_IPN_URL, json=payload, headers=headers, timeout=30)
    data = _safe_json(response)
    ipn_id = _extract_ipn_id(data)

    if response.status_code >= 400 or not ipn_id:
        return None, {
            'detail': 'Failed to register Pesapal IPN ID',
            'gateway_response': data,
            'hint': 'Set PESAPAL_IPN_ID in backend env or allow IPN registration endpoint access',
        }

    # Keep runtime IPN ID available for future checkouts in this process.
    cache.set(PESAPAL_IPN_CACHE_KEY, ipn_id, 60 * 60 * 24)
    return ipn_id, None


@api_view(['GET'])
@permission_classes([AllowAny])
def pesapal_payment_methods(request):
    return Response({'methods': PESAPAL_PAYMENT_OPTIONS}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@ratelimit(key='user', rate='5/m', method='POST', block=True)
def pesapal_register_ipn(request):
    callback_url = request.data.get('callback_url') or settings.PESAPAL_CALLBACK_URL
    ipn_notification_type = request.data.get('ipn_notification_type', 'POST')

    token, token_data = _pesapal_get_token()
    if not token:
        return Response(
            {'detail': 'Failed to authenticate with Pesapal', 'error': token_data},
            status=status.HTTP_502_BAD_GATEWAY,
        )

    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json',
    }
    payload = {
        'url': callback_url,
        'ipn_notification_type': ipn_notification_type,
    }

    response = requests.post(settings.PESAPAL_REGISTER_IPN_URL, json=payload, headers=headers, timeout=30)
    data = _safe_json(response)

    if response.status_code >= 400:
        return Response(
            {'detail': 'Failed to register IPN', 'error': data},
            status=status.HTTP_502_BAD_GATEWAY,
        )

    return Response(
        {
            'detail': 'IPN registered successfully',
            'gateway_response': data,
            'next_step': 'Set PESAPAL_IPN_ID in environment from returned ipn_id value',
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(['POST'])
@permission_classes([AllowAny])
@ratelimit(key='user', rate='10/m', method='POST', block=True)
def pesapal_submit_order(request):
    serializer = PesapalCheckoutSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    token, token_data = _pesapal_get_token()
    if not token:
        return Response(
            {
                'detail': 'Failed to authenticate with Pesapal',
                'error': token_data,
            },
            status=status.HTTP_502_BAD_GATEWAY,
        )

    merchant_reference = f"DEV-{uuid.uuid4().hex[:24].upper()}"

    auth_user = _request_user_or_none(request)

    order = Order.objects.create(
        buyer=auth_user,
        product=data['account_reference'],
        status='pending',
    )

    callback_url = data.get('callback_url') or settings.PESAPAL_CALLBACK_URL
    ipn_id, ipn_error = _resolve_or_register_ipn_id(token, callback_url)
    if ipn_error:
        return Response(ipn_error, status=status.HTTP_502_BAD_GATEWAY)

    fallback_email = ''
    if auth_user:
        fallback_email = auth_user.email

    payload = {
        'id': merchant_reference,
        'currency': data.get('currency', 'KES'),
        'amount': float(data['amount']),
        'description': data['description'],
        'callback_url': callback_url,
        'notification_id': ipn_id,
        'billing_address': {
            'email_address': data.get('email') or fallback_email,
            'phone_number': _normalize_phone(data.get('phone_number')),
            'country_code': 'KE',
            'first_name': data.get('first_name') or (auth_user.first_name if auth_user else '') or 'DevSoko',
            'last_name': data.get('last_name') or (auth_user.last_name if auth_user else '') or 'User',
        },
    }

    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json',
    }

    response = requests.post(settings.PESAPAL_SUBMIT_ORDER_URL, json=payload, headers=headers, timeout=30)
    response_data = _safe_json(response)

    checkout_url = _first_present(response_data, 'redirect_url', 'redirectUrl')
    order_tracking_id = _first_present(response_data, 'order_tracking_id', 'orderTrackingId', 'OrderTrackingId')

    transaction_user = auth_user
    if not transaction_user:
        transaction_user, _ = User.objects.get_or_create(
            username='pesapal_guest',
            defaults={'email': data.get('email', 'guest@devsoko.local')},
        )

    transaction = PesapalTransaction.objects.create(
        user=transaction_user,
        order=order,
        merchant_reference=merchant_reference,
        payment_method=data['payment_method'],
        amount=Decimal(str(data['amount'])),
        currency=data.get('currency', 'KES'),
        description=data['description'],
        checkout_url=checkout_url,
        order_tracking_id=order_tracking_id,
        request_payload=payload,
        response_payload=response_data,
        status='processing' if response.status_code < 400 else 'failed',
    )

    if response.status_code >= 400 or not checkout_url:
        return Response(
            {
                'detail': 'Pesapal order submission failed',
                'transaction': PesapalTransactionSerializer(transaction).data,
                'error': response_data,
            },
            status=status.HTTP_502_BAD_GATEWAY,
        )

    return Response(
        {
            'detail': 'Order submitted to Pesapal successfully',
            'checkout_url': transaction.checkout_url,
            'order_tracking_id': transaction.order_tracking_id,
            'merchant_reference': transaction.merchant_reference,
            'selected_method': transaction.payment_method,
            'supported_methods': PESAPAL_PAYMENT_OPTIONS,
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(['GET'])
@permission_classes([AllowAny])
@ratelimit(key='user', rate='20/m', method='GET', block=True)
def pesapal_transaction_status(request, merchant_reference):
    try:
        tx = PesapalTransaction.objects.get(merchant_reference=merchant_reference)
    except PesapalTransaction.DoesNotExist:
        return Response({'detail': 'Transaction not found'}, status=status.HTTP_404_NOT_FOUND)

    if not tx.order_tracking_id:
        return Response(
            {
                'detail': 'Order has no tracking id yet',
                'transaction': PesapalTransactionSerializer(tx).data,
            },
            status=status.HTTP_200_OK,
        )

    token, token_data = _pesapal_get_token()
    if not token:
        return Response(
            {'detail': 'Failed to authenticate with Pesapal', 'error': token_data},
            status=status.HTTP_502_BAD_GATEWAY,
        )

    headers = {'Authorization': f'Bearer {token}'}
    response = requests.get(
        settings.PESAPAL_TRANSACTION_STATUS_URL,
        params={'orderTrackingId': tx.order_tracking_id},
        headers=headers,
        timeout=30,
    )

    data = _safe_json(response)
    status_value = str(data.get('payment_status_description') or data.get('status') or '').lower()

    if 'completed' in status_value:
        tx.status = 'completed'
        if tx.order:
            tx.order.status = 'paid'
            tx.order.save(update_fields=['status'])
    elif 'failed' in status_value:
        tx.status = 'failed'
    elif 'cancel' in status_value:
        tx.status = 'cancelled'
    else:
        tx.status = 'processing'

    tx.status_payload = data
    tx.save(update_fields=['status', 'status_payload', 'updated_at'])

    return Response(
        {
            'transaction': PesapalTransactionSerializer(tx).data,
            'gateway_status': data,
        },
        status=status.HTTP_200_OK,
    )


@api_view(['POST'])
@permission_classes([AllowAny])
def pesapal_callback(request):
    data = request.data if isinstance(request.data, dict) else {}
    merchant_reference = data.get('merchant_reference') or request.query_params.get('merchant_reference')
    order_tracking_id = data.get('order_tracking_id') or request.query_params.get('OrderTrackingId')

    if not merchant_reference and not order_tracking_id:
        return Response({'detail': 'Missing transaction identifiers'}, status=status.HTTP_400_BAD_REQUEST)

    tx = None
    if merchant_reference:
        tx = PesapalTransaction.objects.filter(merchant_reference=merchant_reference).first()
    if not tx and order_tracking_id:
        tx = PesapalTransaction.objects.filter(order_tracking_id=order_tracking_id).first()

    if not tx:
        return Response({'detail': 'Transaction not found'}, status=status.HTTP_404_NOT_FOUND)

    status_value = str(data.get('status') or data.get('payment_status_description') or '').lower()
    if 'completed' in status_value:
        tx.status = 'completed'
        if tx.order:
            tx.order.status = 'paid'
            tx.order.save(update_fields=['status'])
    elif 'failed' in status_value:
        tx.status = 'failed'
    elif 'cancel' in status_value:
        tx.status = 'cancelled'
    else:
        tx.status = 'processing'

    tx.status_payload = data
    tx.save(update_fields=['status', 'status_payload', 'updated_at'])
    return Response({'detail': 'Callback received'}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_orders(request):
    orders = Order.objects.filter(buyer=request.user).order_by('-timestamp')
    return Response(OrderSerializer(orders, many=True).data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_pesapal_transactions(request):
    transactions = PesapalTransaction.objects.filter(user=request.user).order_by('-created_at')
    return Response(PesapalTransactionSerializer(transactions, many=True).data, status=status.HTTP_200_OK)


# Dynamic callback URL management for M-Pesa
_dynamic_callback_url = None


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@ratelimit(key='user', rate='5/m', method='POST', block=True)
def stk_push(request):
    payload = request.data.copy()
    payload.pop('product_id', None)

    serializer = MpesaRequestSerializer(data=payload)
    serializer.is_valid(raise_exception=True)

    order = Order.objects.create(
        buyer=request.user,
        product=serializer.validated_data.get('account_reference'),
        status='pending',
    )
    mpesa_request = serializer.save(order=order)

    access_token = _get_mpesa_access_token()
    if not access_token:
        return Response({'detail': 'Failed to obtain M-Pesa token'}, status=status.HTTP_502_BAD_GATEWAY)

    phone = _normalize_phone(mpesa_request.phone_number)
    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
    callback_url = _dynamic_callback_url or settings.MPESA_CALLBACK_URL

    req_payload = {
        'BusinessShortCode': settings.MPESA_SHORTCODE,
        'Password': _generate_mpesa_password(),
        'Timestamp': timestamp,
        'TransactionType': 'CustomerPayBillOnline',
        'Amount': int(float(mpesa_request.amount)),
        'PartyA': phone,
        'PartyB': settings.MPESA_SHORTCODE,
        'PhoneNumber': phone,
        'CallBackURL': callback_url,
        'AccountReference': mpesa_request.account_reference,
        'TransactionDesc': mpesa_request.transaction,
    }

    headers = {
        'Authorization': f'Bearer {access_token}',
        'Content-Type': 'application/json',
    }
    response = requests.post(settings.MPESA_STK_PUSH_URL, json=req_payload, headers=headers, timeout=30)
    response_data = _safe_json(response)

    mpesa_response = MpesaResponse.objects.create(
        request=mpesa_request,
        merchant_request_id=response_data.get('MerchantRequestID', ''),
        checkout_request_id=response_data.get('CheckoutRequestID', ''),
        response_description=response_data.get('ResponseDescription', ''),
        response_code=str(response_data.get('ResponseCode', '')),
        customer_message=response_data.get('CustomerMessage', ''),
    )

    if str(response_data.get('ResponseCode')) != '0':
        return Response(
            {'detail': 'STK push failed', 'gateway_response': response_data},
            status=status.HTTP_400_BAD_REQUEST,
        )

    return Response(MpesaResponseSerializer(mpesa_response).data, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([AllowAny])
def mpesa_callback(request):
    callback_data = request.data if isinstance(request.data, dict) else {}
    stk_callback = callback_data.get('Body', {}).get('stkCallback', {})
    checkout_request_id = stk_callback.get('CheckoutRequestID')

    if not checkout_request_id:
        return Response({'detail': 'Missing CheckoutRequestID'}, status=status.HTTP_400_BAD_REQUEST)

    mpesa_response = MpesaResponse.objects.filter(checkout_request_id=checkout_request_id).select_related('request__order').first()
    if not mpesa_response:
        return Response({'detail': 'Unknown transaction'}, status=status.HTTP_404_NOT_FOUND)

    result_code = stk_callback.get('ResultCode')
    result_desc = stk_callback.get('ResultDesc', '')
    mpesa_response.result_code = str(result_code)
    mpesa_response.result_desc = str(result_desc)
    mpesa_response.save(update_fields=['result_code', 'result_desc'])

    if str(result_code) == '0' and mpesa_response.request.order:
        mpesa_response.request.order.status = 'paid'
        mpesa_response.request.order.save(update_fields=['status'])

    return Response({'ResultCode': 0, 'ResultDesc': 'Accepted'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_ngrok_url(request):
    return Response(
        {
            'current_callback_url': _dynamic_callback_url or settings.MPESA_CALLBACK_URL,
            'is_dynamic': _dynamic_callback_url is not None,
        },
        status=status.HTTP_200_OK,
    )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def set_callback_url(request):
    serializer = CallbackURLSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    global _dynamic_callback_url
    _dynamic_callback_url = serializer.validated_data['callback_url']
    return Response({'success': True, 'callback_url': _dynamic_callback_url}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
@ratelimit(key='ip', rate='3/h', method='POST', block=True)
def register_user(request):
    return Response({'message': 'Registration handled on frontend'}, status=status.HTTP_200_OK)
