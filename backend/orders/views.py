from rest_framework import viewsets, permissions, status, filters
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from .models import Order, OrderItem, Payment
from .serializers import OrderSerializer, OrderItemSerializer, PaymentSerializer
from restaurants.models import Restaurant
# Import for notifications
from notifications.views import create_notification

class IsOrderOwnerOrRestaurantOwnerOrAdmin(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        # Allow if user is the order owner
        if obj.user == request.user:
            return True
        
        # Allow if user is the restaurant owner
        if obj.restaurant.owner == request.user:
            return True
        
        # Allow if user is an admin
        if request.user.user_type == 'admin':
            return True
        
        return False

class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated, IsOrderOwnerOrRestaurantOwnerOrAdmin]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['created_at', 'status']
    
    def get_queryset(self):
        user = self.request.user
        
        # Admin can see all orders
        if user.user_type == 'admin':
            return Order.objects.all()
        
        # Restaurant owner can see orders for their restaurant
        if user.user_type == 'restaurant':
            try:
                restaurant = user.restaurant
                return Order.objects.filter(restaurant=restaurant)
            except Restaurant.DoesNotExist:
                return Order.objects.none()
        
        # Regular users can only see their own orders
        return Order.objects.filter(user=user)
    
    def perform_create(self, serializer):
        # Process the order items to check availability before creating the order
        items_data = self.request.data.get('items', [])
        
        from meals.models import Meal, CustomMeal, CustomMealIngredient, MealIngredient
        from restaurants.models import Ingredient
        
        # First, check if all ingredients are available
        unavailable_ingredients = []
        
        for item_data in items_data:
            # Check regular meals
            if 'meal' in item_data and item_data['meal']:
                try:
                    meal_id = item_data['meal']
                    meal = Meal.objects.get(id=meal_id)
                    
                    # Get the meal ingredients and check availability
                    meal_ingredients = MealIngredient.objects.filter(meal=meal)
                    order_quantity = int(item_data.get('quantity', 1))
                    
                    for mi in meal_ingredients:
                        # Skip optional ingredients
                        if mi.is_optional:
                            continue
                            
                        ingredient = mi.ingredient
                        required_quantity = float(mi.quantity) * order_quantity
                        
                        # Check if ingredient is available and has enough quantity
                        if not ingredient.is_available or ingredient.quantity < required_quantity:
                            unavailable_ingredients.append({
                                'name': ingredient.name,
                                'meal': meal.name,
                                'available': ingredient.is_available,
                                'required': required_quantity,
                                'in_stock': ingredient.quantity
                            })
                except Meal.DoesNotExist:
                    pass
            
            # Check custom meals
            if 'custom_meal' in item_data and item_data['custom_meal']:
                try:
                    custom_meal_id = item_data['custom_meal']
                    custom_meal = CustomMeal.objects.get(id=custom_meal_id)
                    
                    # Get the custom meal ingredients and check availability
                    custom_meal_ingredients = CustomMealIngredient.objects.filter(custom_meal=custom_meal)
                    order_quantity = int(item_data.get('quantity', 1))
                    
                    for cmi in custom_meal_ingredients:
                        ingredient = cmi.ingredient
                        required_quantity = float(cmi.quantity) * order_quantity
                        
                        # Check if ingredient is available and has enough quantity
                        if not ingredient.is_available or ingredient.quantity < required_quantity:
                            unavailable_ingredients.append({
                                'name': ingredient.name,
                                'meal': custom_meal.name,
                                'available': ingredient.is_available,
                                'required': required_quantity,
                                'in_stock': ingredient.quantity
                            })
                except CustomMeal.DoesNotExist:
                    pass
        
        # If any ingredients are unavailable, return an error
        if unavailable_ingredients:
            error_message = "Cannot place order due to unavailable ingredients:\n"
            for item in unavailable_ingredients:
                error_message += f"- {item['name']} (required for {item['meal']}) is {'out of stock' if not item['available'] else 'low in stock'}. "
                error_message += f"Required: {item['required']}, Available: {item['in_stock']}\n"
            
            from rest_framework.exceptions import ValidationError
            raise ValidationError({'unavailable_ingredients': unavailable_ingredients, 'message': error_message})
        
        # If all ingredients are available, save the order with the current user
        order = serializer.save(user=self.request.user)
        
        for item_data in items_data:
            # Create a copy of the item data to avoid modifying the original
            item_to_create = item_data.copy() if isinstance(item_data, dict) else {}
            
            # Handle meal ID - convert to Meal object
            if 'meal' in item_to_create and item_to_create['meal']:
                try:
                    meal_id = item_to_create.pop('meal')
                    meal = Meal.objects.get(id=meal_id)
                    item_to_create['meal'] = meal
                    
                    # Get the meal ingredients and subtract quantities from inventory
                    meal_ingredients = MealIngredient.objects.filter(meal=meal)
                    order_quantity = int(item_to_create.get('quantity', 1))
                    
                    for mi in meal_ingredients:
                        try:
                            # Get the ingredient
                            ingredient = mi.ingredient
                            
                            # Skip optional ingredients (if applicable)
                            if mi.is_optional:
                                continue
                                
                            # Calculate how much to subtract (ingredient quantity per meal × order quantity)
                            subtract_amount = float(mi.quantity) * order_quantity
                            
                            # Update the ingredient quantity
                            if ingredient.quantity >= subtract_amount:
                                ingredient.quantity -= subtract_amount
                                
                                # If quantity becomes zero or very close to zero, mark as unavailable
                                if ingredient.quantity < 0.001:
                                    ingredient.quantity = 0
                                    ingredient.is_available = False
                                
                                ingredient.save()
                                
                                # Log the update for debugging
                                import logging
                                logger = logging.getLogger(__name__)
                                logger.info(
                                    f"Updated ingredient {ingredient.name} (ID: {ingredient.id}): "
                                    f"Previous quantity: {ingredient.quantity + subtract_amount}, "
                                    f"Subtracted: {subtract_amount}, "
                                    f"New quantity: {ingredient.quantity}"
                                )
                            else:
                                # Not enough quantity available
                                # We'll still create the order but log this issue
                                import logging
                                logger = logging.getLogger(__name__)
                                logger.warning(
                                    f"Not enough quantity of ingredient {ingredient.name} (ID: {ingredient.id}) "
                                    f"for meal {meal.name} (ID: {meal.id}). "
                                    f"Required: {subtract_amount}, Available: {ingredient.quantity}"
                                )
                        except Exception as e:
                            # Log any errors but continue processing the order
                            import logging
                            logger = logging.getLogger(__name__)
                            logger.error(f"Error updating ingredient quantity for meal: {str(e)}")
                            
                except Meal.DoesNotExist:
                    continue  # Skip this item if meal doesn't exist
            
            # Handle custom meal ID - convert to CustomMeal object
            if 'custom_meal' in item_to_create and item_to_create['custom_meal']:
                try:
                    custom_meal_id = item_to_create.pop('custom_meal')
                    custom_meal = CustomMeal.objects.get(id=custom_meal_id)
                    item_to_create['custom_meal'] = custom_meal
                    
                    # Get the custom meal ingredients and subtract quantities from inventory
                    custom_meal_ingredients = CustomMealIngredient.objects.filter(custom_meal=custom_meal)
                    order_quantity = int(item_to_create.get('quantity', 1))
                    
                    for cmi in custom_meal_ingredients:
                        try:
                            # Get the ingredient
                            ingredient = cmi.ingredient
                            
                            # Calculate how much to subtract (ingredient quantity per meal × order quantity)
                            subtract_amount = float(cmi.quantity) * order_quantity
                            
                            # Update the ingredient quantity
                            if ingredient.quantity >= subtract_amount:
                                ingredient.quantity -= subtract_amount
                                
                                # If quantity becomes zero or very close to zero, mark as unavailable
                                if ingredient.quantity < 0.001:
                                    ingredient.quantity = 0
                                    ingredient.is_available = False
                                
                                ingredient.save()
                                
                                # Log the update for debugging
                                import logging
                                logger = logging.getLogger(__name__)
                                logger.info(
                                    f"Updated ingredient {ingredient.name} (ID: {ingredient.id}) for custom meal: "
                                    f"Previous quantity: {ingredient.quantity + subtract_amount}, "
                                    f"Subtracted: {subtract_amount}, "
                                    f"New quantity: {ingredient.quantity}"
                                )
                            else:
                                # Not enough quantity available
                                # We'll still create the order but log this issue
                                import logging
                                logger = logging.getLogger(__name__)
                                logger.warning(
                                    f"Not enough quantity of ingredient {ingredient.name} (ID: {ingredient.id}) "
                                    f"for custom meal {custom_meal.name} (ID: {custom_meal.id}). "
                                    f"Required: {subtract_amount}, Available: {ingredient.quantity}"
                                )
                        except Exception as e:
                            # Log any errors but continue processing the order
                            import logging
                            logger = logging.getLogger(__name__)
                            logger.error(f"Error updating ingredient quantity for custom meal: {str(e)}")
                            
                except CustomMeal.DoesNotExist:
                    continue  # Skip this item if custom meal doesn't exist
            
            # Create the order item
            OrderItem.objects.create(order=order, **item_to_create)
        
        # Process payment if provided
        payment_data = self.request.data.get('payment', None)
        if payment_data:
            Payment.objects.create(order=order, **payment_data)
        
        # Create notification for the restaurant about the new order
        try:
            # Notify restaurant owner about the new order
            create_notification(
                recipient_id=order.restaurant.owner.id,
                notification_type='new_order',
                title='New Order Received',
                message=f'You have received a new order #{order.id} from {order.user.username}.',
                sender_id=order.user.id,
                restaurant_id=order.restaurant.id,
                order_id=order.id
            )
        except Exception as e:
            # Log any errors but continue processing the order
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error creating notification for new order: {str(e)}")
        
        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        order = self.get_object()
        status_value = request.data.get('status')
        
        if status_value not in [choice[0] for choice in Order.STATUS_CHOICES]:
            return Response({'detail': 'Invalid status value'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Only restaurant owner or admin can update status
        if request.user != order.restaurant.owner and request.user.user_type != 'admin':
            return Response({'detail': 'You do not have permission to update this order status'}, 
                           status=status.HTTP_403_FORBIDDEN)
        
        # Get the previous status for notification purposes
        previous_status = order.status
        
        order.status = status_value
        order.save()
        
        # Create appropriate notifications based on the status change
        if status_value == 'confirmed':
            # Notify customer that their order has been accepted
            create_notification(
                recipient_id=order.user.id,
                notification_type='order_accepted',
                title='Order Accepted',
                message=f'Your order #{order.id} has been accepted by {order.restaurant.name}.',
                sender_id=request.user.id,
                restaurant_id=order.restaurant.id,
                order_id=order.id
            )
        elif status_value == 'cancelled':
            reason = request.data.get('reason', 'No reason provided')
            # Notify customer that their order has been rejected/cancelled
            create_notification(
                recipient_id=order.user.id,
                notification_type='order_rejected',
                title='Order Rejected',
                message=f'Your order #{order.id} has been rejected by {order.restaurant.name}. Reason: {reason}',
                sender_id=request.user.id,
                restaurant_id=order.restaurant.id,
                order_id=order.id
            )
        elif status_value == 'ready':
            # Notify customer that their order is ready for pickup
            create_notification(
                recipient_id=order.user.id,
                notification_type='order_ready',
                title='Order Ready',
                message=f'Your order #{order.id} from {order.restaurant.name} is ready for pickup.',
                sender_id=request.user.id,
                restaurant_id=order.restaurant.id,
                order_id=order.id
            )
        elif status_value == 'delivered':
            # Notify customer that their order has been delivered
            create_notification(
                recipient_id=order.user.id,
                notification_type='order_delivered',
                title='Order Delivered',
                message=f'Your order #{order.id} from {order.restaurant.name} has been delivered.',
                sender_id=request.user.id,
                restaurant_id=order.restaurant.id,
                order_id=order.id
            )
        else:
            # General status update notification
            status_display = dict(Order.STATUS_CHOICES).get(status_value, status_value)
            create_notification(
                recipient_id=order.user.id,
                notification_type='order_status_update',
                title=f'Order Status Update: {status_display}',
                message=f'Your order #{order.id} from {order.restaurant.name} has been updated to: {status_display}',
                sender_id=request.user.id,
                restaurant_id=order.restaurant.id,
                order_id=order.id
            )
        
        return Response(OrderSerializer(order).data)

class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated, IsOrderOwnerOrRestaurantOwnerOrAdmin]
    
    def get_queryset(self):
        user = self.request.user
        
        # Admin can see all payments
        if user.user_type == 'admin':
            return Payment.objects.all()
        
        # Restaurant owner can see payments for their restaurant's orders
        if user.user_type == 'restaurant':
            try:
                restaurant = user.restaurant
                return Payment.objects.filter(order__restaurant=restaurant)
            except Restaurant.DoesNotExist:
                return Payment.objects.none()
        
        # Regular users can only see their own payments
        return Payment.objects.filter(order__user=user)







from django.views.decorators.csrf import csrf_exempt
import json
import stripe
from django.conf import settings
from django.http import JsonResponse

stripe.api_key = settings.STRIPE_SECRET_KEY

@csrf_exempt  # Disable CSRF protection for this view
def create_payment_intent(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            amount = data.get('amount')  # Amount should be in cents (e.g., $10 = 1000)

            # Create a PaymentIntent with the provided amount
            intent = stripe.PaymentIntent.create(
                amount=amount,
                currency='usd',  # Change to your preferred currency
            )

            return JsonResponse({'clientSecret': intent.client_secret})
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)