import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface UploadResponse {
  job_id: string;
  gcs_uri: string;
  filename: string;
}

export interface JobStatus {
  job_id: string;
  status: string;
  progress: number;
  stage?: string;
  eta_sec?: number;
  current_page?: number;
  total_pages?: number;
  output_uri?: string;
  error?: string;
}

@Injectable({ providedIn: 'root' })
export class UploadService {
  private API = 'https://doc-transcribe-api.onrender.com';

  constructor(private http: HttpClient) {}

  upload(file: File): Observable<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<UploadResponse>(`${this.API}/upload`, formData);
  }

  getJob(jobId: string): Observable<JobStatus> {
    return this.http.get<JobStatus>(`${this.API}/jobs/${jobId}`);
  }
}
