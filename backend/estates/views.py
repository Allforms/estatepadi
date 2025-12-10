from rest_framework import generics, status, permissions, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.contrib.auth import authenticate, login, logout
from django.utils import timezone
from django.http import HttpResponse, JsonResponse, Http404
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from django.core.files.base import ContentFile
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_CENTER
from io import BytesIO
from .models import *
from .serializers import *
from django.views.decorators.csrf import ensure_csrf_cookie
from django.utils.translation import gettext as _
from io import BytesIO
from .permissions import IsEstateAdmin
from postmarker.core import PostmarkClient
from django.conf import settings
from .tasks import *
from .decorators import subscription_required, admin_subscription_required
from django.core.cache import cache
from estates.tasks import sync_subscriptions_from_paystack
import json, logging, uuid
from django.shortcuts import get_object_or_404
import mimetypes
from rest_framework.views import APIView
from rest_framework.exceptions import PermissionDenied




logger = logging.getLogger(__name__)

# Authentication Views
@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def login_view(request):
    email = request.data.get('email') or request.data.get('username') # Using email as username - to be flexible i spcified both
    password = request.data.get('password')
    
    if email and password:
        user = authenticate(username=email, password=password)
        if user:
            if (user.role in ['resident', 'security']) and not user.is_approved:
                return Response({
                    'error': 'Your account is pending approval by estate admin'
                }, status=status.HTTP_403_FORBIDDEN)
            
            login(request, user)
            return Response({
                'message': 'Login successful',
                'user': UserSerializer(user).data
            })
        else:
            return Response({
                'error': 'Invalid credentials'
            }, status=status.HTTP_401_UNAUTHORIZED)
    print(request.data)
    return Response({
        'error': 'Username and password required'
    }, status=status.HTTP_400_BAD_REQUEST)
