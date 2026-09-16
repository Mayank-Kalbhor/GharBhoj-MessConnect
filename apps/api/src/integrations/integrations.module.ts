import { Global, Module } from '@nestjs/common';
import { FirebaseAdminService } from './firebase-admin/firebase-admin.service';
import { RazorpayService } from './razorpay/razorpay.service';
import { S3Service } from './s3/s3.service';
import { GoogleMapsService } from './google-maps/google-maps.service';
import { Msg91Service } from './msg91/msg91.service';

@Global()
@Module({
  providers: [
    FirebaseAdminService,
    RazorpayService,
    S3Service,
    GoogleMapsService,
    Msg91Service
  ],
  exports: [
    FirebaseAdminService,
    RazorpayService,
    S3Service,
    GoogleMapsService,
    Msg91Service
  ]
})
export class IntegrationsModule {}
