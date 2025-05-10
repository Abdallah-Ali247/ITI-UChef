from rest_framework import serializers
from .models import Notification
from users.serializers import UserSerializer
from restaurants.serializers import RestaurantSerializer
from orders.serializers import OrderSerializer

class NotificationSerializer(serializers.ModelSerializer):
    sender_details = UserSerializer(source='sender', read_only=True)
    restaurant_details = RestaurantSerializer(source='restaurant', read_only=True)
    order_details = OrderSerializer(source='order', read_only=True)
    
    class Meta:
        model = Notification
        fields = '__all__'
        read_only_fields = ['created_at']

class NotificationCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'