@api_view(['POST'])
def logout_view(request):
    logout(request)
    return Response({'message': 'Logged out successfully'})

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def register_view(request):
    serializer = UserRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()

        # Store email in session for verification
        request.session['pending_verification_email'] = user.email
        request.session.save()

        # Log activity
        ActivityLog.objects.create(
            user=user,
            estate=user.estate,
            type=ActivityLog.ActivityType.NEW_RESIDENT,
            description=f"{user.first_name} {user.last_name} registered and is pending approval.",
            related_id=user.id
        )

        return Response({
            'message': 'Registration successful. Please check your email for a verification code.',
            'user': UserSerializer(user).data
        }, status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class VerifyEmailView(generics.GenericAPIView):
    serializer_class = VerifyEmailSerializer
    permission_classes = [permissions.AllowAny] 

    def post(self, request, *args, **kwargs):
        # DETAILED DEBUG LOGGING
        logger.error(f"=== VERIFY EMAIL DETAILED DEBUG ===")
        logger.error(f"Request method: {request.method}")
        logger.error(f"Request content type: {request.content_type}")
        logger.error(f"Request META: {dict(request.META)}")
        logger.error(f"Raw request body: {request.body}")
        logger.error(f"Request data: {request.data}")
        logger.error(f"Request POST: {request.POST}")
        logger.error(f"Request FILES: {request.FILES}")
        logger.error(f"Session exists: {hasattr(request, 'session')}")
        
        if hasattr(request, 'session'):
            logger.error(f"Session key: {request.session.session_key}")
            logger.error(f"Session is empty: {request.session.is_empty()}")
            logger.error(f"Session keys: {list(request.session.keys())}")
            logger.error(f"Session items: {dict(request.session)}")
            logger.error(f"Session engine: {request.session.__class__}")
        
        # Try to parse JSON manually if needed
        try:
            if request.content_type == 'application/json' and request.body:
                body_data = json.loads(request.body.decode('utf-8'))
                logger.error(f"Manually parsed JSON: {body_data}")
            else:
                body_data = {}
        except Exception as e:
            logger.error(f"Failed to parse JSON: {e}")
            body_data = {}

        # Get email and code from multiple sources
        email_from_session = request.session.get('pending_verification_email') if hasattr(request, 'session') else None
        email_from_request_data = request.data.get('email')
        email_from_post = request.POST.get('email')
        email_from_body = body_data.get('email')
        
        code_from_request_data = request.data.get('code')
        code_from_post = request.POST.get('code')
        code_from_body = body_data.get('code')

        logger.error(f"Email sources - Session: {repr(email_from_session)}, Request.data: {repr(email_from_request_data)}, POST: {repr(email_from_post)}, Body: {repr(email_from_body)}")
        logger.error(f"Code sources - Request.data: {repr(code_from_request_data)}, POST: {repr(code_from_post)}, Body: {repr(code_from_body)}")

        # Use the first available email and code
        email = email_from_session or email_from_request_data or email_from_post or email_from_body
        code = code_from_request_data or code_from_post or code_from_body

        logger.error(f"Final values - Email: {repr(email)}, Code: {repr(code)}")

        if not email or not code:
            error_response = {
                'detail': 'Missing email or code.',
                'debug_info': {
                    'email_sources': {
                        'session': repr(email_from_session),
                        'request_data': repr(email_from_request_data),
                        'post': repr(email_from_post),
                        'body': repr(email_from_body),
                    },
                    'code_sources': {
                        'request_data': repr(code_from_request_data),
                        'post': repr(code_from_post),
                        'body': repr(code_from_body),
                    },
                    'final_values': {
                        'email': repr(email),
                        'code': repr(code),
                    },
                    'request_info': {
                        'method': request.method,
                        'content_type': request.content_type,
                        'has_session': hasattr(request, 'session'),
                        'session_key': request.session.session_key if hasattr(request, 'session') else None,
                        'raw_body': request.body.decode('utf-8', errors='ignore')[:200] + '...' if len(request.body) > 200 else request.body.decode('utf-8', errors='ignore'),
                    }
                }
            }
            logger.error(f"Returning error response: {error_response}")
            return Response(error_response, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=email)
            logger.error(f"Found user: {user.email}, verification_code: {user.verification_code}")
        except User.DoesNotExist:
            logger.error(f"User not found for email: {email}")
            return Response({'detail': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        if user.verification_code != code:
            logger.error(f"Code mismatch - Expected: {repr(user.verification_code)}, Got: {repr(code)}")
            return Response({'detail': 'Invalid verification code.'}, status=status.HTTP_400_BAD_REQUEST)

        user.is_active = True
        user.verification_code = None
        user.save()
        logger.error(f"User verified successfully: {email}")

        # Send account verified email
        try:
            from django.template.loader import render_to_string

            client = PostmarkClient(server_token=settings.POSTMARK_TOKEN)

            context = {
                'first_name': user.first_name,
                'support_email': settings.DEFAULT_FROM_EMAIL,
                'support_phone': '+2348137343312',
                'current_year': timezone.now().year,
            }

            html_content = render_to_string('estates/account_verified.html', context)
            text_content = f"Hello {user.first_name},\n\nYour email has been verified successfully. Your account is currently pending approval from your estate administrator.\n\nYou will receive a notification email once your account has been approved and you can access all platform features."

            client.emails.send(
                From=settings.POSTMARK_SENDER,
                To=user.email,
                Subject='Email Verified - Account Pending Approval',
                HtmlBody=html_content,
                TextBody=text_content,
                MessageStream='outbound'
            )
            logger.info(f"Account verified email sent to {email}")
        except Exception as e:
            logger.error(f"Failed to send account verified email to {email}: {str(e)}")

        # Clear session after verification
        if hasattr(request, 'session'):
            request.session.pop('pending_verification_email', None)

        return Response({'detail': 'Email verified successfully.'}, status=status.HTTP_200_OK)
class ResendVerificationView(generics.GenericAPIView):
    permission_classes = [permissions.AllowAny]
    
    def post(self, request, *args, **kwargs):
        email_from_session = request.session.get('pending_verification_email')
        email_from_request = request.data.get('email')
        email = email_from_session or email_from_request
        
        if not email:
            return Response({
                'detail': 'No pending verification or email provided.',
                'debug': {
                    'has_session_email': bool(email_from_session),
                    'has_request_email': bool(email_from_request),
                    'session_keys': list(request.session.keys()),
                }
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'detail': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        if user.is_active:
            return Response({'detail': 'Email already verified.'}, status=status.HTTP_400_BAD_REQUEST)

        # Rate limiting
        rate_limit_key = f'resend_verification_{email}'
        last_sent = cache.get(rate_limit_key)
        
        if last_sent and timezone.now() - last_sent < timedelta(minutes=1):
            return Response({
                'detail': 'Please wait 1 minute before requesting another code.',
                'retry_after': 60
            }, status=status.HTTP_429_TOO_MANY_REQUESTS)

        # Generate new code
        new_code = ''.join(random.choices(string.digits, k=6))
        user.verification_code = new_code
        user.save()

        try:
            # Send email using Postmarker
            client = PostmarkClient(server_token=settings.POSTMARK_TOKEN)
            client.emails.send(
                From=settings.POSTMARK_SENDER,
                To=user.email,
                Subject='Verify Your Estate Account',
                HtmlBody=render_to_string("estates/verify-email.html", {
                    "first_name": user.first_name,
                    "verification_code": user.verification_code,
                    "current_year": timezone.now().year,
                }),

                TextBody=f"Hello {user.first_name},\nYour verification code is: {user.verification_code}",
                MessageStream='outbound'  
            )
            
            # Set rate limit
            cache.set(rate_limit_key, timezone.now(), timeout=300)  # 5 minutes
            
            # Update session
            request.session['pending_verification_email'] = email
            
            return Response({
                'detail': 'Verification code sent successfully.',
                'email': email
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Failed to send verification email to {email}: {str(e)}")
            return Response({
                'detail': 'Failed to send verification email. Please try again.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class PasswordResetRequestView(generics.GenericAPIView):
    serializer_class = PasswordResetRequestSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data['email']

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # Always return 200 to prevent email enumeration
            return Response({"detail": "If this email exists, a reset code will be sent."}, status=status.HTTP_200_OK)

        # Expiry & cooldown windows
        expiry_minutes = 10      # for how long a code stays valid
        cooldown_minutes = 2     # for how soon they can request another email

        # Enforce cooldown (too soon since last request?)
        if (
            user.password_reset_code_created_at 
            and timezone.now() < user.password_reset_code_created_at + timedelta(minutes=cooldown_minutes)
        ):
            return Response(
                {"detail": f"Please wait at least {cooldown_minutes} minutes before requesting another code."},
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )

        # Reuse existing valid code if not expired
        if (
            user.password_reset_code 
            and user.password_reset_code_created_at 
            and timezone.now() < user.password_reset_code_created_at + timedelta(minutes=expiry_minutes)
        ):
            code = user.password_reset_code
        else:
            # Generate a new code
            code = str(uuid.uuid4()).replace('-', '')[:6].upper()
            user.password_reset_code = code
            user.password_reset_code_created_at = timezone.now()
            user.save()

        # Send email
        postmark = PostmarkClient(server_token=settings.POSTMARK_TOKEN)
        postmark.emails.send(
            From=settings.DEFAULT_FROM_EMAIL,
            To=email,
            Subject="Password Reset Code",
            HtmlBody=render_to_string("estates/password-reset-email.html", {
                "first_name": user.first_name,
                "reset_code": code,
                "current_year": timezone.now().year,
            }),
            TextBody=f"Hi {user.first_name},\nYour password reset code is: {code}",
            MessageStream='outbound'
        )

        return Response({"detail": "If this email exists, a reset code has been sent."}, status=status.HTTP_200_OK)

class PasswordResetConfirmView(generics.GenericAPIView):
    serializer_class = PasswordResetConfirmSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"detail": "Password reset successful."}, status=status.HTTP_200_OK)
@api_view(['GET', 'PATCH'])
@permission_classes([permissions.IsAuthenticated])
def resident_profile(request):
    user = request.user

    if request.method == 'GET':
        serializer = UserSerializer(user)
        return Response(serializer.data)

    if request.method == 'PATCH':
        serializer = UserSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

class EstateListView(generics.ListCreateAPIView):
    queryset = Estate.objects.all()
    serializer_class = EstateSerializer
    permission_classes = [permissions.AllowAny]

class EstateDetailView(generics.RetrieveUpdateAPIView):
    queryset = Estate.objects.all()
    serializer_class = EstateSerializer

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.IsAuthenticated()]
        # Allow only role-based admins to update
        if self.request.user.role == 'admin':
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated()] 

    def get_queryset(self):
        # Users can only view their own estate
        return Estate.objects.filter(id=self.request.user.estate.id)

    def update(self, request, *args, **kwargs):
        if request.user.role != 'admin':
            return Response({'error': 'Admin access required.'}, status=403)
        return super().update(request, *args, **kwargs)

class EstateLeadershipDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = EstateLeadershipSerializer

    def get_queryset(self):
        estate_id = self.kwargs.get('estate_id')
        return EstateLeadership.objects.filter(estate_id=estate_id)

    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return [permissions.IsAuthenticated(), IsEstateAdmin()]
        return [permissions.IsAuthenticated()]

class EstateLeadershipListView(generics.ListCreateAPIView):
    serializer_class = EstateLeadershipSerializer

    def get_queryset(self):
        estate_id = self.kwargs.get('estate_id')
        return EstateLeadership.objects.filter(estate_id=estate_id)

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.IsAuthenticated()]
        if self.request.user.role == 'admin':
            return [permissions.IsAuthenticated()]
        return [permissions.IsAdminUser()]  # Non-admins can't create

    def perform_create(self, serializer):
        estate_id = self.kwargs.get('estate_id')
        if self.request.user.role != 'admin':
            return Response({'error': 'Admin access required'}, status=403)
        serializer.save(estate_id=estate_id)

# Admin Views
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
@admin_subscription_required
def pending_residents_view(request):
    if request.user.role != 'admin':
        return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
    
    pending_residents = User.objects.filter(
        estate=request.user.estate,
        role='resident',
        is_approved=False
    )
    
    # Optional: Only log if there are pending residents
    if pending_residents.exists():
        ActivityLog.objects.create(
            user=request.user,
            estate=request.user.estate,  
            type=ActivityLog.ActivityType.NEW_RESIDENT,
            description=_(
                f"Admin {request.user.first_name} viewed {pending_residents.count()} pending resident(s)."
            ),
            related_id=request.user.estate.id
        )
    
    serializer = UserSerializer(pending_residents, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@admin_subscription_required
def approve_resident_view(request, user_id):
    if request.user.role != 'admin':
        return Response({'error': 'Admin access required'}, 
                       status=status.HTTP_403_FORBIDDEN)
    
    try:
        resident = User.objects.get(id=user_id, estate=request.user.estate)
        resident.is_approved = True
        resident.save()
     

        # Send approval email asynchronously
        send_account_approved_email.delay(resident.email, resident.first_name)
        
        return Response({'message': 'Resident approved successfully'})
    except User.DoesNotExist:
        return Response({'error': 'Resident not found'}, 
                       status=status.HTTP_404_NOT_FOUND)

@api_view(['DELETE'])
def delete_resident_view(request, user_id):
    if request.user.role != 'admin':
        return Response({'error': 'Admin access required'}, 
                       status=status.HTTP_403_FORBIDDEN)
    
    try:
        resident = User.objects.get(id=user_id, estate=request.user.estate)
        resident.delete()
        return Response({'message': 'Resident deleted successfully'})
    except User.DoesNotExist:
        return Response({'error': 'Resident not found'}, 
                       status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def residents_list_view(request):
    # Only admins may list all residents in their estate
    if request.user.role != 'admin':
        return Response(
            {'error': 'Admin access required'},
            status=status.HTTP_403_FORBIDDEN
        )

    residents = User.objects.filter(
        estate=request.user.estate,
    )
    serializer = UserSerializer(residents, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@admin_subscription_required
def generate_residents_pdf(request):
    if request.user.role != 'admin':
        return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)

    residents = User.objects.filter(
        estate=request.user.estate,
        is_approved=True
    )   

    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    elements = []

    styles = getSampleStyleSheet()

    # Title & Generated Time
    elements.append(Paragraph(f"<b>Residents Report - {request.user.estate.name}</b>", styles['Title']))
    elements.append(Paragraph(f"Generated on: {timezone.now().strftime('%Y-%m-%d %H:%M:%S')}", styles['Normal']))
    elements.append(Spacer(1, 12))

    # Table Headers
    data = [
        ["Name", "Email", "Phone", "Address", "House Type", "Type"]
    ]

    # Populate table data
    for resident in residents:
        data.append([
            resident.get_full_name(),
            resident.email,
            resident.phone_number,
            resident.home_address,
            resident.house_type,
            resident.resident_type
        ])

    # Create table
    table = Table(data, colWidths=[100, 120, 80, 180, 60, 80])

    # Style table
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.black),
    ]))

    elements.append(table)

    # Build PDF
    doc.build(elements)
    buffer.seek(0)

    response = HttpResponse(buffer, content_type='application/pdf')
    response['Content-Disposition'] = 'attachment; filename="residents_report.pdf"'
    return response


class VisitorCodeListCreateView(generics.ListCreateAPIView):
    serializer_class = VisitorCodeSerializer
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['created_at']
    ordering = ['-created_at'] 
    
    def get_queryset(self):
        return VisitorCode.objects.filter(resident=self.request.user)
    
    def perform_create(self, serializer):
        visitor_code = serializer.save(resident=self.request.user)

        # Log activity after code generation
        ActivityLog.objects.create(
            user=self.request.user,
            estate=self.request.user.estate,  
            type=ActivityLog.ActivityType.VISITOR_CODE,
            description=f"Visitor code generated for {visitor_code.visitor_name} by {self.request.user.email}.",
            related_id=visitor_code.id
        )

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def verify_visitor_code(request):
    code = request.data.get('code')
    if not code:
        return Response({'error': 'Code is required'}, 
                       status=status.HTTP_400_BAD_REQUEST)
    
    try:
        visitor_code = VisitorCode.objects.get(code=code)
        if visitor_code.is_valid():
            visitor_code.is_used = True
            visitor_code.used_at = timezone.now()
            visitor_code.save()
            
            return Response({
                'message': 'Code verified successfully',
                'visitor_name': visitor_code.visitor_name,
                'resident': visitor_code.resident.email,
                'estate': visitor_code.resident.estate.name
            })
        else:
            return Response({'error': 'Code is expired or already used'}, 
                           status=status.HTTP_400_BAD_REQUEST)
    except VisitorCode.DoesNotExist:
        return Response({'error': 'Invalid code'}, 
                       status=status.HTTP_404_NOT_FOUND)
    
# Due Management Views
class DueListCreateView(generics.ListCreateAPIView):
    serializer_class = DueSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.role == 'admin':
            return Due.objects.filter(estate=self.request.user.estate)
            
        else:
            return Due.objects.filter(estate=self.request.user.estate)
    def perform_create(self, serializer):
        if self.request.user.role != 'admin':
            return Response({'error': 'Admin access required'}, 
                           status=status.HTTP_403_FORBIDDEN)
        serializer.save(estate=self.request.user.estate, created_by=self.request.user)
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

class DueRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Due.objects.all()
    serializer_class = DueSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Due.objects.filter(estate=self.request.user.estate)

    def perform_update(self, serializer):
        if self.request.user.role != 'admin':
            return Response({"error":"Admin access required"}, status=status.HTTP_403_FORBIDDEN)
        serializer.save()

    def perform_destroy(self, instance):
        if self.request.user.role != 'admin':
            return Response({"error":"Admin access required"}, status=status.HTTP_403_FORBIDDEN)
        instance.delete()
class DuePaymentListCreateView(generics.ListCreateAPIView):
    serializer_class = DuePaymentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.role == 'admin':
            return DuePayment.objects.filter(due__estate=self.request.user.estate)
        else:
            return DuePayment.objects.filter(resident=self.request.user)
    
    def perform_create(self, serializer):
        # ensure due belongs to the user's estate
        due = serializer.validated_data.get('due')

        if due.estate != self.request.user.estate:
            raise PermissionDenied("you cannot submit payment to another estate ")
        payment = serializer.save(resident=self.request.user)

        # Log pending payment activity
        ActivityLog.objects.create(
            user=self.request.user,
            estate=self.request.user.estate,  
            type=ActivityLog.ActivityType.PAYMENT,
            description=f"Payment evidence submitted for due '{payment.due.title}'. Status: Pending.",
            related_id=payment.id
        )

         # Trigger notification task asynchronously
        send_due_payment_notification.delay(payment.id)

@api_view(['GET'])
def pending_payments_view(request):
    if request.user.role != 'admin':
        return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
    
    pending_payments = DuePayment.objects.filter(
        due__estate=request.user.estate,
        status='pending'
    )
    serializer = DuePaymentSerializer(pending_payments, many=True)
    return Response(serializer.data)

def generate_payment_receipt(payment):
    """
    Generate a PDF receipt for an approved payment
    """
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=72, leftMargin=72,
                           topMargin=72, bottomMargin=18)
    
    # Container for the 'Flowable' objects
    elements = []
    
    # Define styles
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        spaceAfter=30,
        alignment=TA_CENTER,
        textColor=colors.darkblue
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=16,
        spaceAfter=12,
        textColor=colors.darkblue
    )
    
    normal_style = styles['Normal']
    
    # Style for wrapping text in table cells
    wrap_style = ParagraphStyle(
        'WrapStyle',
        parent=styles['Normal'],
        fontSize=11,
        leading=13,
        wordWrap='LTR'
    )
    
    # Header
    title = Paragraph("PAYMENT RECEIPT", title_style)
    elements.append(title)
    elements.append(Spacer(1, 20))
    
    # Estate Information (if available)
    if hasattr(payment, 'due') and hasattr(payment.due, 'estate'):
        estate_info = Paragraph(f"<b>{payment.due.estate.name}</b><br/>"
                               f"{getattr(payment.due.estate, 'address', '')}", 
                               normal_style)
        elements.append(estate_info)
        elements.append(Spacer(1, 20))
    
    # Receipt Details Table
    receipt_data = [
        ['Receipt Number:', f'RCP-{payment.id}-{payment.approved_at.strftime("%Y%m%d")}'],
        ['Date Issued:', payment.approved_at.strftime("%B %d, %Y at %I:%M %p")],
        ['Status:', 'APPROVED'],
    ]
    
    receipt_table = Table(receipt_data, colWidths=[2*inch, 3*inch])
    receipt_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 11),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    
    elements.append(receipt_table)
    elements.append(Spacer(1, 30))
    
    # Payment Information
    payment_heading = Paragraph("Payment Information", heading_style)
    elements.append(payment_heading)
    
    # Get description and format it properly for table display
    due_description = getattr(payment.due, 'description', 'N/A')
    if due_description and due_description != 'N/A':
        # Wrap long descriptions in Paragraph for proper text wrapping
        description_para = Paragraph(due_description, wrap_style)
    else:
        description_para = 'N/A'
    
    payment_data = [
        ['Resident Name:', f"{payment.resident.first_name} {payment.resident.last_name}"],
        ['Due Title:', payment.due.title],
        ['Due Description:', description_para],  # Use Paragraph for text wrapping
        ['Original Amount:', f"₦{payment.due.amount:,.2f}"],
        ['Amount Paid:', f"₦{payment.amount_paid:,.2f}"]
    ]
    
    # Increased column widths, especially for the second column to accommodate longer descriptions
    payment_table = Table(payment_data, colWidths=[1.8*inch, 4.2*inch])
    payment_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),  # Top alignment for better readability
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 11),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),  # Increased padding for better spacing
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 1, colors.lightgrey),
        ('BACKGROUND', (0, 0), (0, -1), colors.lightblue),
        # Special styling for the description row to allow more height
        ('ROWBACKGROUNDS', (0, 2), (-1, 2), [colors.white]),  # Description row background
    ]))
    
    elements.append(payment_table)
    elements.append(Spacer(1, 30))
    
    # Approval Information
    approval_heading = Paragraph("Approval Information", heading_style)
    elements.append(approval_heading)
    
    # Format admin notes with proper text wrapping
    admin_notes = payment.admin_notes if payment.admin_notes else 'No additional notes'
    if admin_notes and len(admin_notes) > 50:
        notes_para = Paragraph(admin_notes, wrap_style)
    else:
        notes_para = admin_notes
    
    approval_data = [
        ['Approved By:', f"{payment.approved_by.first_name} {payment.approved_by.last_name}" if payment.approved_by else 'Admin'],
        ['Approval Date:', payment.approved_at.strftime("%B %d, %Y at %I:%M %p")],
        ['Admin Notes:', notes_para],  # Use Paragraph for text wrapping if needed
    ]
    
    approval_table = Table(approval_data, colWidths=[1.8*inch, 4.2*inch])
    approval_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),  # Top alignment for better readability
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 11),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),  # Increased padding
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 1, colors.lightgrey),
        ('BACKGROUND', (0, 0), (0, -1), colors.lightgreen),
    ]))
    
    elements.append(approval_table)
    elements.append(Spacer(1, 50))
    
    # Footer
    footer_text = Paragraph(
        "This is an official receipt for the approved payment. "
        "Please keep this receipt for your records.",
        ParagraphStyle(
            'Footer',
            parent=normal_style,
            fontSize=10,
            alignment=TA_CENTER,
            textColor=colors.grey
        )
    )
    elements.append(footer_text)
    
    # Build PDF
    doc.build(elements)
    
    # Get the value of the BytesIO buffer and return it
    pdf_data = buffer.getvalue()
    buffer.close()
    
    return pdf_data

