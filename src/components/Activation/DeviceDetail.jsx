/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import './DeviceDetail.css';

const DeviceDetail = () => {
  const { id } = useParams();
  const [device, setDevice] = useState(null);
  const [isOn, setIsOn] = useState(false);
  const [localStatus, setLocalStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [popupMessage, setPopupMessage] = useState('');
  const [popupType, setPopupType] = useState('success');
  const [showPopup, setShowPopup] = useState(false);
  const [dailyData, setDailyData] = useState({ deviceId: '', usedHoursToday: 0 });
  const [loadingDaily, setLoadingDaily] = useState(true);

  const triggerPopup = (message, type = 'success') => {
    setPopupMessage(message);
    setPopupType(type);
    setShowPopup(true);
    setTimeout(() => setShowPopup(false), 3000);
  };

  const handleCopyTopic = (text) => {
  navigator.clipboard.writeText(text)
    .then(() => triggerPopup('Topik berhasil disalin'))
    .catch(() => triggerPopup('Gagal menyalin topik', 'error'));
};


  const fetchDevice = async () => {
    const token = localStorage.getItem('accessToken');
    try {
      const res = await fetch(`http://localhost:5000/v1/devices/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });
      const result = await res.json();
      if (!res.ok || !result.data?.device) {
        throw new Error(result.message || 'Gagal memuat detail perangkat');
      }
      const deviceData = result.data.device;
      setDevice(deviceData);
      setIsOn(deviceData.status?.toLowerCase() === 'active');
      setLocalStatus(deviceData.status);
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan saat mengambil data perangkat');
    } finally {
      setLoading(false);
    }
  };

  const fetchDailyData = async () => {
    const token = localStorage.getItem('accessToken');
    setLoadingDaily(true);
    try {
      const res = await fetch(`http://localhost:5000/v1/devices/${id}/daily`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });
      const result = await res.json();
      if (!res.ok || result.status !== 'success') {
        throw new Error(result.message || 'Gagal ambil data harian');
      }
      const data = result?.data || {};
      setDailyData({
        deviceId: data.deviceId || data.deviceid || 'Tidak diketahui',
        usedHoursToday: typeof data.usedHoursToday === 'number' ? data.usedHoursToday : 0,
      });
    } catch (err) {
      triggerPopup(err.message || 'Gagal mengambil data harian', 'error');
    } finally {
      setLoadingDaily(false);
    }
  };

  const updateDeviceStatus = async (status) => {
    const token = localStorage.getItem('accessToken');
    try {
      const res = await fetch(`http://localhost:5000/v1/devices/${id}/control`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ command: 'power', action: status ? 'on' : 'off' }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Permintaan gagal');

      setIsOn(status);
      triggerPopup(`Perangkat berhasil ${status ? 'dinyalakan' : 'dimatikan'}`);
      fetchDevice(); // Refresh detail setelah status berubah
    } catch (err) {
      triggerPopup(`Gagal mengubah status: ${err.message}`, 'error');
    }
  };

  const handleChangeTopic = async (type) => {
    const token = localStorage.getItem('accessToken');
    const endpoint = type === 'sensor' ? 'mqttsensor' : 'mqttcontrol';
    try {
      const res = await fetch(`http://localhost:5000/v1/devices/${id}/${endpoint}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message);
      triggerPopup(`Topik ${type} berhasil diubah`);
    } catch (err) {
      triggerPopup(`Gagal mengubah topik ${type}: ${err.message}`, 'error');
    }
  };

  const formatDateTime = (value) => {
    const date = new Date(value);
    return !isNaN(date) ? date.toLocaleString('id-ID') : 'Tidak tersedia';
  };

  useEffect(() => {
    if (!id) {
      setError('ID perangkat tidak ditemukan.');
      setLoading(false);
      setLoadingDaily(false);
      return;
    }
    fetchDevice();
    fetchDailyData();
  }, [id]);

  if (loading) return <div className="loading-message">🔄 Memuat data perangkat...</div>;
  if (error) return <div className="error-message">❌ {error}</div>;

  return (
    <div className="device-detail-container">
      <h2>Detail Perangkat Rover</h2>

      {device ? (
        <div className="device-detail-card">
          <div className="detail-item"><strong>ID Perangkat:</strong><div className="detail-value">{device.id}</div></div>
          <div className="detail-item"><strong>Status:</strong><div className={`status-badge ${localStatus.toLowerCase()}`}>{localStatus}</div></div>
          <div className="detail-item"><strong>Rental ID:</strong><div className="detail-value">{device.rental_id || 'Tidak tersedia'}</div></div>
          <div className="detail-item"><strong>Last Issue:</strong><div className="detail-value">{device.last_reported_issue || 'Tidak ada'}</div></div>
          <div className="detail-item"><strong>Total Active:</strong><div className="detail-value">{device.last_active}</div></div>
          <div className="detail-item">
            <strong>Sensor Topic:</strong>
            <div className="topic-with-button">
              <code className="topic-text">{device.sensor_topic}</code>
              <button onClick={() => handleCopyTopic(device.sensor_topic)}>Copy</button>
              <button onClick={() => handleChangeTopic('sensor')}>Change</button>
            </div>
          </div>

          <div className="detail-item">
            <strong>Control Topic:</strong>
            <div className="topic-with-button">
              <code className="topic-text">{device.control_topic}</code>
              <button onClick={() => handleCopyTopic(device.control_topic)}>Copy</button>
              <button onClick={() => handleChangeTopic('control')}>Change</button>
            </div>
          </div>

          <div className="detail-item"><strong>Created At:</strong><div className="detail-value">{formatDateTime(device.created_at)}</div></div>
        </div>
      ) : (
        <div>Perangkat tidak ditemukan</div>
      )}

      <div className="toggle-buttons">
        <button className={`on-btn ${isOn ? 'active' : ''}`} onClick={() => updateDeviceStatus(true)}>ON</button>
        <button className={`off-btn ${!isOn ? 'active' : ''}`} onClick={() => updateDeviceStatus(false)}>OFF</button>
      </div>

      <div className="daily-data">
        <h3>Penggunaan Hari Ini</h3>
        <button onClick={fetchDailyData} className="refresh-daily-button">🔄 Refresh</button>
        {loadingDaily ? (
          <p>Memuat data jam pemakaian...</p>
        ) : (
          <>
            <p><strong>Device ID:</strong> {dailyData.deviceId}</p>
            {dailyData.usedHoursToday === 0 ? (
              <p><strong>Perangkat belum digunakan hari ini.</strong></p>
            ) : (
              <p><strong>Waktu Penggunaan Perangkat Hari Ini:</strong> {dailyData.usedHoursToday.toFixed(2)} jam</p>
            )}
          </>
        )}
      </div>

      {showPopup && (
        <div className={`notification-popup ${popupType}`}>
          <div className="popup-icon">{popupType === 'error' ? '⚠️' : '✅'}</div>
          <div className="popup-content">
            <strong>{popupType === 'error' ? 'Gagal' : 'Berhasil'}:</strong>
            <span>{popupMessage.replace('Error: ', '')}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeviceDetail;
