using System;
using System.Collections.Generic;
using System.IO;
using System.Text.Json;

namespace Popup.Services
{
    public class PopupStorageService
    {
        private static readonly Lazy<PopupStorageService> _instance =
            new(() => new PopupStorageService());

        public static PopupStorageService Instance =>
            _instance.Value;

        private readonly Dictionary<string, DateTime>
            _hiddenPopups;

        private readonly string _storageFilePath;

        private readonly object _lockObject =
            new();

        private PopupStorageService()
        {
            _storageFilePath =
                CreateStorageFilePath();

            _hiddenPopups =
                LoadHiddenPopups();
        }

        public void HideUntil(
            string popupId,
            DateTime hideUntil)
        {
            if (string.IsNullOrWhiteSpace(popupId))
            {
                return;
            }

            lock (_lockObject)
            {
                _hiddenPopups[popupId] =
                    hideUntil;

                SaveHiddenPopups();
            }
        }

        public bool IsHidden(
            string popupId)
        {
            if (string.IsNullOrWhiteSpace(popupId))
            {
                return false;
            }

            lock (_lockObject)
            {
                if (!_hiddenPopups.TryGetValue(
                        popupId,
                        out DateTime hideUntil))
                {
                    return false;
                }

                if (DateTime.Now < hideUntil)
                {
                    return true;
                }

                _hiddenPopups.Remove(
                    popupId);

                SaveHiddenPopups();

                return false;
            }
        }

        private string CreateStorageFilePath()
        {
            string localAppDataPath =
                Environment.GetFolderPath(
                    Environment.SpecialFolder.LocalApplicationData);

            string applicationFolderPath =
                Path.Combine(
                    localAppDataPath,
                    "WPFWindowsPopup");

            Directory.CreateDirectory(
                applicationFolderPath);

            return Path.Combine(
                applicationFolderPath,
                "popup-storage.json");
        }

        private Dictionary<string, DateTime>
            LoadHiddenPopups()
        {
            try
            {
                if (!File.Exists(
                        _storageFilePath))
                {
                    return new Dictionary<string, DateTime>();
                }

                string json =
                    File.ReadAllText(
                        _storageFilePath);

                if (string.IsNullOrWhiteSpace(json))
                {
                    return new Dictionary<string, DateTime>();
                }

                Dictionary<string, DateTime>? loadedData =
                    JsonSerializer.Deserialize<
                        Dictionary<string, DateTime>>(
                        json);

                return loadedData
                    ?? new Dictionary<string, DateTime>();
            }
            catch
            {
                return new Dictionary<string, DateTime>();
            }
        }

        private void SaveHiddenPopups()
        {
            try
            {
                JsonSerializerOptions options =
                    new()
                    {
                        WriteIndented = true
                    };

                string json =
                    JsonSerializer.Serialize(
                        _hiddenPopups,
                        options);

                File.WriteAllText(
                    _storageFilePath,
                    json);
            }
            catch
            {
                // 저장 실패 때문에
                // 팝업 프로그램 전체가 종료되지 않도록
                // 예외를 여기서 막는다.
            }
        }
    }
}