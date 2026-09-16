import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleMapsService {
  private readonly logger = new Logger(GoogleMapsService.name);
  private readonly apiKey: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('GOOGLE_MAPS_SERVER_API_KEY') || 'mock_maps_key';
  }

  async geocode(address: string): Promise<{ latitude: number; longitude: number }> {
    this.logger.log(`Geocoding address: ${address}`);
    // Mock geocode response for default testing
    return {
      latitude: 22.7196,
      longitude: 75.8577
    };
  }

  async calculateEtaMinutes(origin: { lat: number; lng: number }, destination: { lat: number; lng: number }): Promise<number> {
    this.logger.log(`Calculating route ETA between (${origin.lat}, ${origin.lng}) and (${destination.lat}, ${destination.lng})`);
    return 25; // 25 mins ETA
  }
}