@api_view(['POST'])
def approve_payment_view(request, payment_id):
    if request.user.role != 'admin':
        return Response({'error': 'Admin access required'},
                        status=status.HTTP_403_FORBIDDEN)
    
    try:
        payment = DuePayment.objects.get(
            id=payment_id, 
            due__estate=request.user.estate
        )
        
        # Update payment status
        payment.status = 'approved'
        payment.approved_by = request.user
        payment.approved_at = timezone.now()
        payment.admin_notes = request.data.get('admin_notes', '')
        payment.save()

        # Generate receipt PDF
        try:
            pdf_data = generate_payment_receipt(payment)
            
            # Create filename
            receipt_filename = f"receipt_{payment.id}_{payment.approved_at.strftime('%Y%m%d_%H%M%S')}.pdf"
            
            # Save the PDF file to the payment model
            # receipt = models.FileField(upload_to='receipts/', null=True, blank=True)
            
            if hasattr(payment, 'receipt'):
                payment.receipt.save(
                    receipt_filename,
                    ContentFile(pdf_data),
                    save=True
                )
            
        except Exception as e:
            # Log the error but don't fail the approval process
            print(f"Error generating receipt: {str(e)}")
        
        # Create activity log
        ActivityLog.objects.create(
            user=payment.resident,
            estate=request.user.estate, 
            type=ActivityLog.ActivityType.PAYMENT,
            description=f"Payment for due '{payment.due.title}' approved by admin.",
            related_id=payment.id
        )
                         
       

        # Send approval email asynchronously
        send_payment_approved_email.delay(
            recipient_email=payment.resident.email,
            resident_name=payment.resident.first_name,
            due_title=payment.due.title,
            amount=payment.amount_paid,
            approved_by=str(payment.approved_by.first_name) if payment.approved_by else 'Admin',
        )
                
        return Response({
            'message': 'Payment approved successfully',
            'receipt_url': payment.receipt.url if hasattr(payment, 'receipt') and payment.receipt else None
        })
        
    except DuePayment.DoesNotExist:
        return Response({'error': 'Payment not found'},
                        status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def reject_payment_view(request, payment_id):
    # Only admins can reject payments
    if request.user.role != 'admin':
        return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)

    try:
        payment = DuePayment.objects.get(
            id=payment_id,
            due__estate=request.user.estate
        )
    except DuePayment.DoesNotExist:
        return Response({'error': 'Payment not found'}, status=status.HTTP_404_NOT_FOUND)

    # Update status to 'rejected'
    payment.status = 'rejected'
    payment.approved_by = request.user            # track who rejected
    payment.approved_at = timezone.now()          # reuse approved_at field
    payment.admin_notes = request.data.get('admin_notes', '')
    payment.save()

    # Log the rejection in ActivityLog
    ActivityLog.objects.create(
        user=payment.resident,
        estate=request.user.estate,
        type=ActivityLog.ActivityType.PAYMENT,
        description=f"Payment for '{payment.due.title}' rejected by admin.",
        related_id=payment.id
    )

   
    return Response({'message': 'Payment rejected successfully'})

