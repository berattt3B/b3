import { useQuery } from "@tanstack/react-query";
import { getQueryOptions } from "@/lib/queryClient";
import { Droplets, Wind, Eye, Thermometer, Sun, Moon, Activity, Shirt, Plane, Car, Heart, Dumbbell, CloudRain, Gauge, Sunrise, Sunset, Clock, ArrowUp, ArrowDown, Calendar, TrendingUp, TrendingDown } from "lucide-react";
import { useEffect, useState } from "react";

interface WeatherData {
  location: string;
  current: {
    temperature: number;
    description: string;
    emoji: string;
    humidity: number;
    windSpeed: number;
    windDirection: number;
    windDescription: string;
    feelsLike: number;
    pressure: number;
    visibility: number;
    precipitation: number;
  };
  hourlyForecast: Array<{
    time: string;
    hour: number;
    temperature: number;
    emoji: string;
    humidity: number;
    windSpeed: number;
    windDirection: number;
    precipitation: number;
  }>;
  sunData: {
    sunrise: string;
    sunset: string;
    dayLength: string;
    sunProgress: number;
  };
  forecast: Array<{
    date: string;
    dayName: string;
    temperature: {
      max: number;
      min: number;
    };
    description: string;
    emoji: string;
    humidity: number;
    windSpeed: number;
  }>;
  uvIndex: {
    value: number;
    level: string;
    description: string;
  };
  airQuality: {
    aqi: number;
    level: string;
    description: string;
    components: {
      pm2_5: number;
      pm10: number;
      o3: number;
    };
  } | null;
  lifeIndices: {
    exercise: {
      level: string;
      emoji: string;
      description: string;
    };
    clothing: {
      level: string;
      emoji: string;
      description: string;
    };
    travel: {
      level: string;
      emoji: string;
      description: string;
    };
    skin: {
      level: string;
      emoji: string;
      description: string;
    };
    driving: {
      level: string;
      emoji: string;
      description: string;
    };
    comfort: {
      level: string;
      emoji: string;
      description: string;
    };
  };
}

