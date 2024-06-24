// @ts-ignore
import { CommonModule } from '@angular/common';
// @ts-ignore
import { HttpClient, HttpClientModule } from '@angular/common/http';
// @ts-ignore
import { Component } from '@angular/core';
// @ts-ignore
import { RouterOutlet } from '@angular/router';
// @ts-ignore
import { UUID } from 'crypto';
// @ts-ignore
import { BehaviorSubject } from 'rxjs';

interface IApiResponse {
  id: UUID;
  message: string;
}

// @ts-ignore
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    CommonModule,
    HttpClientModule
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  apiRespStatus$: BehaviorSubject<string>;
  apiResp$: BehaviorSubject<IApiResponse>;

  ftpStatus$: BehaviorSubject<string>;
  ftpReady = false;

  constructor(
    private http: HttpClient
  ) {
    this.apiRespStatus$ = new BehaviorSubject<string>(
      "The response was not received yet, it may take a while...")
    this.apiResp$ = new BehaviorSubject<IApiResponse>({} as IApiResponse);
    this.ftpStatus$ = new BehaviorSubject<string>(
      "Checking if FTP is available...");
  }

  private serverUrl = "https://localhost:5089";

  ngOnInit(): void {
    this.http.get<IApiResponse>(this.serverUrl + "/api").subscribe({
      next: (data: any) => {
        this.apiRespStatus$.next("API retrieval completed!");
        this.apiResp$.next(data);
      },
      error: (error: any) => {
        this.apiRespStatus$.next(
          "API retrieval failed! The server is probably down.");
      }
    });

    this.http.get(this.serverUrl + "/ftp").subscribe({
      next: (data: any) => {
        this.ftpStatus$.next("Good to go!");
        this.ftpReady = true;
      },
      error: (error: any) => {
        this.ftpStatus$.next("FTP is down!");
        this.ftpReady = false;
      }
    });
  }

  onDownload(): void {
    this.http.get(this.serverUrl + "/download",
      { responseType: "blob" as "json" }).subscribe(
        (response: any) => {
          let dataType = response.type;
          let binaryData = [];
          binaryData.push(response);
          let downloadLink = document.createElement("a");
          downloadLink.href = window.URL.createObjectURL(
            new Blob(binaryData, { type: dataType }));
          downloadLink.setAttribute("download", "ftp_file.txt");
          document.body.appendChild(downloadLink);
          downloadLink.click();
        });
  }
}
