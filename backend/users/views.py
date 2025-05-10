from rest_framework import viewsets, generics, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth import get_user_model
from .models import UserProfile
from .serializers import UserSerializer, UserProfileSerializer, UserRegistrationSerializer
from django.shortcuts import get_object_or_404
from django.utils.http import urlsafe_base64_decode
from django.contrib.auth.tokens import default_token_generator
from rest_framework.views import APIView
from .utils import send_activation_email, send_password_reset_email
from decouple import config


User = get_user_model()



class ActivateAccountView(APIView):
    permission_classes = [AllowAny]
    def get(self, request, uidb64, token):
        import logging
        from django.shortcuts import render
        from django.conf import settings
        logger = logging.getLogger(__name__)
        
        logger.info(f"Activation attempt with uidb64={uidb64}, token={token}")
        
        try:
            uid = urlsafe_base64_decode(uidb64).decode()
            logger.info(f"Decoded uid: {uid}")
            user = User.objects.get(pk=uid)
            logger.info(f"Found user: {user.username}, current is_active={user.is_active}")
        except (TypeError, ValueError, OverflowError) as e:
            logger.error(f"Error decoding uidb64: {str(e)}")
            return Response({'error': 'Invalid activation link format'}, status=status.HTTP_400_BAD_REQUEST)
        except User.DoesNotExist:
            logger.error(f"No user found with id {uid}")
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        if default_token_generator.check_token(user, token):
            logger.info(f"Token is valid for user {user.username}")
            user.is_active = True
            user.save()
            logger.info(f"User {user.username} activated successfully, is_active={user.is_active}")
            
            # Get the frontend URL from environment or use a default
            try:
                frontend_url = config('FRONTEND_URL', default='http://localhost:5173')
                login_url = f"{frontend_url}/login"
            except:
                # Fallback to a default URL if configuration is not available
                login_url = 'http://localhost:5173/login'
            
            # Render the success template with the login URL
            return render(request, 'users/activation_success.html', {
                'login_url': login_url,
                'username': user.username
            })
        else:
            logger.error(f"Invalid token for user {user.username}")
            return Response({'error': 'Activation token is invalid or expired'}, status=status.HTTP_400_BAD_REQUEST)


class UserRegistrationView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]
    
    def perform_create(self, serializer):
        user = serializer.save(is_active=False)
      

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        if self.action == 'create':
            return [AllowAny()]
        return super().get_permissions()
    
    def get_queryset(self):
        user = self.request.user
        if user.is_staff or user.user_type == 'admin':
            return User.objects.all()
        return User.objects.filter(id=user.id)
    
    
    

class UserProfileViewSet(viewsets.ModelViewSet):
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.is_staff or user.user_type == 'admin':
            return UserProfile.objects.all()
        return UserProfile.objects.filter(user=user)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user(request):
    serializer = UserSerializer(request.user)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_profile(request):
    """Custom endpoint to update both user and profile data in one request"""
    user = request.user
    
    # Update user fields
    if 'first_name' in request.data:
        user.first_name = request.data['first_name']
    if 'last_name' in request.data:
        user.last_name = request.data['last_name']
    if 'email' in request.data:
        user.email = request.data['email']
    if 'phone_number' in request.data:
        user.phone_number = request.data['phone_number']
    if 'address' in request.data:
        user.address = request.data['address']
    
    # Handle password change if provided
    if 'password' in request.data and 'current_password' in request.data and 'password2' in request.data:
        # Verify current password
        if not user.check_password(request.data['current_password']):
            return Response(
                {"error": "Current password is incorrect"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verify new passwords match
        if request.data['password'] != request.data['password2']:
            return Response(
                {"error": "New passwords do not match"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Set new password
        user.set_password(request.data['password'])
    
    # Save user changes
    user.save()
    
    # Update or create profile
    profile, created = UserProfile.objects.get_or_create(user=user)
    
    # Update profile fields
    if 'bio' in request.data:
        profile.bio = request.data['bio']
    if 'favorite_cuisine' in request.data:
        profile.favorite_cuisine = request.data['favorite_cuisine']
    
    # Save profile changes
    profile.save()
    
    # Return updated user data
    serializer = UserSerializer(user)
    return Response(serializer.data)


class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        """Handle password reset request and send email with reset link"""
        email = request.data.get('email')
        if not email:
            return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(email=email)
            success = send_password_reset_email(user)
            
            if success:
                return Response({'message': 'Password reset email sent successfully'}, status=status.HTTP_200_OK)
            else:
                return Response({'error': 'Failed to send reset email'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
        except User.DoesNotExist:
            # We don't want to reveal which emails exist in our system
            # So we still return success even if the email doesn't exist
            return Response({'message': 'Password reset email sent successfully'}, status=status.HTTP_200_OK)


class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        """Reset user password with token validation"""
        uid = request.data.get('uid')
        token = request.data.get('token')
        new_password = request.data.get('new_password')
        confirm_password = request.data.get('confirm_password')
        
        # Validate input
        if not all([uid, token, new_password, confirm_password]):
            return Response({'error': 'All fields are required'}, status=status.HTTP_400_BAD_REQUEST)
        
        if new_password != confirm_password:
            return Response({'error': 'Passwords do not match'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Decode the user ID
            uid = urlsafe_base64_decode(uid).decode()
            user = User.objects.get(pk=uid)
            
            # Verify token
            if not default_token_generator.check_token(user, token):
                return Response({'error': 'Invalid or expired token'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Set new password
            user.set_password(new_password)
            user.save()
            
            return Response({'message': 'Password reset successful'}, status=status.HTTP_200_OK)
            
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response({'error': 'Invalid reset link'}, status=status.HTTP_400_BAD_REQUEST)
