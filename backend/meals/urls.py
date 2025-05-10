from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MealCategoryViewSet, MealViewSet, CustomMealViewSet, get_weather

router = DefaultRouter()
router.register(r'categories', MealCategoryViewSet)
router.register(r'meals', MealViewSet)
router.register(r'custom-meals', CustomMealViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('weather/', get_weather, name='get_weather'),
]