# Dashboard Views
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
@subscription_required
def dashboard_view(request):
    estate = request.user.estate
    if request.user.role == 'admin':
        total_residents = User.objects.filter(
            estate=estate, 
            is_approved=True
        ).count()
        pending_residents = User.objects.filter(
            estate=estate, 
            role='resident', 
            is_approved=False
        ).count()
        pending_payments = DuePayment.objects.filter(
            due__estate=estate, 
            status='pending'
        ).count()

        visitor_codes = VisitorCode.objects.filter(
            resident__estate=estate
        ).count()

        leadership = EstateLeadershipSerializer(
            estate.leadership.all(), many=True
        ).data

        estate_dues = DueSerializer(
            estate.estate_dues.all(), many=True
        ).data

        announcements = AnnouncementSerializer(
            estate.announcements.all(), many=True
        ).data
        
        return Response({
            'visitor_codes_generated': visitor_codes,
            'total_residents': total_residents,
            'pending_residents': pending_residents,
            'pending_payments': pending_payments,
            'estate': EstateSerializer(estate).data,
            'leadership': leadership,
            'estate_dues': estate_dues,
            'announcements': announcements
        })
    else:
        visitor_codes = VisitorCode.objects.filter(
            resident=request.user
        ).count()
        pending_payments = DuePayment.objects.filter(
            resident=request.user, 
            status='pending'
        ).count()

        leadership = EstateLeadershipSerializer(
            estate.leadership.all(), many=True
        ).data

        estate_dues = DueSerializer(
            estate.estate_dues.all(), many=True
        ).data
        announcements = AnnouncementSerializer(
            estate.announcements.all(), many=True
        ).data
        
        return Response({
            'visitor_codes_generated': visitor_codes,
            'pending_payments': pending_payments,
            'estate': EstateSerializer(estate).data,
            'leadership': leadership,
            'estate_dues': estate_dues,
            'announcements': announcements
        })


 
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def payment_records_pdf_view(request):
    # Only admins can export
    if request.user.role != 'admin':
        return Response({'error': 'Admin access required'}, status=403)

    # Fetch all payments for this estate
    payments = DuePayment.objects.filter(due__estate=request.user.estate).select_related('resident', 'due')

    # Begin PDF build
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    styles = getSampleStyleSheet()
    elements = []

    # Title & timestamp
    elements.append(Paragraph(f"<b>All Payment Records - {request.user.estate.name}</b>", styles['Title']))
    elements.append(Paragraph(f"Generated on: {timezone.now().strftime('%Y-%m-%d %H:%M:%S')}", styles['Normal']))
    elements.append(Spacer(1, 12))

    # Table header
    data = [
        ['Resident', 'Description', 'Amount', 'Date', 'Status']
    ]

    # Populate rows
    for p in payments:
        resident_name = f"{p.resident.first_name} {p.resident.last_name}"
        description   = p.due.title
        amount_str    = f"₦{p.amount_paid:.2f}"
        date_str      = timezone.localtime(p.payment_date).strftime('%Y-%m-%d')
        status        = p.status.capitalize()

        data.append([resident_name, description, amount_str, date_str, status])

    # Create table
    table = Table(data, colWidths=[120, 150, 80, 80, 80])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR',   (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN',       (2, 1), (4, -1), 'RIGHT'),
        ('FONTNAME',    (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE',    (0, 0), (-1, 0), 10),
        ('BOTTOMPADDING',(0,0),(-1,0),8),
        ('GRID',        (0, 0), (-1, -1), 0.5, colors.black),
    ]))

    elements.append(table)
    elements.append(Spacer(1, 12))

    doc.build(elements)
    buffer.seek(0)

    # Stream back as PDF
    response = HttpResponse(buffer, content_type='application/pdf')
    response['Content-Disposition'] = 'attachment; filename="payment_records.pdf"'
    return response

