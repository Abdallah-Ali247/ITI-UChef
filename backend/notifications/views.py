from rest_framework import viewsets, permissions, status, filters
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from .models import Notification
from .serializers import NotificationSerializer, NotificationCreateSerializer
from users.models import User
from restaurants.models import Restaurant
from orders.models import Order

class IsRecipientOrAdmin(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        # Allow if user is the recipient of the notification
        if obj.recipient == request.user:
            return True
        
        # Allow if user is an admin
        if request.user.user_type == 'admin':
            return True
        
        # Allow if user is the restaurant owner (for restaurant notifications)
        if obj.restaurant and obj.restaurant.owner == request.user:
            return True
        
        return False

class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated, IsRecipientOrAdmin]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['created_at']
    
    def get_queryset(self):
        user = self.request.user
        
        # Admin can see all notifications
        if user.user_type == 'admin':
            return Notification.objects.all()
        
        # Restaurant owner can see notifications for their restaurant
        if user.user_type == 'restaurant':
            try:
                restaurant = user.restaurant
                return Notification.objects.filter(restaurant=restaurant)
            except Restaurant.DoesNotExist:
                return Notification.objects.none()
        
        # Regular users can only see their own notifications
        return Notification.objects.filter(recipient=user)
    
    def get_serializer_class(self):
        if self.action == 'create':
            return NotificationCreateSerializer
        return NotificationSerializer

    @action(detail=False, methods=['get'])
    def unread(self, request):
        """Get all unread notifications for the current user"""
        unread_notifications = self.get_queryset().filter(is_read=False)
        serializer = self.get_serializer(unread_notifications, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        """Mark a notification as read"""
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        serializer = self.get_serializer(notification)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def mark_all_as_read(self, request):
        """Mark all notifications as read for the current user"""
        notifications = self.get_queryset().filter(is_read=False)
        for notification in notifications:
            notification.is_read = True
            notification.save()
        return Response({'status': 'All notifications marked as read'}, status=status.HTTP_200_OK)

def create_notification(recipient_id, notification_type, title, message, sender_id=None, restaurant_id=None, order_id=None):
    """Helper function to create a notification"""
    try:
        recipient = User.objects.get(id=recipient_id)
        
        notification_data = {
            'recipient': recipient,
            'notification_type': notification_type,
            'title': title,
            'message': message,
        }
        
        if sender_id:
            sender = User.objects.get(id=sender_id)
            notification_data['sender'] = sender
        
        if restaurant_id:
            restaurant = Restaurant.objects.get(id=restaurant_id)
            notification_data['restaurant'] = restaurant
        
        if order_id:
            order = Order.objects.get(id=order_id)
            notification_data['order'] = order
        
        notification = Notification.objects.create(**notification_data)
        return notification
    except Exception as e:
        print(f"Error creating notification: {str(e)}")
        return None
