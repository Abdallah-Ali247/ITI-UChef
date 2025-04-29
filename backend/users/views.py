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
from .utils import send_activation_email


User = get_user_model()



class ActivateAccountView(APIView):
    permission_classes = [AllowAny]
    def get(self, request, uidb64, token):
        import logging
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
            return Response({'message': 'Account activated successfully'}, status=status.HTTP_200_OK)
        else:
            logger.error(f"Invalid token for user {user.username}")
            return Response({'error': 'Activation token is invalid or expired'}, status=status.HTTP_400_BAD_REQUEST)


class UserRegistrationView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]
    
    def perform_create(self, serializer):
        user = serializer.save(is_active=False)
        # UserProfile is already created in the serializer's create method
        # so we don't need to create it again here
        send_activation_email(user)

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
