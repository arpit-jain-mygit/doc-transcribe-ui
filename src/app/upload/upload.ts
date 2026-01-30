import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './upload.html',
})
export class UploadComponent {
  file?: File;
  jobId?: string;
  status?: string;
  progress = 0;

  constructor(private api: ApiService) {}

  onFileChange(e: any) {
    this.file = e.target.files[0];
  }

submit(type: 'OCR' | 'TRANSCRIPTION') {
  if (!this.file) return;

  console.log('Submitting job:', type, this.file.name);

  this.api.upload(this.file, type).subscribe(res => {
    this.jobId = res.job_id;
    this.status = 'QUEUED';
    this.poll();
  });
}

  poll() {
    const timer = setInterval(() => {
      if (!this.jobId) return;

      this.api.status(this.jobId).subscribe(res => {
        this.status = res.status;
        this.progress = Number(res.progress || 0);

        if (res.status === 'COMPLETED' || res.status === 'FAILED') {
          clearInterval(timer);
        }
      });
    }, 2000);
  }
}
