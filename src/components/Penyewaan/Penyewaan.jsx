/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import './Penyewaan.css';
import roverImage from '../../imgs/rover2.png';
import lokasiIcon from '../../imgs/Icon-Lokasi.png';

const DISCOUNT_RATES = { 6: 0.05, 12: 0.1, 24: 0.15, 36: 0.2 };
const DAILY_RATE = 100000;

const calculateRentalCost = (interval, sensorTotal = 0) => {
  const rentalDays = interval * 30;
  const baseCost = DAILY_RATE * rentalDays;
  const discountRate = DISCOUNT_RATES[interval] || 0;
  const discount = baseCost * discountRate;
  const finalCost = baseCost - discount + sensorTotal;

  return {
    rentalDays,
    baseCost,
    discount,
    finalCost,
    discountPercentage: discountRate * 100,
  };
};

const Penyewaan = () => {
  const [duration, setDuration] = useState(null);
  const [notification, setNotification] = useState('');
  const [showNotification, setShowNotification] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deviceStatus, setDeviceStatus] = useState({ loading: true, value: null, error: null });
  const [availableSensors, setAvailableSensors] = useState([]);
  const [checkboxes, setCheckboxes] = useState({});
  const [showLokasiForm, setShowLokasiForm] = useState(false);
  const [userAddresses, setUserAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [selectedSubdistrict, setSelectedSubdistrict] = useState('');
  const [ongkir, setOngkir] = useState(0);
  const [setupFee, setSetupFee] = useState(1000000); // contoh tetap 1jt


  const navigate = useNavigate();
  const token = localStorage.getItem('accessToken');

  const sensorTotal = useMemo(() => availableSensors.reduce((total, sensor) => (
    checkboxes[sensor.id] ? total + sensor.cost : total
  ), 0), [checkboxes, availableSensors]);

  useEffect(() => {
    if (showNotification) {
      const timer = setTimeout(() => setShowNotification(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showNotification]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const deviceRes = await fetch('http://localhost:5000/v1/devices?scope=available', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const deviceData = await deviceRes.json();
        setDeviceStatus({ loading: false, value: deviceData.data.devices.length, error: null });
      } catch {
        setDeviceStatus({ loading: false, value: null, error: 'Gagal memuat perangkat' });
      }

      try {
        const sensorRes = await fetch('http://localhost:5000/v1/sensors/available', {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        });
        const sensorData = await sensorRes.json();
        const sensors = sensorData?.data?.sensors || [];
        setAvailableSensors(sensors);
        const initial = Object.fromEntries(sensors.map(sensor => [sensor.id, false]));
        setCheckboxes(initial);
      } catch (err) {
        console.error('Gagal memuat sensor:', err);
      }
    };
    fetchData();
  }, [token]);

  useEffect(() => {
  const fetchAddresses = async () => {
    try {
      const res = await fetch("http://localhost:5000/v1/users/addresses", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setUserAddresses(data?.data?.addresses || []);
      else throw new Error(data.message || "Gagal memuat alamat");
    } catch (err) {
      alert(err.message);
    }
  };
  fetchAddresses();
}, [token]);


  const handleCheckboxChange = (id) => setCheckboxes(prev => ({ ...prev, [id]: !prev[id] }));
  const handlePilih = (dur) => setDuration(dur);
  const handleIconClick = () => setShowLokasiForm(prev => !prev);

const handleSewa = async () => {
  if (![6, 12, 24, 36].includes(duration)) {
    setNotification('Durasi sewa tidak valid.');
    setShowNotification(true);
    return;
  }

  if (!token) {
    setNotification('Token tidak tersedia. Silakan login terlebih dahulu.');
    setShowNotification(true);
    return;
  }

  if (!selectedAddressId || !selectedSubdistrict) {
    setNotification('Silakan pilih alamat pengiriman terlebih dahulu.');
    setShowNotification(true);
    return;
  }

  const selectedSensors = Object.entries(checkboxes)
    .filter(([_, checked]) => checked)
    .map(([id]) => id);

  setLoading(true);
  try {
    const response = await fetch('http://localhost:5000/v1/rentals', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        interval: duration,
        shippingAddressId: selectedAddressId,
        subdistrictName: selectedSubdistrict,
        sensors: selectedSensors,
      }),
    });

    const data = await response.json();
    setNotification(data?.message || (response.ok ? 'Berhasil menyewa perangkat!' : 'Gagal menyewa.'));
    if (response.ok) setTimeout(() => navigate(-1), 2000);
  } catch (error) {
    setNotification(error.message || 'Terjadi kesalahan saat menyewa.');
  } finally {
    setLoading(false);
    setShowNotification(true);
  }
};


  const handleAddressSelect = async (e) => {
  const id = e.target.value;
  setSelectedAddressId(id);

  const address = userAddresses.find(a => a.id === id);
  if (!address || !address.kelurahan) return;

  setSelectedSubdistrict(address.kelurahan);

  // 👉 URL‑encode kelurahan
  const url =
    "http://localhost:5000/v1/shipping-cost" +
    "?subdistrictName=" +
    encodeURIComponent(address.kelurahan);

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Gagal mengambil ongkir");

    const shippingCost = data.data.shippingInfo.shippingCost;
    setOngkir(shippingCost);
  } catch (err) {
    alert(err.message);
    setOngkir(0);
  }
};


  return (
    <div className="penyewaan-container">
      <button className="back-button" onClick={() => navigate(-1)}>⬅ Kembali</button>

      <h1>“SAATNYA LAHAN ANDA DIAWASI OLEH TEKNOLOGI MASA DEPAN!” 🚀</h1>
      <h2>“BOSAN RUGI? CAPEK KERJA MANUAL? BANGKITKAN PRODUKTIVITAS DENGAN DRONE ROVER KAMI!”</h2>
      <p>Lupakan kerja manual dan hasil yang tak optimal. Kini hadir DRONE ROVER CANGGIH!</p>

      <div className="image-container">
        <img src={roverImage} alt="Drone Rover" className="rover-image" />
      </div>

      <h3>Formulir Penyewaan</h3>

      <div className="device-status">
        <span className="device-label">📦 Jumlah Perangkat Tersedia:</span>
        <span className="device-value">
          {deviceStatus.loading ? 'Memuat...' : deviceStatus.error || deviceStatus.value}
        </span>
      </div>

      {showLokasiForm && (
        <div className="lokasi-box-container">
          <div className="lokasi-section">
            <label>Pilih Alamat</label>
            <select value={selectedAddressId} onChange={handleAddressSelect}>
              <option value="">-- Pilih Alamat --</option>
              {userAddresses.map((addr) => (
                <option key={addr.id} value={addr.id}>
                  {addr.alamat_lengkap}, {addr.kelurahan}, {addr.kecamatan}
                </option>
              ))}
            </select>
          </div>

          {ongkir > 0 && (
            <div className="ongkir-info">
              Estimasi Ongkir: <strong>Rp{ongkir.toLocaleString('id-ID')}</strong>
            </div>
          )}
        </div>
      )}

      <div className="lokasi-checkbox-row">
        <div className="checkbox-container">
          {availableSensors.length === 0 ? (
            <p><i>Memuat sensor...</i></p>
          ) : (
            availableSensors.map(sensor => (
              <label key={sensor.id}>
                <input
                  type="checkbox"
                  checked={checkboxes[sensor.id] || false}
                  onChange={() => handleCheckboxChange(sensor.id)}
                />
                {sensor.id} (Rp{sensor.cost.toLocaleString('id-ID')})
              </label>
            ))
          )}
        </div>
        <img
          src={lokasiIcon}
          alt="Lokasi"
          className={`lokasi-icon ${showLokasiForm ? 'active' : ''}`}
          onClick={handleIconClick}
        />
      </div>




      <div className="form-container">
        <div className="table-responsive">
          <table className="rental-table">
            <thead>
              <tr>
                <th>Durasi</th><th>Harga Total</th><th>Harga/Hari</th><th>Diskon (%)</th><th>Diskon (Rp)</th><th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {[6, 12, 24, 36].map((dur) => {
                const { finalCost, rentalDays, discount, discountPercentage } = calculateRentalCost(dur, sensorTotal);
                const daily = (finalCost / rentalDays).toFixed(2);
                return (
                  <tr key={dur}>
                    <td>{dur} Bulan</td>
                    <td>Rp{finalCost.toLocaleString('id-ID')}</td>
                    <td>Rp{Number(daily).toLocaleString('id-ID')}</td>
                    <td>{discountPercentage}%</td>
                    <td>Rp{discount.toLocaleString('id-ID')}</td>
                    <td>
                      <button className={`sewa-button ${duration === dur ? 'selected' : ''}`} onClick={() => handlePilih(dur)}>Pilih</button>
                    </td>
                  </tr>
                );
              })}
              {duration && (
                <>
                  <tr className="total-row">
                    <td colSpan="5"><strong>Subtotal</strong></td>
                    <td>
                      <strong>
                        Rp{calculateRentalCost(duration, sensorTotal).finalCost.toLocaleString('id-ID')}
                      </strong>
                    </td>
                  </tr>
                  <tr>
                    <td colSpan="5">Ongkir</td>
                    <td>Rp{ongkir.toLocaleString('id-ID')}</td>
                  </tr>
                  <tr>
                    <td colSpan="5">Biaya Setup</td>
                    <td>Rp{setupFee.toLocaleString('id-ID')}</td>
                  </tr>
                  <tr className="total-row">
                    <td colSpan="5"><strong>Total Keseluruhan</strong></td>
                    <td>
                      <strong>
                        Rp{(
                          calculateRentalCost(duration, sensorTotal).finalCost +
                          ongkir + setupFee
                        ).toLocaleString('id-ID')}
                      </strong>
                    </td>
                  </tr>
                </>
              )}

            </tbody>
          </table>
        </div>
        <button className={`sewa-button ${!duration || loading ? 'disabled' : ''}`} disabled={!duration || loading} onClick={handleSewa}>
          {loading ? <span className="spinner" /> : 'Sewa'}
        </button>
      </div>

      {showNotification && <div className="notification">{notification}</div>}
    </div>
  );
};

export default Penyewaan;
