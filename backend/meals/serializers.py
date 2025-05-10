from rest_framework import serializers
from .models import MealCategory, Meal, MealIngredient, CustomMeal, CustomMealIngredient
from restaurants.serializers import IngredientSerializer

class MealCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = MealCategory
        fields = ['id', 'name', 'description']
        read_only_fields = ['id']

class MealIngredientSerializer(serializers.ModelSerializer):
    ingredient_details = IngredientSerializer(source='ingredient', read_only=True)
    
    class Meta:
        model = MealIngredient
        fields = ['id', 'ingredient', 'ingredient_details', 'quantity', 'is_optional', 'additional_price']
        read_only_fields = ['id']

class MealSerializer(serializers.ModelSerializer):
    meal_ingredients = MealIngredientSerializer(many=True, read_only=True)
    category_name = serializers.ReadOnlyField(source='category.name')
    restaurant_name = serializers.ReadOnlyField(source='restaurant.name')
    
    class Meta:
        model = Meal
        fields = ['id', 'name', 'description', 'category', 'category_name', 
                  'restaurant', 'restaurant_name', 'base_price', 'image', 
                  'is_available', 'is_featured', 'meal_ingredients']
        read_only_fields = ['id']

class CustomMealIngredientSerializer(serializers.ModelSerializer):
    ingredient_details = IngredientSerializer(source='ingredient', read_only=True)
    
    class Meta:
        model = CustomMealIngredient
        fields = ['id', 'ingredient', 'ingredient_details', 'quantity']
        read_only_fields = ['id']

class CustomMealSerializer(serializers.ModelSerializer):
    ingredients = CustomMealIngredientSerializer(many=True, read_only=True)
    base_meal_details = MealSerializer(source='base_meal', read_only=True)
    user_username = serializers.ReadOnlyField(source='user.username')
    avg_rating = serializers.FloatField(read_only=True, required=False)
    review_count = serializers.IntegerField(read_only=True, required=False)
    
    class Meta:
        model = CustomMeal
        fields = ['id', 'name', 'description', 'user', 'user_username', 
                  'base_meal', 'base_meal_details', 'is_public', 
                  'created_at', 'ingredients', 'avg_rating', 'review_count']
        read_only_fields = ['id', 'created_at', 'avg_rating', 'review_count']
    
    def create(self, validated_data):
        ingredients_data = self.context.get('ingredients', [])
        custom_meal = CustomMeal.objects.create(**validated_data)
        
        for ingredient_data in ingredients_data:
            CustomMealIngredient.objects.create(custom_meal=custom_meal, **ingredient_data)
        
        return custom_meal


