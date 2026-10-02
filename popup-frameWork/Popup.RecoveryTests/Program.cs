using System.Net;
using System.Reflection;
using System.Text.Json;
using Popup.Dtos;
using Popup.Services;
using Popup.Services.Auth;

internal static class Program
{
    private static int _checks;
    private static void Check(bool value, string message)
    {
        if (!value) throw new Exception(message);
        _checks++;
    }

    private static async Task<T> Throws<T>(Func<Task> action) where T : Exception
    {
        try { await action(); }
        catch (T exception) { _checks++; return exception; }
        throw new Exception($"Expected {typeof(T).Name}");
    }

    private static HttpResponseMessage Response(HttpStatusCode status, string body = "{}")
        => new(status) { Content = new StringContent(body) };

    private static async Task Main()
    {
        var recovery = new PopupPollingRecovery();
        Check(!recovery.IsRecovering, "Startup is normal");
        for (int i = 0; i < 15; i++)
        {
            Check(recovery.NextDelay().TotalSeconds == (i > 0 && i % 3 == 0 ? 1810 : 10),
                $"Recovery request {i + 1} follows 3 attempts x 5 cycles");
        }
        Check(recovery.NextDelay().TotalSeconds == 3600, "After all 15 failed retries wait 60 minutes");
        Check(recovery.NextDelay().TotalSeconds == 3600, "Long outage keeps checking");
        for (int stage = 0; stage < 17; stage++)
        {
            recovery.Reset();
            for (int i = 0; i < stage; i++) recovery.NextDelay();
            recovery.Reset();
            Check(!recovery.IsRecovering && recovery.NextDelay().TotalSeconds == 10,
                $"Success at stage {stage} clears every recovery counter");
        }
        Check(PopupPollingRecovery.NormalDelay(0, TimeSpan.Zero).TotalSeconds == 1800, "Clamp minimum");
        Check(PopupPollingRecovery.NormalDelay(99999, TimeSpan.Zero).TotalSeconds == 3600, "Clamp maximum");
        Check(PopupPollingRecovery.NormalDelay(3600, TimeSpan.FromSeconds(15)).TotalSeconds == 3585, "401 latency does not reset startup epoch");
        Check(PopupPollingRecovery.NormalDelay(1800, TimeSpan.FromSeconds(3610)).TotalSeconds == 1790, "Recovered server interval uses original epoch");
        foreach (HttpStatusCode status in Enum.GetValues<HttpStatusCode>().Distinct())
        {
            bool transient = (int)status is 500 or 502 or 503 or 504;
            Check(PopupPollingRecovery.IsTransient(new HttpRequestException("test", null, status)) == transient,
                $"HTTP {(int)status} classification");
        }
        Check(PopupPollingRecovery.IsTransient(new HttpRequestException("DNS")), "Network failure");
        Check(PopupPollingRecovery.IsTransient(new TaskCanceledException()), "HttpClient timeout");
        Check(!PopupPollingRecovery.IsTransient(new JsonException()), "Invalid JSON is not a connection failure");
        Check(!PopupPollingRecovery.IsTransient(new WpfClientVersionException("426", null)), "426 never recovers");

        var auth = new TestAuth();
        var handler = new Handler((request, _, call) => Task.FromResult(call == 1
            ? Response(HttpStatusCode.Unauthorized)
            : Response(HttpStatusCode.OK, "{\"pollingIntervalSeconds\":2700,\"popups\":[]}")));
        using var client = new HttpClient(handler);
        var api = new PopupApiService("http://test/p", auth, httpClient: client);
        var list = await api.GetWpfPopupsAsync();
        Check(handler.Calls == 2 && auth.Refreshes == 1 && list.PollingIntervalSeconds == 2700, "401 refreshes once and replays same GET");
        Check(handler.Headers.SequenceEqual(new[] { "Bearer old", "Bearer new" }), "Replay uses refreshed token");
        Check(handler.Paths.All(x => x == "/p/api/wpf/popups"), "Replay preserves URL");

        var repeat401 = new Handler((_, _, _) => Task.FromResult(Response(HttpStatusCode.Unauthorized)));
        using var repeatClient = new HttpClient(repeat401);
        var repeatAuth = new TestAuth();
        await Throws<HttpRequestException>(() => new PopupApiService("http://test/p", repeatAuth, httpClient: repeatClient).GetWpfPopupsAsync());
        Check(repeat401.Calls == 2 && repeatAuth.Refreshes == 1, "Repeated 401 cannot loop forever");

        var versionHandler = new Handler((_, _, _) => Task.FromResult(Response(HttpStatusCode.UpgradeRequired)));
        using var versionClient = new HttpClient(versionHandler);
        var versionApi = new PopupApiService("http://test/p", httpClient: versionClient);
        var path = Path.Combine(Path.GetTempPath(), Guid.NewGuid() + ".json");
        try
        {
            var queue = new PopupResultQueue(versionApi, path);
            await queue.EnqueueAsync(new WpfResultItemDto { ResultId = "keep", PopupId = "notice", ResultType = WpfResultType.Closed });
            await Throws<WpfClientVersionException>(() => queue.FlushAsync());
            Check(File.ReadAllText(path).Contains("keep"), "426 preserves pending file");
            await queue.FlushAsync();
            Check(versionHandler.Calls == 1, "426 stops queued POST requests");
            queue.StopTransmission();
            await queue.EnqueueAsync(new WpfResultItemDto { ResultId = "after", PopupId = "notice", ResultType = WpfResultType.Closed });
            Check(File.ReadAllText(path).Contains("after"), "Stopping transmission still allows local saving");
            versionApi.StopRequests();
            await Throws<OperationCanceledException>(() => versionApi.GetWpfPopupsAsync());
            Check(versionHandler.Calls == 1, "Stopped API sends no new GET");
        }
        finally { File.Delete(path); }

        var entered = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
        var slow = new Handler(async (_, token, _) =>
        {
            entered.SetResult();
            await Task.Delay(Timeout.Infinite, token);
            return Response(HttpStatusCode.OK);
        });
        using var slowClient = new HttpClient(slow);
        var slowApi = new PopupApiService("http://test/p", httpClient: slowClient);
        Task requestTask = slowApi.GetWpfPopupsAsync();
        await entered.Task.WaitAsync(TimeSpan.FromSeconds(5));
        slowApi.StopRequests();
        await Throws<OperationCanceledException>(() => requestTask);
        Check(slow.Calls == 1, "Exit cancels an in-flight request without replay");

        // 실제 SsoAuthHeaderProvider와 로그인 API를 연결한다. 최초 SSO에서 얻은 메모리 사용자만 주입한다.
        var loginFailure = new Handler((_, _, _) => Task.FromResult(Response(HttpStatusCode.ServiceUnavailable)));
        using var loginClient = new HttpClient(loginFailure);
        using var provider = SeedProvider(loginClient);
        var loginException = await Throws<HttpRequestException>(() => provider.GetAuthorizationHeaderAsync());
        Check(loginException.StatusCode == HttpStatusCode.ServiceUnavailable, "Login 503 reaches polling recovery without becoming 401");
        var loginVersion = new Handler((_, _, _) => Task.FromResult(Response(HttpStatusCode.UpgradeRequired)));
        using var loginVersionClient = new HttpClient(loginVersion);
        using var versionProvider = SeedProvider(loginVersionClient);
        var rejected = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
        versionProvider.ClientVersionRejected += (_, _) => rejected.TrySetResult();
        versionProvider.StartPeriodicLogin(TimeSpan.FromMilliseconds(1));
        await rejected.Task.WaitAsync(TimeSpan.FromSeconds(5));
        Check(loginVersion.Calls == 1, "Periodic login 426 notifies immediately and stops its loop");
        var resumed = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
        var periodicHandler = new Handler((_, _, call) =>
        {
            if (call == 1) return Task.FromResult(Response(HttpStatusCode.ServiceUnavailable));
            resumed.TrySetResult();
            return Task.FromResult(Response(HttpStatusCode.OK,
                "{\"accessToken\":\"restored\",\"expiresAt\":\"2026-10-02T12:00:00+09:00\"}"));
        });
        using var periodicClient = new HttpClient(periodicHandler);
        using var periodicProvider = SeedProvider(periodicClient);
        periodicProvider.StartPeriodicLogin(TimeSpan.FromMilliseconds(20));
        await resumed.Task.WaitAsync(TimeSpan.FromSeconds(5));
        Check(await periodicProvider.GetAuthorizationHeaderAsync() == "Bearer restored", "Periodic login survives a 503 and restores token");
        Check(periodicHandler.Calls >= 2, "Periodic login continues after a transient failure");
        Console.WriteLine($"PASS: {_checks} recovery/HTTP/auth/queue checks");
    }

