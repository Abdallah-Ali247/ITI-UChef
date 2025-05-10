from rest_framework import viewsets, permissions, status, filters
from rest_framework.response import Response
from rest_framework.decorators import action, api_view
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.shortcuts import get_object_or_404
from django.http import JsonResponse
from .models import MealCategory, Meal, MealIngredient, CustomMeal, CustomMealIngredient
from .serializers import MealCategorySerializer, MealSerializer, MealIngredientSerializer, CustomMealSerializer, CustomMealIngredientSerializer
from restaurants.models import Restaurant, Ingredient
from restaurants.views import IsOwnerOrReadOnly, IsRestaurantOwnerOrReadOnly
import requests
from decouple import config

class MealCategoryViewSet(viewsets.ModelViewSet):
    queryset = MealCategory.objects.all()
    serializer_class = MealCategorySerializer
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAuthenticated()]

class MealViewSet(viewsets.ModelViewSet):
    queryset = Meal.objects.all()
    serializer_class = MealSerializer
    permission_classes = [IsAuthenticated, IsRestaurantOwnerOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description', 'category__name']
    ordering_fields = ['name', 'base_price', 'created_at']
    
    @action(detail=True, methods=['get'], permission_classes=[AllowAny])
    def check_availability(self, request, pk=None):
        """Check if all ingredients for a meal are available"""
        meal = self.get_object()
        meal_ingredients = MealIngredient.objects.filter(meal=meal)
        
        # Get quantity from query params, default to 1
        quantity = int(request.query_params.get('quantity', 1))
        
        unavailable_ingredients = []
        for mi in meal_ingredients:
            # Skip optional ingredients
            if mi.is_optional:
                continue
                
            ingredient = mi.ingredient
            required_quantity = float(mi.quantity) * quantity
            
            # Check if ingredient is available and has enough quantity
            if not ingredient.is_available or ingredient.quantity < required_quantity:
                unavailable_ingredients.append({
                    'id': ingredient.id,
                    'name': ingredient.name,
                    'available': ingredient.is_available,
                    'required': required_quantity,
                    'in_stock': ingredient.quantity
                })
        
        return Response({
            'is_available': len(unavailable_ingredients) == 0,
            'unavailable_ingredients': unavailable_ingredients
        })
    
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return super().get_permissions()
    
    def get_queryset(self):
        restaurant_id = self.request.query_params.get('restaurant', None)
        category_id = self.request.query_params.get('category', None)
        
        queryset = Meal.objects.all()
        
        if restaurant_id:
            queryset = queryset.filter(restaurant_id=restaurant_id)
        
        if category_id:
            queryset = queryset.filter(category_id=category_id)
            
        return queryset
    
    def perform_create(self, serializer):
        restaurant_id = self.request.data.get('restaurant')
        restaurant = get_object_or_404(Restaurant, id=restaurant_id)
        
        # Check if the user is the owner of the restaurant
        if restaurant.owner != self.request.user and self.request.user.user_type != 'admin':
            return Response({'detail': 'You do not have permission to add meals to this restaurant.'}, 
                           status=status.HTTP_403_FORBIDDEN)
        
        # Save the meal
        meal = serializer.save()
        
        # Process the ingredients for the meal
        ingredients_data = self.request.data.get('ingredients', '[]')
        # Parse the JSON string into a Python object
        import json
        try:
            ingredients_data = json.loads(ingredients_data)
        except json.JSONDecodeError:
            # If parsing fails, use an empty list
            ingredients_data = []
            
        for ingredient_data in ingredients_data:
            ingredient_id = ingredient_data.get('ingredient')
            quantity = ingredient_data.get('quantity', 0)
            is_optional = ingredient_data.get('is_optional', False)
            additional_price = ingredient_data.get('additional_price', 0)
            
            if ingredient_id and quantity > 0:
                ingredient = get_object_or_404(Ingredient, id=ingredient_id)
                MealIngredient.objects.create(
                    meal=meal,
                    ingredient=ingredient,
                    quantity=quantity,
                    is_optional=is_optional,
                    additional_price=additional_price
                )

class CustomMealViewSet(viewsets.ModelViewSet):
    queryset = CustomMeal.objects.all()
    serializer_class = CustomMealSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'ingredients', 'top_rated', 'check_availability']:
            return [AllowAny()]
        return [IsAuthenticated()]
    
    def get_queryset(self):
        user_id = self.request.query_params.get('user', None)
        is_public = self.request.query_params.get('is_public', None)
        
        queryset = CustomMeal.objects.all()
        
        # Check if user is authenticated
        if self.request.user.is_authenticated:
            # If authenticated user is admin or restaurant owner, they can see all meals
            if hasattr(self.request.user, 'user_type') and self.request.user.user_type in ['admin', 'restaurant']:
                pass  # Keep the full queryset
            else:
                # Regular users can only see their own meals or public meals
                queryset = queryset.filter(user=self.request.user) | queryset.filter(is_public=True)
        else:
            # Anonymous users can only see public meals
            queryset = queryset.filter(is_public=True)
        
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        
        if is_public is not None:
            is_public = is_public.lower() == 'true'
            queryset = queryset.filter(is_public=is_public)
            
        return queryset
    
    def perform_create(self, serializer):
        # Save the custom meal with the current user
        custom_meal = serializer.save(user=self.request.user)
        
        # Process the ingredients for the custom meal
        ingredients_data = self.request.data.get('ingredients', [])
        for ingredient_data in ingredients_data:
            ingredient_id = ingredient_data.get('ingredient')
            quantity = ingredient_data.get('quantity')
            
            ingredient = get_object_or_404(Ingredient, id=ingredient_id)
            CustomMealIngredient.objects.create(
                custom_meal=custom_meal,
                ingredient=ingredient,
                quantity=quantity
            )
    
    @action(detail=True, methods=['get'])
    def ingredients(self, request, pk=None):
        """Get all ingredients for a custom meal"""
        custom_meal = self.get_object()
        ingredients = CustomMealIngredient.objects.filter(custom_meal=custom_meal)
        serializer = CustomMealIngredientSerializer(ingredients, many=True)
        return Response(serializer.data)
        
    @action(detail=True, methods=['get'], permission_classes=[AllowAny])
    def check_availability(self, request, pk=None):
        """Check if all ingredients for a custom meal are available"""
        custom_meal = self.get_object()
        custom_meal_ingredients = CustomMealIngredient.objects.filter(custom_meal=custom_meal)
        

        # Get quantity from query params, default to 1
        quantity = int(request.query_params.get('quantity', 1))
        
        unavailable_ingredients = []
        for cmi in custom_meal_ingredients:
            ingredient = cmi.ingredient
            required_quantity = float(cmi.quantity) * quantity
            
            # Check if ingredient is available and has enough quantity
            if not ingredient.is_available or ingredient.quantity < required_quantity:
                unavailable_ingredients.append({
                    'id': ingredient.id,
                    'name': ingredient.name,
                    'available': ingredient.is_available,
                    'required': required_quantity,
                    'in_stock': ingredient.quantity
                })
        
        return Response({
            'is_available': len(unavailable_ingredients) == 0,
            'unavailable_ingredients': unavailable_ingredients
        })
        
    @action(detail=False, methods=['get'], permission_classes=[AllowAny], url_path='top-rated', url_name='top-rated')
    def top_rated(self, request):
        """Get top-rated custom meals"""
        try:
            # Only include public meals
            queryset = CustomMeal.objects.filter(is_public=True)
            
            # Annotate with average rating and review count
            from django.db.models import Avg, Count
            queryset = queryset.annotate(
                avg_rating=Avg('reviews__rating'),
                review_count=Count('reviews')
            )
            
            # Filter meals with at least one review
            queryset = queryset.filter(review_count__gt=0)
            
            # Order by average rating (descending) and then by review count (descending)
            queryset = queryset.order_by('-avg_rating', '-review_count')
            
            # Limit to top 10 meals
            limit = int(request.query_params.get('limit', 10))
            queryset = queryset[:limit]
            
            serializer = self.get_serializer(queryset, many=True)
            return Response(serializer.data)
        except Exception as e:
            # Log the error for debugging
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error in top_rated: {str(e)}")
            
            # Return an empty list instead of an error
            return Response([])


# Weather Feature 

@api_view(['GET'])
def get_weather(request):
    try:
        city = request.GET.get('city', 'Cairo')  # Default to Cairo if no city provided
        api_key = config('OPENWEATHERMAP_API_KEY', default='your_default_api_key')
        url = f"https://api.openweathermap.org/data/2.5/weather?q={city}&appid={api_key}&units=metric"
        
        response = requests.get(url)
        data = response.json()
        
        if response.status_code == 200:
            return JsonResponse({
                "success": True,
                "city": city,
                "temperature": data["main"]["temp"],
                "description": data["weather"][0]["description"],
                "humidity": data["main"]["humidity"],
                "icon": data["weather"][0]["icon"]
            })
        else:
            return JsonResponse({
                "success": False,
                "error": f"Error fetching weather data: {data.get('message', 'Unknown error')}"
            }, status=response.status_code)
    except Exception as e:
        return JsonResponse({
            "success": False,
            "error": f"Error: {str(e)}"
        }, status=500)