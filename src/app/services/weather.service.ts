import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { locationDetails } from '../models/locationDetails';
import { weatherDetails } from '../models/weatherDetails';
import { temperatureData } from '../models/temperatureData';
import { todayData } from '../models/todayData';
import { weekData } from '../models/weekData';
import { todaysHighlight } from '../models/todaysHighlight';
import { Observable } from 'rxjs';
import { envVariables } from '../environments/envVariables';

@Injectable({
  providedIn: 'root'
})
export class WeatherService {
  loading: boolean = false;

  locationDetails?: locationDetails;
  weatherDetails?: weatherDetails;

  temperatureData: temperatureData;
  todayData?: todayData[] = [];
  weekData?: weekData[] = [];
  todaysHighlight?: todaysHighlight;

  cityName: string = 'Bangalore';
  language: string = 'en-US';
  date: string = '20200622';
  units: string = 'm';

  currentTime: Date;

  //variables to control tabs
  today: boolean = false;
  week: boolean = true;

  //variables to control metric value
  celsius: boolean = true;
  fahrenheit: boolean = false;

  constructor(private httpClient: HttpClient) { 
    this.getData();
  }

  getSummaryimage(summary: string): string {
    var baseAddress = 'assets/images/';

    var cloudySunny = 'cloudySunny.png';
    var rainySunny = 'rainySunny.png';
    var windy = 'windy.png';
    var sunny = 'sun.png';
    var rainy = 'rain.png';

    if(summary.includes('Partially Cloudy') || summary.includes('P Cloudy'))
      return baseAddress + cloudySunny;
    else if(summary.includes('Partially Rainy') || summary.includes('P Rainy'))
      return baseAddress + rainySunny;
    else if(summary.includes('wind'))
      return baseAddress + windy;
    else if(summary.includes('rain'))
      return baseAddress + rainy;
    else if(summary.includes('sun'))
      return baseAddress + sunny;

    return baseAddress + cloudySunny;

  }

  fillTempDataModel(): void {
    this.currentTime = new Date();
    this.temperatureData.day = this.weatherDetails['v3-wx-observations-current'].dayOfWeek;
    this.temperatureData.time = `${String(this.currentTime.getHours()).padStart(2,'0')}:${String(this.currentTime.getMinutes()).padStart(2,'0')}`;
    this.temperatureData.temperature = this.weatherDetails['v3-wx-observations-current'].temperature;
    this.temperatureData.location = `${this.locationDetails.location.city[0]}, ${this.locationDetails.location.country[0]}`;
    this.temperatureData.rainProbability =  this.weatherDetails['v3-wx-observations-current'].precip24Hour;
    this.temperatureData.summaryPhrase = this.weatherDetails['v3-wx-observations-current'].wxPhraseShort;
    this.temperatureData.summaryImage = this.getSummaryimage(this.temperatureData.summaryPhrase);
  }

  fillWeekDataModel(): void {
    var weekCount = 0;
    while(weekCount < 7) {
    this.weekData.push(new weekData());
    this.weekData[weekCount].day = this.weatherDetails['v3-wx-forecast-daily-15day'].dayOfWeek[weekCount].slice(0,3);
    this.weekData[weekCount].tempMax = this.weatherDetails['v3-wx-forecast-daily-15day'].calendarDayTemperatureMax[weekCount];
    this.weekData[weekCount].tempMin = this.weatherDetails['v3-wx-forecast-daily-15day'].calendarDayTemperatureMin[weekCount];
    this.weekData[weekCount].summaryImage = this.getSummaryimage(this.weatherDetails['v3-wx-forecast-daily-15day'].narrative[weekCount]);
    weekCount++;    
    }
  }

  fillTodayDataModel(): void {
    var todayCount = 0;
    while(todayCount < 7) {
      this.todayData.push(new todayData());
      this.todayData[todayCount].time = this.weatherDetails['v3-wx-forecast-hourly-10day'].validTimeLocal[todayCount].slice(11,16);
      this.todayData[todayCount].temperature = this.weatherDetails['v3-wx-forecast-hourly-10day'].temperature[todayCount];
      this.todayData[todayCount].summaryImage = this.getSummaryimage(this.weatherDetails['v3-wx-forecast-hourly-10day'].wxPhraseShort[todayCount]);
      todayCount++;
    }
  }

  fillTodaysHighlightModel(): void {
    this.todaysHighlight.uvIndex = this.weatherDetails['v3-wx-observations-current'].uvIndex;
    this.todaysHighlight.windSpeed = this.weatherDetails['v3-wx-observations-current'].windSpeed;
    this.todaysHighlight.sunrise = this.weatherDetails['v3-wx-observations-current'].sunriseTimeLocal.slice(11,16);
    this.todaysHighlight.sunset = this.weatherDetails['v3-wx-observations-current'].sunsetTimeLocal.slice(11,16);
    this.todaysHighlight.humidity = this.weatherDetails['v3-wx-observations-current'].relativeHumidity;
    this.todaysHighlight.visibility = this.weatherDetails['v3-wx-observations-current'].visibility;
    this.todaysHighlight.airQuality = this.weatherDetails['v3-wx-globalAirQuality'].globalairquality.airQualityIndex;
  }

  prepareData(): void {
    //setting left component data model
    this.fillTempDataModel();
    this.fillWeekDataModel();
    this.fillTodayDataModel();
    this.fillTodaysHighlightModel();

    console.log(this.temperatureData);
    console.log(this.weekData);
    console.log(this.todayData);
    console.log(this.todaysHighlight);
  }

  celciusToFahrenheit(celcius: number): number {
    return (celcius * 9/5) + 32;
  }

  fahrenheitToCelcius(fahrenheit: number): number {
    return (fahrenheit - 32) * 5/9;
  }

  getLocationDetails(cityName: string, language: string): Observable<locationDetails> {
    return this.httpClient.get<locationDetails>(envVariables.weatherApiLocationBaseUrl, {
      headers: new HttpHeaders()
      .set(envVariables.xRapidApiHostKeyName, envVariables.xRapidApiHostKeyValue)
      .set(envVariables.xRapidApiKeyName, envVariables.xRapidApiKeyValue),
      params: new HttpParams()
      .set('query', cityName)
      .set('language', language)
    })
  }


  getWeatherReport(date: string, lat: number, long: number, language: string, units: string):Observable<weatherDetails> {
    return this.httpClient.get<weatherDetails>(envVariables.weatherApiForecastBaseUrl, {
      headers: new HttpHeaders()
      .set(envVariables.xRapidApiHostKeyName, envVariables.xRapidApiHostKeyValue)
      .set(envVariables.xRapidApiKeyName, envVariables.xRapidApiKeyValue),
      params: new HttpParams()
      .set('date', date)
      .set('latitude', lat)
      .set('longitude', long)
      .set('language', language)
      .set('units', units)
    })
  }

  getData() {

    this.loading = true;
    this.todayData = [];
    this.weekData = [];
    this.temperatureData = new temperatureData();
    this.todaysHighlight =  new todaysHighlight();

    var lat = 0;
    var long = 0;
    this.getLocationDetails(this.cityName, this.language).subscribe({
      next: (response) => {
        this.locationDetails = response;
        lat = this.locationDetails?.location.latitude[0];
        long = this.locationDetails?.location.longitude[0];


        this.getWeatherReport(this.date, lat, long, this.language, this.units).subscribe({
          next: (response) => {
            this.weatherDetails = response;
            this.prepareData();
            this.loading = false;
          },
          error: () => {
            this.loading = false;
          }
        });  
      },
      error: () => {
        this.loading = false;
      } 
    });
  }
}