    private static SsoAuthHeaderProvider SeedProvider(HttpClient client)
    {
        var provider = new SsoAuthHeaderProvider(new SsoClient("http://test/sso"), new WpfLoginClient("http://test/p", null, client));
        typeof(SsoAuthHeaderProvider).GetField("_lastUser", BindingFlags.Instance | BindingFlags.NonPublic)!
            .SetValue(provider, new SsoUserInfo("test", "test"));
        return provider;
    }

    private sealed class TestAuth : IAuthHeaderProvider
    {
        public int Refreshes;
        public Task<string?> GetAuthorizationHeaderAsync(CancellationToken cancellationToken = default)
            => Task.FromResult<string?>(Refreshes == 0 ? "Bearer old" : "Bearer new");
        public Task OnUnauthorizedAsync(string? failedAuthorizationHeader, CancellationToken cancellationToken = default)
        {
            Refreshes++;
            return Task.CompletedTask;
        }
    }

    private sealed class Handler(Func<HttpRequestMessage, CancellationToken, int, Task<HttpResponseMessage>> respond) : HttpMessageHandler
    {
        public int Calls;
        public List<string?> Headers { get; } = new();
        public List<string> Paths { get; } = new();
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken token)
        {
            Calls++;
            Headers.Add(request.Headers.Authorization?.ToString());
            Paths.Add(request.RequestUri!.AbsolutePath);
            return respond(request, token, Calls);
        }
    }
}
