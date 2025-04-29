from email import message
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import UserProfile
from decouple import config


from .utils import send_activation_email


User = get_user_model()


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['bio', 'favorite_cuisine']



class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)
    password = serializers.CharField(write_only=True, required=False)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'first_name', 'last_name', 'user_type', 
                  'phone_number', 'address', 'profile_picture', 'profile']
        read_only_fields = ['id']
        extra_kwargs = {
            'password': {'write_only': True}
        }
    
    def create(self, validated_data):
        validated_data['is_active'] = False
        user = User.objects.create_user(**validated_data)
        UserProfile.objects.create(user=user)
        # send_activation_email(user)


        return user


    def update(self, instance, validated_data):
        # Handle password separately
        password = validated_data.pop('password', None)
        
        # Update all other fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        # If password is provided, use set_password to properly hash it
        if password is not None:
            instance.set_password(password)
            
        instance.save()
        return instance

class UserRegistrationSerializer(serializers.ModelSerializer):
    password2 = serializers.CharField(write_only=True, required=True)
    
    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password2', 'first_name', 'last_name', 
                  'user_type', 'phone_number', 'address']
        extra_kwargs = {
            'password': {'write_only': True},
        }
    
    def validate(self, data):
        if data['password'] != data.pop('password2'):
            raise serializers.ValidationError("Passwords do not match")
        
        # Check if a user with this email already exists but is inactive
        email = data.get('email')
        try:
            existing_user = User.objects.get(email=email)
            if not existing_user.is_active:
                # We'll handle this in create() by resending the activation email
                self.existing_inactive_user = existing_user
            else:
                # If user exists and is active, raise validation error
                raise serializers.ValidationError({"email": "A user with this email already exists."})
        except User.DoesNotExist:
            # No existing user, continue with registration
            pass
            
        return data
    
    def create(self, validated_data):
        # Check if we found an existing inactive user during validation
        if hasattr(self, 'existing_inactive_user'):
            # Resend activation email to existing user
            send_activation_email(self.existing_inactive_user)
            return self.existing_inactive_user
            
        # Normal registration flow for new users
        user = User.objects.create_user(**validated_data)
        user.is_active = False
        user.save()
        UserProfile.objects.create(user=user)
        send_activation_email(user) 
        return user
    
    