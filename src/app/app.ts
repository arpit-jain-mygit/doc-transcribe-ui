import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UploadComponent } from './upload/upload';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, UploadComponent],
  template: `
    <h1>Doc Transcribe</h1>
    <app-upload></app-upload>
  `,
})
export class AppComponent {}
