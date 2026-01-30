import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private base = environment.API_BASE_URL;

  constructor(private http: HttpClient) {}

  upload(file: File, type: 'OCR' | 'TRANSCRIPTION') {
    const form = new FormData();
    form.append('file', file);
    form.append('type', type);

    return this.http.post<{ job_id: string }>(
      `${this.base}/upload`,
      form
    );
  }

  status(jobId: string) {
    return this.http.get<any>(`${this.base}/status/${jobId}`);
  }
}
