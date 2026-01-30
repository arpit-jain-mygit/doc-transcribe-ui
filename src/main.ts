// main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { UploadComponent } from './app/upload/upload.component';

bootstrapApplication(UploadComponent)
  .catch(err => console.error(err));
