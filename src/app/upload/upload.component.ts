import { Component } from '@angular/core';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-upload',
  standalone: true,
  templateUrl: './upload.component.html',
})
export class UploadComponent {
  file?: File;

  jobId?: string;
  status?: string;
  progress = 0;
  stage?: string;
  outputPath?: string;

  pollingTimer?: any;

  constructor(private api: ApiService) {}

  onFileChange(e: any) {
    this.file = e.target.files?.[0];
  }

  submit(type: 'OCR' | 'TRANSCRIPTION') {
    if (!this.file) {
      alert('Please choose a file first');
      return;
    }

    console.log(`Submitting job: ${type}`, this.file.name);

    this.api.upload(this.file, type).subscribe({
      next: (res) => {
        this.jobId = res.job_id;
        this.status = 'QUEUED';
        this.progress = 0;
        this.outputPath = undefined;

        this.startPolling();
      },
      error: (err) => {
        console.error('Upload failed', err);
        alert('Upload failed');
      },
    });
  }

  startPolling() {
    if (!this.jobId) return;

    this.pollingTimer = setInterval(() => {
      this.api.status(this.jobId!).subscribe({
        next: (res) => {
          console.log('STATUS RESPONSE', res);

          this.status = res.status;
          this.stage = res.stage;
          this.progress = Number(res.progress || 0);

          // FIX: accept BOTH keys
          this.outputPath = res.output_path || res.output_uri;

          if (
            res.status?.toUpperCase() === 'COMPLETED' ||
            res.status?.toUpperCase() === 'FAILED'
          ) {
            clearInterval(this.pollingTimer);
          }
        },
        error: (err) => {
          console.error('Status polling error', err);
        },
      });
    }, 4000);
  }
}
