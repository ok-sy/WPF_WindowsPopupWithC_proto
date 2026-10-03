using System.Runtime.InteropServices;
using System.Windows.Threading;

namespace Popup.Services;

public readonly record struct MasterVolumeState(double Volume, bool Muted);

public interface IMasterVolume : IDisposable
{
    event Action<MasterVolumeState?>? Changed;
    MasterVolumeState? State { get; }
    bool SetVolume(double volume);
    bool SetMute(bool muted);
}

// All COM ownership stays on the WPF dispatcher. The native callback only queues a refresh.
public sealed class WindowsMasterVolume : IMasterVolume
{
    private readonly Dispatcher _dispatcher;
    private readonly DispatcherTimer _retry;
    private readonly VolumeCallback _callback;
    private IMMDeviceEnumerator? _enumerator;
    private IAudioEndpointVolume? _endpoint;
    private string? _deviceId;
    private bool _disposed;
    public event Action<MasterVolumeState?>? Changed;
    public MasterVolumeState? State { get; private set; }

    public WindowsMasterVolume(Dispatcher dispatcher)
    {
        _dispatcher = dispatcher;
        _callback = new VolumeCallback(() =>
        {
            if (!_dispatcher.HasShutdownStarted)
                _dispatcher.BeginInvoke(new Action(() => { if (!_disposed) Refresh(); }));
        });
        // Detect default endpoint replacement and recover when no audio device was available.
        _retry = new DispatcherTimer(TimeSpan.FromSeconds(2), DispatcherPriority.Background,
            (_, _) => Refresh(), dispatcher);
        Refresh();
    }

    private void Refresh()
    {
        if (_disposed) return;
        IMMDevice? device = null;
        try
        {
            _enumerator ??= (IMMDeviceEnumerator)new DeviceEnumerator();
            _enumerator.GetDefaultAudioEndpoint(0, 1, out device); // render / multimedia
            device.GetId(out string id);
            if (_endpoint == null || id != _deviceId)
            {
                ReleaseEndpoint();
                Guid iid = typeof(IAudioEndpointVolume).GUID;
                device.Activate(ref iid, 23, IntPtr.Zero, out object endpoint);
                _endpoint = (IAudioEndpointVolume)endpoint;
                _endpoint.RegisterControlChangeNotify(_callback);
                _deviceId = id;
            }
            _endpoint.GetMasterVolumeLevelScalar(out float volume);
            _endpoint.GetMute(out bool muted);
            Publish(new MasterVolumeState(volume, muted));
        }
        catch
        {
            ReleaseEndpoint();
            Publish(null);
        }
        finally { Release(device); }
    }

    private void Publish(MasterVolumeState? state)
    {
        if (State == state) return;
        State = state;
        Changed?.Invoke(state);
    }

    public bool SetVolume(double volume) => Write(endpoint =>
    {
        Guid context = Guid.Empty;
        endpoint.SetMasterVolumeLevelScalar((float)Math.Clamp(volume, 0, 1), ref context);
        // Raising the slider must make a muted endpoint audible.
        if (volume > 0) endpoint.SetMute(false, ref context);
    });

    public bool SetMute(bool muted) => Write(endpoint =>
    {
        Guid context = Guid.Empty;
        endpoint.SetMute(muted, ref context);
    });

    private bool Write(Action<IAudioEndpointVolume> action)
    {
        if (_disposed || _endpoint == null) return false;
        try { action(_endpoint); Refresh(); return State != null; }
        catch { Refresh(); return false; }
    }

    private void ReleaseEndpoint()
    {
        if (_endpoint != null)
        {
            try { _endpoint.UnregisterControlChangeNotify(_callback); } catch { }
            Release(_endpoint);
        }
        _endpoint = null;
        _deviceId = null;
    }

    private static void Release(object? value)
    {
        if (value != null && Marshal.IsComObject(value)) Marshal.ReleaseComObject(value);
    }

    public void Dispose()
    {
        if (_disposed) return;
        _disposed = true;
        _retry.Stop();
        ReleaseEndpoint();
        Release(_enumerator);
        _enumerator = null;
        Changed = null;
        // Never restore endpoint values: preserve the final user setting.
    }

    [ComVisible(true), ClassInterface(ClassInterfaceType.None)]
    private sealed class VolumeCallback(Action changed) : IAudioEndpointVolumeCallback
    {
        public int OnNotify(IntPtr data)
        {
            // Never propagate dispatcher shutdown races across the native callback boundary.
            try { changed(); } catch { }
            return 0;
        }
    }
}

[ComImport, Guid("BCDE0395-E52F-467C-8E3D-C4579291692E")]
internal class DeviceEnumerator { }

[ComImport, Guid("A95664D2-9614-4F35-A746-DE8DB63617E6"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
internal interface IMMDeviceEnumerator
{
    void EnumAudioEndpoints(int flow, uint mask, out IntPtr devices);
    void GetDefaultAudioEndpoint(int flow, int role, out IMMDevice device);
    void GetDevice([MarshalAs(UnmanagedType.LPWStr)] string id, out IMMDevice device);
    void RegisterEndpointNotificationCallback(IntPtr callback);
    void UnregisterEndpointNotificationCallback(IntPtr callback);
}

[ComImport, Guid("D666063F-1587-4E43-81F1-B948E807363F"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
internal interface IMMDevice
{
    void Activate(ref Guid iid, uint context, IntPtr parameters, [MarshalAs(UnmanagedType.IUnknown)] out object result);
    void OpenPropertyStore(uint access, out IntPtr properties);
    void GetId([MarshalAs(UnmanagedType.LPWStr)] out string id);
    void GetState(out uint state);
}

[ComVisible(true), Guid("657804FA-D6AD-4496-8A60-352752AF4F89"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
internal interface IAudioEndpointVolumeCallback
{
    [PreserveSig] int OnNotify(IntPtr data);
}

[ComImport, Guid("5CDF2C82-841E-4546-9722-0CF74078229A"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
internal interface IAudioEndpointVolume
{
    void RegisterControlChangeNotify(IAudioEndpointVolumeCallback callback);
    void UnregisterControlChangeNotify(IAudioEndpointVolumeCallback callback);
    void GetChannelCount(out uint count);
    void SetMasterVolumeLevel(float level, ref Guid context);
    void SetMasterVolumeLevelScalar(float level, ref Guid context);
    void GetMasterVolumeLevel(out float level);
    void GetMasterVolumeLevelScalar(out float level);
    void SetChannelVolumeLevel(uint channel, float level, ref Guid context);
    void SetChannelVolumeLevelScalar(uint channel, float level, ref Guid context);
    void GetChannelVolumeLevel(uint channel, out float level);
    void GetChannelVolumeLevelScalar(uint channel, out float level);
    void SetMute([MarshalAs(UnmanagedType.Bool)] bool muted, ref Guid context);
    void GetMute([MarshalAs(UnmanagedType.Bool)] out bool muted);
    void GetVolumeStepInfo(out uint step, out uint count);
    void VolumeStepUp(ref Guid context);
    void VolumeStepDown(ref Guid context);
    void QueryHardwareSupport(out uint mask);
    void GetVolumeRange(out float minimum, out float maximum, out float increment);
}
