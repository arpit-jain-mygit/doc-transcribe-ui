import { Component } from '@angular/core';
import { ApiService } from '../services/api.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

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

  // 🔥 IMPORTANT
  outputPath?: string;
  safeOutputPath?: SafeUrl;

  pollingTimer?: any;

  constructor(
    private api: ApiService,
    private sanitizer: DomSanitizer
  ) {}

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
        this.safeOutputPath = undefined;

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

          // ✅ THIS IS THE FIX
          if (res.output_path) {
            this.outputPath = res.output_path;

            this.safeOutputPath =
              this.sanitizer.bypassSecurityTrustUrl(res.output_path);
          }

          if (res.status === 'COMPLETED' || res.status === 'FAILED') {
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
