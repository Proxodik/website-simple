using System.Net;
using System.Net.NetworkInformation;
using System.Security.Cryptography.X509Certificates;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddCors();

var app = builder.Build();
app.UseCors(
    options => options.AllowAnyOrigin().AllowAnyMethod()
);

app.MapGet("/api/sample", () =>
{
    var response = new ApiResponse(
        Guid.NewGuid(),
        $"Hey, this was received from [{Dns.GetHostName()}]!"
    );
    return Results.Ok(response);
});

bool ftpLive = false;
string ftpServer = "fs-1.fallen.lan";

app.MapGet("/api/ftp", async () =>
{
    var ping = new Ping();
    var resp = await ping.SendPingAsync(ftpServer);
    if (resp.Status  == IPStatus.Success)
    {
        ftpLive = true;
        Results.Ok();
    }
    else
    {
        ftpLive = false;
        Results.NotFound();
    }
});

app.MapGet("/api/download", async () =>
{
    if (ftpLive)
    {
        var ftpRequest = (FtpWebRequest)
            WebRequest.Create($"ftp://{ftpServer}/test_file.txt");
        ftpRequest.Credentials = new NetworkCredential("vsftpd", "password");
        ftpRequest.Method = WebRequestMethods.Ftp.DownloadFile;
        ftpRequest.KeepAlive = false;

        ftpRequest.EnableSsl = true;
        var cert = X509Certificate.CreateFromCertFile("/home/fallen/cacert.pem");
        ftpRequest.ClientCertificates.Add(cert);
        
        var resp = await ftpRequest.GetResponseAsync();
        var ftpStream = resp.GetResponseStream();
        
        return ftpStream == null 
                ? Results.NotFound() 
                : Results.File(ftpStream, "application/octet-stream", "ftp_file.txt");
    }
    else
        return Results.NotFound();
});

app.Run();

record ApiResponse(Guid Id, string? Message);