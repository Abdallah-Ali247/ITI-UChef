import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { FaIceCream, FaCoffee, FaMugHot, FaGlassWhiskey, FaSnowflake, FaSun } from 'react-icons/fa';
import hotDrinkImage from '../assets/hotDirnk.jpg';
import icedCoffeeImage from '../assets/iced-coffee-05.jpg';
import { FaAngleRight } from 'react-icons/fa';

const WeatherRecommendation = () => {
  const [weatherData, setWeatherData] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { meals } = useSelector(state => state.meals);

  useEffect(() => {
    const fetchWeatherData = async (latitude, longitude) => {
      try {
        setLoading(true);
        // Use OpenWeatherMap API directly with a free API key
        // This is a demo API key with limited usage - in production, use environment variables
        const apiKey = '4d8fb5b93d4af21d66a2948710284366';
        
        // Use coordinates if available, otherwise fallback to city name
        const url = latitude && longitude
          ? `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric`
          : `https://api.openweathermap.org/data/2.5/weather?q=Cairo&appid=${apiKey}&units=metric`;
        
        const response = await axios.get(url);
        
        if (response.status === 200) {
          const data = {
            success: true,
            city: response.data.name,
            temperature: response.data.main.temp,
            description: response.data.weather[0].description,
            humidity: response.data.main.humidity,
            icon: response.data.weather[0].icon
          };
          setWeatherData(data);
          fetchRecommendations(data.temperature);
        } else {
          setError('Could not fetch weather data');
        }
      } catch (error) {
        console.error('Error fetching weather data:', error);
        // Fallback to simulated weather data for demo purposes
        const simulatedData = {
          success: true,
          city: 'Unknown Location',
          temperature: Math.random() > 0.5 ? 28 : 22, // Randomly choose hot or cold
          description: Math.random() > 0.5 ? 'clear sky' : 'few clouds',
          humidity: 65,
          icon: '01d'
        };
        setWeatherData(simulatedData);
        fetchRecommendations(simulatedData.temperature);
      } finally {
        setLoading(false);
      }
    };

    // Get user's location using browser's Geolocation API
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Success callback - got coordinates
          const { latitude, longitude } = position.coords;
          console.log('Got location:', latitude, longitude);
          fetchWeatherData(latitude, longitude);
        },
        (error) => {
          // Error callback - couldn't get location
          console.error('Geolocation error:', error.message);
          // Fallback to default location
          fetchWeatherData();
        },
        { timeout: 10000 } // 10 second timeout
      );
    } else {
      // Browser doesn't support geolocation
      console.log('Geolocation is not supported by this browser');
      fetchWeatherData(); // Fallback to default location
    }
  }, []);

  const fetchRecommendations = async (temperature) => {
    try {
      // Use the meals from Redux store instead of making another API call
      if (meals && meals.length > 0) {
        // Filter meals that might be appropriate for the current weather
        // This is a simple implementation - in a real app, you'd have proper categories
        const filteredMeals = meals.filter(meal => {
          const name = meal.name.toLowerCase();
          const description = meal.description ? meal.description.toLowerCase() : '';
          
          if (temperature > 25) {
            // Hot weather - look for cold items
            return (
              name.includes('ice') || 
              name.includes('cold') || 
              name.includes('cool') || 
              name.includes('frozen') ||
              name.includes('smoothie') ||
              description.includes('refreshing') ||
              description.includes('cold') ||
              description.includes('ice')
            );
          } else {
            // Cold weather - look for hot items
            return (
              name.includes('hot') || 
              name.includes('warm') || 
              name.includes('coffee') || 
              name.includes('tea') ||
              name.includes('chocolate') ||
              description.includes('warm') ||
              description.includes('hot')
            );
          }
        });
        
        if (filteredMeals.length > 0) {
          // Get up to 3 recommendations
          setRecommendations(filteredMeals.slice(0, 3));
          return;
        }
      }
      
      // Fallback to default recommendations if no matching meals found
      if (temperature > 25) {
        setRecommendations([
          { id: 'default-1', name: 'Ice Cream', description: 'Cool down with some refreshing ice cream', image: icedCoffeeImage },
          { id: 'default-2', name: 'Cold Brew Coffee', description: 'Energize with a refreshing cold brew', image: icedCoffeeImage },
          { id: 'default-3', name: 'Fruit Smoothie', description: 'Healthy and refreshing fruit smoothie', image: icedCoffeeImage }
        ]);
      } else {
        setRecommendations([
          { id: 'default-1', name: 'Hot Chocolate', description: 'Warm up with a delicious hot chocolate', image: hotDrinkImage },
          { id: 'default-2', name: 'Spiced Chai Latte', description: 'A comforting spiced chai latte', image: hotDrinkImage },
          { id: 'default-3', name: 'Cappuccino', description: 'Classic cappuccino to warm your day', image: hotDrinkImage }
        ]);
      }
    } catch (error) {
      console.error('Error processing recommendations:', error);
      // Set default recommendations based on temperature
      if (temperature > 25) {
        setRecommendations([
          { id: 'default-1', name: 'Ice Cream', description: 'Cool down with some refreshing ice cream', image: icedCoffeeImage },
          { id: 'default-2', name: 'Cold Brew Coffee', description: 'Energize with a refreshing cold brew', image: icedCoffeeImage },
          { id: 'default-3', name: 'Fruit Smoothie', description: 'Healthy and refreshing fruit smoothie', image: icedCoffeeImage }
        ]);
      } else {
        setRecommendations([
          { id: 'default-1', name: 'Hot Chocolate', description: 'Warm up with a delicious hot chocolate', image: hotDrinkImage },
          { id: 'default-2', name: 'Spiced Chai Latte', description: 'A comforting spiced chai latte', image: hotDrinkImage },
          { id: 'default-3', name: 'Cappuccino', description: 'Classic cappuccino to warm your day', image: hotDrinkImage }
        ]);
      }
    }
  };

  if (loading) {
    return (
      <div className="section-container" style={{ padding: '2rem 0' }}>
        <div className="container">
          <div className="loading-spinner">Loading weather recommendations...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return null; // Don't show anything if there's an error
  }

  if (!weatherData) {
    return null;
  }

  const isHot = weatherData.temperature > 25;
  const backgroundClass = isHot ? 'hot-weather-bg' : 'cold-weather-bg';
  const temperatureText = isHot ? 'hot' : 'cold';
  const WeatherIcon = isHot ? FaSun : FaSnowflake;
  const RecommendationIcon = isHot ? FaIceCream : FaMugHot;

  return (
    <section className="weather-recommendation-section">
      <div className="weather-card-container">
        <div className={`weather-card ${isHot ? 'hot-card' : 'cold-card'}`}>
          <div className="weather-image-side">
            <img 
              src={isHot ? icedCoffeeImage : hotDrinkImage} 
              alt={isHot ? "Cool refreshing drink" : "Warm comforting drink"} 
              className="weather-image animate-fade-in"
            />
            <div className="weather-temp-badge">
              <span>{Math.round(weatherData.temperature)}°C</span>
            </div>
          </div>
          
          <div className="weather-content-side">
            <div className="weather-icon-wrapper animate-bounce">
              <WeatherIcon className="weather-icon" />
            </div>
            
            <h2 className="weather-title animate-slide-in">
              {isHot ? "Beat the Heat!" : "Stay Cozy!"}
            </h2>
            
            <div className="weather-location animate-fade-in">
              <p>{weatherData.city} • {weatherData.description}</p>
            </div>
            
            <div className="weather-message animate-slide-up">
              <p>
                {isHot
                  ? "Looking for something refreshing? Our restaurants offer delicious cold treats to help you cool down on this hot day."
                  : "Warm up with something delicious! Our restaurants offer comforting hot drinks perfect for this cool weather."}
              </p>
            </div>
            
            <div className="weather-cta animate-fade-in">
              <Link 
                to="/restaurants" 
                className={`btn-recommendation ${isHot ? 'btn-cool' : 'btn-warm'}`}
              >
                Find {isHot ? "Cool Treats" : "Warm Drinks"} <FaAngleRight />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WeatherRecommendation;
