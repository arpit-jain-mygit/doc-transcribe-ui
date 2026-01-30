import 'zone.js'; // ✅ THIS IS THE FIX

import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app';

bootstrapApplication(AppComponent)
  .catch(err => console.error(err));