export function EnhancedWeatherWidget() {
  const [currentTime, setCurrentTime] = useState(new Date());
  
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Calculate sun position based on current time
  const calculateSunPosition = (sunriseStr: string, sunsetStr: string, currentTime: Date) => {
    const today = new Date();
    const sunrise = new Date();
    const sunset = new Date();
    
    // Parse sunrise and sunset times (format: "HH:MM")
    const [sunriseHour, sunriseMin] = sunriseStr.split(':').map(Number);
    const [sunsetHour, sunsetMin] = sunsetStr.split(':').map(Number);
    
    sunrise.setHours(sunriseHour, sunriseMin, 0, 0);
    sunset.setHours(sunsetHour, sunsetMin, 0, 0);
    
    const currentMs = currentTime.getTime();
    const sunriseMs = sunrise.getTime();
    const sunsetMs = sunset.getTime();
    
    // If before sunrise or after sunset, place sun at start or end
    if (currentMs < sunriseMs) {
      return { progress: 0, x: 20, y: 50 }; // Start position
    }
    if (currentMs > sunsetMs) {
      return { progress: 1, x: 180, y: 50 }; // End position
    }
    
    // Calculate progress through the day (0 to 1)
    const dayProgress = (currentMs - sunriseMs) / (sunsetMs - sunriseMs);
    
    // Calculate position along the arc: M 20 50 Q 100 10 180 50
    // This is a quadratic curve from (20,50) to (180,50) with control point (100,10)
    const t = dayProgress;
    const x = Math.pow(1-t, 2) * 20 + 2*(1-t)*t * 100 + Math.pow(t, 2) * 180;
    const y = Math.pow(1-t, 2) * 50 + 2*(1-t)*t * 10 + Math.pow(t, 2) * 50;
    
    return { progress: dayProgress, x, y };
  };

  const { data: weather, isLoading, error } = useQuery<WeatherData>({
    queryKey: ["/api/weather"],
    queryFn: async () => {
      const response = await fetch(`/api/weather`);
      if (!response.ok) throw new Error('Failed to fetch weather data');
      return response.json();
    },
    // Use optimized query options
    ...getQueryOptions("/api/weather"),
    refetchInterval: 10 * 60 * 1000, // Refetch every 10 minutes
  });

  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-card to-card/80 rounded-xl border border-border/50 p-4 transition-all duration-300 hover:shadow-lg backdrop-blur-sm">
        <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center">
          <Sun className="h-5 w-5 mr-2 text-primary animate-spin" />
          Hava Durumu
        </h3>
        <div className="text-center">
          <div className="text-3xl mb-2">🔄</div>
          <div className="text-muted-foreground mb-2">Hava durumu yükleniyor...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gradient-to-br from-card to-card/80 rounded-xl border border-border/50 p-4 transition-all duration-300 hover:shadow-lg backdrop-blur-sm">
        <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center">
          <Sun className="h-5 w-5 mr-2 text-destructive" />
          Hava Durumu
        </h3>
        <div className="text-center">
          <div className="text-3xl mb-2">⚠️</div>
          <div className="text-muted-foreground mb-2">Hava durumu yüklenemedi</div>
        </div>
      </div>
    );
  }

  if (!weather) return null;

  // Calculate current sun position
  const sunPosition = calculateSunPosition(weather.sunData.sunrise, weather.sunData.sunset, currentTime);

  // Helper function to get wind direction
  const getWindDirection = (degree: number) => {
    const directions = ["K", "KKD", "KD", "DKD", "D", "DGD", "GD", "GGD", "G", "GGB", "GB", "BGB", "B", "BKB", "KB", "KKB"];
    const index = Math.round(degree / 22.5) % 16;
    return directions[index];
  };

  // Helper function to get wind description
  const getWindDescription = (speed: number) => {
    if (speed < 1) return "sakin";
    if (speed < 6) return "hafif esinti";
    if (speed < 12) return "meltem";
    if (speed < 20) return "orta rüzgar";
    if (speed < 29) return "güçlü rüzgar";
    return "fırtına";
  };

  // Get background class based on weather
  const getWeatherBackground = () => {
    const weatherId = weather.hourlyForecast[0]?.emoji || weather.current.emoji;
    if (weatherId.includes('☀️') || weatherId.includes('🌤️')) return 'from-yellow-300/20 via-orange-300/20 to-blue-300/20';
    if (weatherId.includes('🌧️') || weatherId.includes('⛈️')) return 'from-gray-400/20 via-blue-400/20 to-gray-600/20';
    if (weatherId.includes('❄️')) return 'from-blue-100/30 via-white/20 to-blue-200/30';
    if (weatherId.includes('☁️') || weatherId.includes('⛅')) return 'from-gray-300/20 via-gray-100/20 to-gray-400/20';
    return 'from-blue-400/20 via-indigo-400/20 to-purple-400/20';
  };

  // Calculate best time to go outside
  const getBestOutdoorTime = () => {
    const now = new Date();
    const currentHour = now.getHours();
    let bestHour = currentHour;
    let bestTemp = weather.current.temperature;
    let reason = "Şu anda uygun";

    weather.hourlyForecast.forEach((hour) => {
      const temp = hour.temperature;
      const hourTime = hour.hour;
      
      // Prefer temperatures between 20-25°C, avoid extreme hours
      if (hourTime >= 8 && hourTime <= 20) {
        if (Math.abs(temp - 22) < Math.abs(bestTemp - 22)) {
          bestTemp = temp;
          bestHour = hourTime;
          reason = `${hourTime}:00'da ${temp}°C ile ideal`;
        }
      }
    });

    return reason;
  };

  // Get health advice based on weather
  const getHealthAdvice = () => {
    const uvLevel = weather.uvIndex.value;
    const humidity = weather.current.humidity;
    const airQuality = weather.airQuality;
    
    if (uvLevel > 7) return "☀️ UV çok yüksek - güneş kremi ve şapka şart";
    if (airQuality && airQuality.aqi > 3) return "💨 Hava kalitesi düşük - dışarı çıkarken dikkat";
    if (humidity > 80) return "💧 Yüksek nem - bol su için ve hafif giyinin";
    if (humidity < 30) return "🌪️ Kuru hava - cilt nemlendiricisi kullanın";
    return "✅ Sağlıklı hava koşulları";
  };

  // Get sleep index
  const getSleepIndex = () => {
    const temp = weather.current.temperature;
    const humidity = weather.current.humidity;
    const airQuality = weather.airQuality?.aqi || 2;
    
    let score = 100;
    
    // Ideal sleep temp 18-22°C
    if (temp < 16 || temp > 24) score -= 30;
    else if (temp < 18 || temp > 22) score -= 15;
    
    // Ideal humidity 40-60%
    if (humidity < 30 || humidity > 70) score -= 20;
    else if (humidity < 40 || humidity > 60) score -= 10;
    
    // Air quality impact
    if (airQuality > 3) score -= 25;
    else if (airQuality > 2) score -= 10;
    
    score = Math.max(0, Math.min(100, score));
    
    let level = "Mükemmel";
    let advice = "Rahat uyku için ideal koşullar";
    
    if (score < 50) {
      level = "Zor";
      advice = "Klima/ısıtıcı ve havalandırma önerilir";
    } else if (score < 70) {
      level = "Orta";
      advice = "Oda sıcaklığını ayarlayın";
    } else if (score < 85) {
      level = "İyi";
      advice = "Güzel bir uyku geçireceksiniz";
    }
    
    return { score: Math.round(score), level, advice };
  };

  const sleepIndex = getSleepIndex();
  const bestOutdoorTime = getBestOutdoorTime();
  const healthAdvice = getHealthAdvice();

  return (
    <div className={`bg-gradient-to-br ${getWeatherBackground()} from-card to-card/80 rounded-xl border border-border/50 p-6 transition-all duration-300 hover:shadow-lg backdrop-blur-sm overflow-hidden relative`}>
      {/* Animated Weather Background Effects */}
      {weather.current.emoji.includes('🌧️') && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="rain-animation"></div>
        </div>
      )}
      
      {weather.current.emoji.includes('☀️') && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="sun-rays-animation"></div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-foreground flex items-center">
            <span className="text-3xl mr-3">{weather.current.emoji}</span>
            {weather.location}
          </h3>
          <p className="text-sm text-muted-foreground capitalize">{weather.current.description}</p>
        </div>
        <div className="text-right">
          <div className="text-4xl font-bold text-foreground">{weather.current.temperature}°C</div>
          <div className="text-sm text-muted-foreground">Hissedilen: {weather.current.feelsLike}°C</div>
        </div>
      </div>

      {/* Main Weather Details */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white/10 dark:bg-black/10 rounded-lg p-3 text-center hover:bg-white/20 dark:hover:bg-black/20 transition-all duration-300 hover:scale-105 cursor-pointer group">
          <div className="flex items-center justify-center mb-2">
            <CloudRain className="h-4 w-4 text-blue-500 mr-1 group-hover:scale-110 transition-transform" />
            <span className="text-xs text-muted-foreground">Yağış</span>
          </div>
          <div className="text-lg font-bold text-foreground">{weather.current.precipitation.toFixed(1)} mm</div>
          <div className="text-xs text-muted-foreground">
            {weather.current.precipitation > 0 ? `${weather.current.precipitation.toFixed(1)}mm yağış` : 'Şu anda yağmur yok'}
          </div>
        </div>

        <div className="bg-white/10 dark:bg-black/10 rounded-lg p-3 text-center hover:bg-white/20 dark:hover:bg-black/20 transition-all duration-300 hover:scale-105 cursor-pointer group">
          <div className="flex items-center justify-center mb-2">
            <Wind className="h-4 w-4 text-gray-500 mr-1 group-hover:scale-110 transition-transform" />
            <span className="text-xs text-muted-foreground">Rüzgar</span>
          </div>
          <div className="text-lg font-bold text-foreground">{weather.current.windSpeed} km/h</div>
          <div className="text-xs text-muted-foreground">
            {getWindDirection(weather.current.windDirection)} | {getWindDescription(weather.current.windSpeed)}
          </div>
        </div>

        {weather.airQuality && (
          <div className="bg-white/10 dark:bg-black/10 rounded-lg p-3 text-center hover:bg-white/20 dark:hover:bg-black/20 transition-all duration-300 hover:scale-105 cursor-pointer group">
            <div className="flex items-center justify-center mb-2">
              <Eye className="h-4 w-4 text-green-500 mr-1 group-hover:scale-110 transition-transform" />
              <span className="text-xs text-muted-foreground">Hava Kalitesi</span>
            </div>
            <div className="text-lg font-bold text-foreground">{weather.airQuality.aqi * 20}</div>
            <div className="text-xs text-muted-foreground">{weather.airQuality.level} | {weather.airQuality.description}</div>
          </div>
        )}

        <div className="bg-white/10 dark:bg-black/10 rounded-lg p-3 text-center hover:bg-white/20 dark:hover:bg-black/20 transition-all duration-300 hover:scale-105 cursor-pointer group">
          <div className="flex items-center justify-center mb-2">
            <Sun className="h-4 w-4 text-yellow-500 mr-1 group-hover:scale-110 transition-transform" />
            <span className="text-xs text-muted-foreground">UV Endeksi</span>
          </div>
          <div className="text-lg font-bold text-foreground">{weather.uvIndex.value}</div>
          <div className="text-xs text-muted-foreground">{weather.uvIndex.level} | {weather.uvIndex.description}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="bg-white/10 dark:bg-black/10 rounded-lg p-3 text-center">
          <div className="flex items-center justify-center mb-2">
            <Droplets className="h-4 w-4 text-blue-500 mr-1" />
            <span className="text-xs text-muted-foreground">Nem</span>
          </div>
          <div className="text-lg font-bold text-foreground">%{weather.current.humidity}</div>
          <div className="text-xs text-muted-foreground">
            {weather.current.humidity > 70 ? 'Yüksek nem seviyesi' : 
             weather.current.humidity > 30 ? 'Mevcut ortamda orta seviye nem' : 'Düşük nem seviyesi'}
          </div>
        </div>

        <div className="bg-white/10 dark:bg-black/10 rounded-lg p-3 text-center">
          <div className="flex items-center justify-center mb-2">
            <Clock className="h-4 w-4 text-purple-500 mr-1" />
            <span className="text-xs text-muted-foreground">En İyi Saat</span>
          </div>
          <div className="text-sm font-bold text-foreground">{bestOutdoorTime}</div>
          <div className="text-xs text-muted-foreground">Dışarı çıkmak için</div>
        </div>
      </div>

      {/* Sunrise/Sunset Arc with Moving Sun */}
      <div className="bg-gradient-to-t from-orange-100/20 via-yellow-50/20 to-blue-100/20 dark:from-orange-900/20 dark:via-yellow-900/20 dark:to-blue-900/20 rounded-lg p-4 mb-6">
        <div className="flex justify-between items-center text-xs text-muted-foreground mb-2">
          <div className="flex items-center">
            <Sunrise className="h-4 w-4 mr-1 text-orange-500" />
            <span>{weather.sunData.sunrise}</span>
          </div>
          <span className="font-medium text-foreground">Gün Uzunluğu: {weather.sunData.dayLength}</span>
          <div className="flex items-center">
            <Sunset className="h-4 w-4 mr-1 text-orange-600" />
            <span>{weather.sunData.sunset}</span>
          </div>
        </div>
        
        <div className="relative h-16 flex items-end justify-center">
          <svg viewBox="0 0 200 60" className="w-full h-full">
            {/* Sunrise/Sunset Arc */}
            <path
              d="M 20 50 Q 100 10 180 50"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
              className="text-orange-400/60"
              strokeDasharray="5,5"
            />
            
            {/* Sun Position - Dynamic based on current time */}
            <circle
              cx={sunPosition.x}
              cy={sunPosition.y}
              r="6"
              fill="currentColor"
              className="text-yellow-500 animate-pulse drop-shadow-lg"
              style={{
                filter: 'drop-shadow(0 0 8px rgba(255, 255, 0, 0.6))',
                transition: 'cx 2s ease-in-out, cy 2s ease-in-out'
              }}
            />
            
            {/* Sun Rays - Dynamic position */}
            <g className="text-yellow-400 opacity-70">
              {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
                const sunX = sunPosition.x;
                const sunY = sunPosition.y;
                const radians = (angle * Math.PI) / 180;
                const rayLength = 8 + Math.sin(Date.now() / 1000 + i) * 2; // Animated ray length
                const x1 = sunX + rayLength * Math.cos(radians);
                const y1 = sunY + rayLength * Math.sin(radians);
                const x2 = sunX + (rayLength + 4) * Math.cos(radians);
                const y2 = sunY + (rayLength + 4) * Math.sin(radians);
                
                return (
                  <line
                    key={i}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className="animate-pulse"
                    style={{ 
                      animationDelay: `${i * 0.1}s`,
                      transition: 'x1 2s ease-in-out, y1 2s ease-in-out, x2 2s ease-in-out, y2 2s ease-in-out'
                    }}
                  />
                );
              })}
            </g>
            
            {/* Current time indicator */}
            <text
              x={sunPosition.x}
              y={sunPosition.y - 15}
              textAnchor="middle"
              className="text-xs font-medium fill-yellow-600 dark:fill-yellow-400"
              style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }}
            >
              {currentTime.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
            </text>
          </svg>
        </div>
      </div>

      {/* Enhanced Hourly Weather Forecast */}
      <div className="bg-gradient-to-br from-blue-50/30 via-white/20 to-cyan-50/30 dark:from-blue-950/40 dark:via-slate-800/50 dark:to-cyan-950/30 rounded-2xl p-6 mb-6 border border-blue-200/30 dark:border-blue-800/30 relative overflow-hidden">
        {/* Decorative Background */}
        <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-blue-300/10 to-cyan-300/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-28 h-28 bg-gradient-to-tr from-cyan-300/10 to-blue-300/10 rounded-full blur-2xl"></div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-2xl font-bold text-foreground flex items-center">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl shadow-lg mr-4">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <div>
                <span className="bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 bg-clip-text text-transparent">
                  🕐 Saatlik Hava Durumu
                </span>
                <p className="text-sm text-muted-foreground font-normal">Günlük detaylı takip</p>
              </div>
            </h4>
            <div className="text-sm text-muted-foreground bg-blue-100/30 dark:bg-blue-900/30 rounded-lg px-3 py-1">
              24 Saatlik Önizleme
            </div>
          </div>
          
          {weather.hourlyForecast.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-blue-500" />
              </div>
              <p className="text-lg font-medium text-foreground">Saatlik veri hazırlanıyor</p>
              <p className="text-sm text-muted-foreground">Detaylı hava durumu bilgileri yükleniyor...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Desktop View - Horizontal Cards */}
              <div className="hidden md:grid md:grid-cols-6 lg:grid-cols-8 gap-4">
                {weather.hourlyForecast.slice(0, 8).map((hour, index) => (
                  <div key={index} className="bg-white/30 dark:bg-black/20 rounded-xl p-4 text-center hover:scale-105 hover:shadow-lg transition-all duration-300 group border border-white/20 dark:border-gray-600/20">
                    <div className="text-xs font-medium text-muted-foreground mb-3">
                      {hour.hour === currentTime.getHours() ? 
                        <span className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs">Şimdi</span> : 
                        `${hour.hour.toString().padStart(2, '0')}:00`
                      }
                    </div>
                    
                    <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300">{hour.emoji}</div>
                    
                    <div className="text-lg font-bold text-foreground mb-2">{hour.temperature}°C</div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-center text-xs text-muted-foreground">
                        <Droplets className="h-3 w-3 mr-1 text-blue-500" />
                        <span>{Math.round(hour.precipitation)}mm</span>
                      </div>
                      
                      <div className="flex items-center justify-center text-xs text-muted-foreground">
                        <Wind className="h-3 w-3 mr-1 text-gray-500" />
                        <span>{hour.windSpeed}km/h</span>
                      </div>
                      
                      <div className="flex items-center justify-center text-xs text-muted-foreground">
                        <Eye className="h-3 w-3 mr-1 text-blue-400" />
                        <span>%{hour.humidity}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Mobile View - Vertical List */}
              <div className="md:hidden space-y-3">
                {weather.hourlyForecast.slice(0, 6).map((hour, index) => (
                  <div key={index} className="bg-white/20 dark:bg-black/20 rounded-xl p-4 flex items-center space-x-4 hover:bg-white/30 dark:hover:bg-black/30 transition-all duration-300">
                    <div className="text-center min-w-[60px]">
                      <div className="text-xs font-medium text-muted-foreground mb-1">
                        {hour.hour === currentTime.getHours() ? 'Şimdi' : `${hour.hour.toString().padStart(2, '0')}:00`}
                      </div>
                      <div className="text-2xl">{hour.emoji}</div>
                    </div>
                    
                    <div className="flex-1">
                      <div className="text-lg font-bold text-foreground mb-1">{hour.temperature}°C</div>
                      <div className="text-sm text-muted-foreground">Saat {hour.hour}:00</div>
                    </div>
                    
                    <div className="text-right space-y-1">
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Droplets className="h-3 w-3 mr-1 text-blue-500" />
                        <span>{Math.round(hour.precipitation)}mm</span>
                      </div>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Wind className="h-3 w-3 mr-1 text-gray-500" />
                        <span>{hour.windSpeed}km/h</span>
                      </div>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Eye className="h-3 w-3 mr-1 text-blue-400" />
                        <span>%{hour.humidity}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Quick Summary */}
              <div className="mt-6 bg-gradient-to-r from-blue-100/40 to-cyan-100/40 dark:from-blue-900/40 dark:to-cyan-900/40 rounded-xl p-4">
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center">
                    <TrendingUp className="h-4 w-4 mr-2 text-green-500" />
                    <span className="text-muted-foreground">En Yüksek: </span>
                    <span className="font-semibold text-foreground ml-1">
                      {Math.max(...weather.hourlyForecast.slice(0, 8).map(h => h.temperature))}°C
                    </span>
                  </div>
                  <div className="flex items-center">
                    <TrendingDown className="h-4 w-4 mr-2 text-blue-500" />
                    <span className="text-muted-foreground">En Düşük: </span>
                    <span className="font-semibold text-foreground ml-1">
                      {Math.min(...weather.hourlyForecast.slice(0, 8).map(h => h.temperature))}°C
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Droplets className="h-4 w-4 mr-2 text-blue-400" />
                    <span className="text-muted-foreground">Toplam Yağış: </span>
                    <span className="font-semibold text-foreground ml-1">
                      {weather.hourlyForecast.slice(0, 8).reduce((sum, h) => sum + h.precipitation, 0).toFixed(1)}mm
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Health & Lifestyle Advice */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-white/5 dark:bg-black/5 rounded-lg p-4">
          <div className="flex items-center mb-3">
            <Heart className="h-5 w-5 mr-2 text-red-500" />
            <span className="font-semibold text-foreground">Sağlık Tavsiyesi</span>
          </div>
          <p className="text-sm text-muted-foreground">{healthAdvice}</p>
        </div>
        
        <div className="bg-white/5 dark:bg-black/5 rounded-lg p-4">
          <div className="flex items-center mb-3">
            <Moon className="h-5 w-5 mr-2 text-indigo-500" />
            <span className="font-semibold text-foreground">Uyku Endeksi</span>
          </div>
          <div className="flex items-center mb-2">
            <div className="text-2xl font-bold text-foreground mr-2">{sleepIndex.score}</div>
            <div className="text-sm text-muted-foreground">{sleepIndex.level}</div>
          </div>
          <p className="text-xs text-muted-foreground">{sleepIndex.advice}</p>
        </div>
        
        <div className="bg-white/5 dark:bg-black/5 rounded-lg p-4">
          <div className="flex items-center mb-3">
            <Clock className="h-5 w-5 mr-2 text-purple-500" />
            <span className="font-semibold text-foreground">Dışarı Çıkma Önerisi</span>
          </div>
          <p className="text-sm text-muted-foreground">{bestOutdoorTime}</p>
        </div>
      </div>

      {/* 7-Day Forecast - Enhanced */}
      <div className="bg-white/5 dark:bg-black/5 rounded-lg p-4 mb-6">
        <h4 className="text-lg font-semibold text-foreground mb-4 flex items-center">
          <Calendar className="h-5 w-5 mr-2 text-primary" />
          7 Günlük Hava Durumu Tahmini
        </h4>
        <div className="grid grid-cols-7 gap-2">
          {weather.forecast.map((day, index) => (
            <div key={index} className="text-center bg-white/10 dark:bg-black/10 rounded-lg p-3 hover:scale-105 transition-all duration-200">
              <div className="text-xs font-medium text-muted-foreground mb-2">
                {index === 0 ? "Bugün" : day.dayName}
              </div>
              <div className="text-2xl mb-3 hover:scale-110 transition-transform">{day.emoji}</div>
              
              <div className="flex items-center justify-center space-x-1 mb-2">
                <ArrowUp className="h-3 w-3 text-red-500" />
                <span className="text-sm font-bold text-foreground">{day.temperature.max}°</span>
              </div>
              
              {/* Enhanced Temperature Range Bar */}
              <div className="relative h-16 w-3 mx-auto bg-gradient-to-t from-gray-800 via-purple-800 to-black dark:from-gray-900 dark:via-purple-900 dark:to-black rounded-full overflow-hidden mb-2">
                <div 
                  className="absolute bottom-0 w-full bg-gradient-to-t from-purple-600 via-purple-400 to-gray-900 rounded-full transition-all duration-500"
                  style={{
                    height: `${Math.min(90, Math.max(30, ((day.temperature.max - day.temperature.min + 10) / 35) * 100))}%`
                  }}
                ></div>
                
                {/* Temperature markers */}
                <div className="absolute inset-0 flex flex-col justify-between py-1">
                  <div className="w-full h-0.5 bg-red-600/50 rounded"></div>
                  <div className="w-full h-0.5 bg-blue-600/50 rounded"></div>
                </div>
              </div>
              
              <div className="flex items-center justify-center space-x-1 mb-2">
                <ArrowDown className="h-3 w-3 text-blue-500" />
                <span className="text-xs font-medium text-muted-foreground">{day.temperature.min}°</span>
              </div>
              
              <div className="text-xs text-muted-foreground capitalize truncate" title={day.description}>
                {day.description.length > 10 ? day.description.substring(0, 10) + '...' : day.description}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Enhanced Lifestyle Index */}
      <div className="bg-white/5 dark:bg-black/5 rounded-lg p-4">
        <h4 className="text-lg font-semibold text-foreground mb-4 flex items-center">
          <Activity className="h-5 w-5 mr-2 text-primary" />
          Yaşam Endeksi - Hava Durumuna Göre Öneriler
        </h4>
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
          <div className="bg-white/10 dark:bg-black/10 rounded-lg p-3 text-center hover:scale-105 transition-all">
            <div className="text-2xl mb-2">{weather.lifeIndices.exercise.emoji}</div>
            <div className="text-xs text-muted-foreground mb-1">Egzersiz</div>
            <div className="text-sm font-bold text-foreground mb-1">{weather.lifeIndices.exercise.level}</div>
            <div className="text-xs text-muted-foreground">{weather.lifeIndices.exercise.description.substring(0, 20)}...</div>
          </div>
          
          <div className="bg-white/10 dark:bg-black/10 rounded-lg p-3 text-center hover:scale-105 transition-all">
            <div className="text-2xl mb-2">{weather.lifeIndices.clothing.emoji}</div>
            <div className="text-xs text-muted-foreground mb-1">Giyim</div>
            <div className="text-sm font-bold text-foreground mb-1">{weather.lifeIndices.clothing.level}</div>
            <div className="text-xs text-muted-foreground">{weather.lifeIndices.clothing.description.substring(0, 20)}...</div>
          </div>
          
          <div className="bg-white/10 dark:bg-black/10 rounded-lg p-3 text-center hover:scale-105 transition-all">
            <div className="text-2xl mb-2">{weather.lifeIndices.travel.emoji}</div>
            <div className="text-xs text-muted-foreground mb-1">Seyahat</div>
            <div className="text-sm font-bold text-foreground mb-1">{weather.lifeIndices.travel.level}</div>
            <div className="text-xs text-muted-foreground">{weather.lifeIndices.travel.description.substring(0, 20)}...</div>
          </div>
          
          <div className="bg-white/10 dark:bg-black/10 rounded-lg p-3 text-center hover:scale-105 transition-all">
            <div className="text-2xl mb-2">{weather.lifeIndices.driving.emoji}</div>
            <div className="text-xs text-muted-foreground mb-1">Sürüş</div>
            <div className="text-sm font-bold text-foreground mb-1">{weather.lifeIndices.driving.level}</div>
            <div className="text-xs text-muted-foreground">{weather.lifeIndices.driving.description.substring(0, 20)}...</div>
          </div>
          
          <div className="bg-white/10 dark:bg-black/10 rounded-lg p-3 text-center hover:scale-105 transition-all">
            <div className="text-2xl mb-2">{weather.lifeIndices.skin.emoji}</div>
            <div className="text-xs text-muted-foreground mb-1">Cilt Bakımı</div>
            <div className="text-sm font-bold text-foreground mb-1">{weather.lifeIndices.skin.level}</div>
            <div className="text-xs text-muted-foreground">{weather.lifeIndices.skin.description.substring(0, 20)}...</div>
          </div>
          
          <div className="bg-white/10 dark:bg-black/10 rounded-lg p-3 text-center hover:scale-105 transition-all">
            <div className="text-2xl mb-2">💤</div>
            <div className="text-xs text-muted-foreground mb-1">Uyku</div>
            <div className="text-sm font-bold text-foreground mb-1">{sleepIndex.level}</div>
            <div className="text-xs text-muted-foreground">%{sleepIndex.score}</div>
          </div>
        </div>
      </div>
    </div>
  );
}