@ensure_csrf_cookie
def get_csrf_token(request):
    return JsonResponse({"detail": "CSRF cookie set"})

class ActivityLogListView(generics.ListAPIView):
    """
    GET /api/activity-log/
    - Admins see all logs for their estate (logs by any user in that estate).
    - Residents see only their own logs.
    """
    serializer_class = ActivityLogSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None 

    def get_queryset(self):
        user = self.request.user

        # Admin: see all activity for your estate
        if user.role == 'admin':
            # Assumes your User model has an `estate` FK
            return ActivityLog.objects.filter(
                user__estate=user.estate
            ).order_by('-created_at')

        # Resident: see only your own activity
        return ActivityLog.objects.filter(
            user=user
        ).order_by('-created_at')

class AnnouncementListCreateView(generics.ListCreateAPIView):
    serializer_class = AnnouncementSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated(), IsEstateAdmin()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        return Announcement.objects.filter(
            estate=self.request.user.estate
        ).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(
            created_by=self.request.user,
            estate=self.request.user.estate
        )

class AnnouncementRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = AnnouncementSerializer

    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return [permissions.IsAuthenticated(), IsEstateAdmin()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        return Announcement.objects.filter(estate=self.request.user.estate)

def sync_subscriptions_view(request):
    results = sync_subscriptions_from_paystack()  # run synchronously
    return JsonResponse({"results": results})

class ContactSupportView(generics.CreateAPIView):
    serializer_class = ContactSupportSerializer
    permission_classes = [permissions.AllowAny]

    def perform_create(self, serializer):
        user = self.request.user
        data = serializer.validated_data

        # metadata
        timestamp = timezone.now()

        # prepare context for email template
        context = {
            "user": user,
            "email": data.get("email") or user.email,
            "subject": data["subject"],
            "message": data["message"],
            "timestamp": timestamp,
        }

        # Initialize Postmark client
        client = PostmarkClient(server_token=settings.POSTMARK_TOKEN)

        # 1. Confirmation email to the user
        client.emails.send(
            From=settings.POSTMARK_SENDER,
            To=data.get("email") or user.email,
            Subject="We've received your support request",
            HtmlBody=render_to_string("estates/support-email-received.html", context),
            MessageStream="outbound",
        )

        # 2. Forward the message to your support team
        client.emails.send(
            From=settings.POSTMARK_SENDER,
            To=settings.SUPPORT_EMAIL,
            Subject=f"New Support Request from {data.get('email') or user.email}",
            HtmlBody=render_to_string("estates/support-email-received.html", context),
            MessageStream="outbound",
        )

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def download_receipt_view(request, payment_id):
    """
    Download or view payment receipt PDF
    Optimized for mobile apps and WebView environments
    """
    try:
        payment = get_object_or_404(
            DuePayment,
            id=payment_id,
            due__estate=request.user.estate
        )

        # Check if user has permission to view this receipt
        # Either the resident who made the payment or an admin
        if request.user.role != 'admin' and payment.resident != request.user:
            return Response({'error': 'Permission denied'},
                          status=status.HTTP_403_FORBIDDEN)

        # Check if payment is approved and has a receipt
        if payment.status != 'approved' or not payment.receipt:
            return Response({'error': 'Receipt not available'},
                          status=status.HTTP_404_NOT_FOUND)

        # Get the file
        receipt_file = payment.receipt

        # Determine content type
        content_type, _ = mimetypes.guess_type(receipt_file.name)
        if content_type is None:
            content_type = 'application/pdf'

        # Seek to beginning to ensure proper reading
        receipt_file.seek(0)

        # Read file content
        file_content = receipt_file.read()

        # Create response with proper headers for mobile compatibility
        response = HttpResponse(file_content, content_type=content_type)

        # Set filename for download
        filename = f"receipt_payment_{payment.id}.pdf"

        # Use RFC 6266 compliant Content-Disposition header
        # This works better with mobile apps and WebViews
        response['Content-Disposition'] = f'attachment; filename="{filename}"; filename*=UTF-8\'\'{filename}'

        # Add additional headers for better mobile compatibility
        response['Content-Length'] = len(file_content)
        response['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        response['Pragma'] = 'no-cache'
        response['Expires'] = '0'

        # Add CORS headers for WebView access
        response['Access-Control-Allow-Origin'] = '*'
        response['Access-Control-Expose-Headers'] = 'Content-Disposition, Content-Length'

        return response

    except DuePayment.DoesNotExist:
        raise Http404("Payment not found")

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def view_receipt_view(request, payment_id):
    """
    View payment receipt in browser (inline)
    """
    try:
        payment = get_object_or_404(
            DuePayment, 
            id=payment_id,
            due__estate=request.user.estate
        )
        
        # Check permissions
        if request.user.role != 'admin' and payment.resident != request.user:
            return Response({'error': 'Permission denied'}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        # Check if receipt exists
        if payment.status != 'approved' or not payment.receipt:
            return Response({'error': 'Receipt not available'}, 
                          status=status.HTTP_404_NOT_FOUND)
        
        # Return file for inline viewing
        response = HttpResponse(payment.receipt.read(), content_type='application/pdf')
        response['Content-Disposition'] = 'inline'
        
        return response
        
    except DuePayment.DoesNotExist:
        raise Http404("Payment not found")

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def payment_receipt_info(request, payment_id):
    """
    Get receipt information (for frontend to check if receipt is available)
    """
    try:
        payment = get_object_or_404(
            DuePayment, 
            id=payment_id,
            due__estate=request.user.estate
        )
        
        # Check permissions
        if request.user.role != 'admin' and payment.resident != request.user:
            return Response({'error': 'Permission denied'}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        has_receipt = payment.status == 'approved' and bool(payment.receipt)
        
        return Response({
            'payment_id': payment.id,
            'has_receipt': has_receipt,
            'status': payment.status,
            'approved_at': payment.approved_at,
            'receipt_url': f'/api/payments/{payment_id}/receipt/view/' if has_receipt else None,
            'download_url': f'/api/payments/{payment_id}/receipt/download/' if has_receipt else None
        })
        
    except DuePayment.DoesNotExist:
        return Response({'error': 'Payment not found'}, 
                      status=status.HTTP_404_NOT_FOUND)
    
#Artisan and Domestic Staff Views
class ArtisanOrDomesticStaffListCreateView(generics.ListCreateAPIView):
    serializer_class = ArtisanOrDomesticStaffSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = ArtisanOrDomesticStaff.objects.all()

        # Restrict data access
        if user.role == "resident":
            queryset = queryset.filter(resident=user)
        elif user.role in ["admin", "security"]:
            queryset = queryset.filter(estate=user.estate)
        else:
            return ArtisanOrDomesticStaff.objects.none()

        # Filtering by status
        status_param = self.request.query_params.get("status")
        if status_param in ["active", "removed"]:
            queryset = queryset.filter(status=status_param)

        return queryset

    def perform_create(self, serializer):
        user = self.request.user
        estate = user.estate
        staff = serializer.save(resident=user, estate=estate)

        # Create activity log
        ActivityLog.objects.create(
            user=user,
            estate=estate,
            type=ActivityLog.ActivityType.NEWARTISAN_DOMESTICSTAFF,
            description=f"New {staff.role} '{staff.name}' registered by {user.get_full_name() or user.email}.",
            related_id=staff.id
        )


class ArtisanOrDomesticStaffDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ArtisanOrDomesticStaffSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == "resident":
            return ArtisanOrDomesticStaff.objects.filter(resident=user)
        elif user.role in ["admin", "security"]:
            return ArtisanOrDomesticStaff.objects.filter(estate=user.estate)
        return ArtisanOrDomesticStaff.objects.none()


class DisableArtisanOrDomesticStaffView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        try:
            staff = ArtisanOrDomesticStaff.objects.get(pk=pk)
        except ArtisanOrDomesticStaff.DoesNotExist:
            return Response({"detail": "Staff not found."}, status=status.HTTP_404_NOT_FOUND)

        user = request.user
        if user.role == "resident" and staff.resident != user:
            return Response({"detail": "You do not have permission to disable this staff."}, status=status.HTTP_403_FORBIDDEN)

        if user.role in ["admin", "security"] and staff.estate != user.estate:
            return Response({"detail": "This staff does not belong to your estate."}, status=status.HTTP_403_FORBIDDEN)

        reason = request.data.get("removal_reason", None)

        staff.status = "removed"
        if reason:
            staff.removal_reason = reason
        staff.save()

        serializer = ArtisanOrDomesticStaffSerializer(staff)
        return Response(serializer.data, status=status.HTTP_200_OK)

class AlertListCreateView(generics.ListCreateAPIView):
    serializer_class = AlertSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """
        Only return alerts within the logged-in user's estate.
        """
        user = self.request.user
        return Alert.objects.filter(estate=user.estate).order_by("-created_at")

    def perform_create(self, serializer):
        user = self.request.user
        estate = user.estate

        try:
            alert = serializer.save(sender=user, estate=estate)
            
            ActivityLog.objects.create(
                user=user,
                estate=estate,
                type=ActivityLog.ActivityType.NEW_ALERT,
                description=f"New alert '{alert.alert_type}' created by {user.get_full_name() or user.email}.",
                related_id=alert.id
            )

            # Recipients logic
            if user.role == "resident":
                recipients = User.objects.filter(estate=estate, role__in=["admin", "security"])
            elif user.role == "admin":
                recipients = User.objects.filter(estate=estate, role__in=["resident", "security"])
            elif user.role == "security":
                recipients = User.objects.filter(estate=estate, role__in=["resident", "admin"])
            else:
                recipients = User.objects.none()

            # Send notifications (with error handling)
            for recipient in recipients:
                try:
                    if recipient.email:
                        send_email_alert.delay(recipient.email, alert.id)
                    if recipient.phone_number:
                        send_sms_alert.delay(recipient.phone_number, alert.id)
                except Exception as e:
                    import logging
                    logger = logging.getLogger(__name__)
                    logger.error(f"Notification failed for user {recipient.id}: {str(e)}")
                    
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.exception(f"Alert creation failed: {str(e)}")
            raise

