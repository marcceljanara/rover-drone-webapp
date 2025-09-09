import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './Penyewaan.css';

const DISCOUNT_RATES = { 6: 0.05, 12: 0.1, 24: 0.15, 36: 0.2 };
const DAILY_RATE     = 100_000;          // Rp 100 000 per-hari
const DAYS_IN_MONTH  = 30;

function hitungBiaya(interval) {
  const rentalDays      = interval * DAYS_IN_MONTH;
  const baseCost        = DAILY_RATE * rentalDays;
  const discountRate    = DISCOUNT_RATES[interval] || 0;
  const discount        = baseCost * discountRate;
  const finalCost       = baseCost - discount;

  return { rentalDays, baseCost, discount, discountRate, finalCost };
}

export default function AjukanPerpanjangan() {
  const { id }      = useParams();       // rentalId
  const navigate    = useNavigate();
  const token       = localStorage.getItem('accessToken');

  const [interval, setInterval]       = useState(null);
  const [loading,  setLoading]        = useState(false);
  const [notif,    setNotif]          = useState('');
  const [showNotif,setShowNotif]      = useState(false);

  // auto-dismiss notifikasi
  useEffect(() => {
    if (showNotif) {
      const t = setTimeout(() => setShowNotif(false), 3000);
      return () => clearTimeout(t);
    }
  }, [showNotif]);

  const handleAjukan = async () => {
    if (!interval) return;
    if (!token) {
      setNotif('Silakan login terlebih dahulu.');
      setShowNotif(true);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/v1/extensions', {
        method : 'POST',
        headers: {
          Authorization : `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rentalId: id, interval }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal mengajukan perpanjangan.');

      setNotif(data.message);
      setShowNotif(true);

      // kembali ke riwayat perpanjangan setelah sukses
      setTimeout(() => navigate(-1), 1500);
    } catch (err) {
      setNotif(err.message);
      setShowNotif(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container">
      <button onClick={() => navigate(-1)} className="back-button">← Kembali</button>
      <h2>Ajukan Perpanjangan – Rental ID {id}</h2>

      <div className="table-wrapper">
        <table className="rental-table">
          <thead>
            <tr>
              <th>Durasi</th>
              <th>Base Cost</th>
              <th>Diskon (Rp)</th>
              <th>Diskon (%)</th>
              <th>Harga Akhir</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {[6, 12, 24, 36].map((m) => {
              const { baseCost, discount, discountRate, finalCost } = hitungBiaya(m);
              return (
                <tr key={m}>
                  <td>{m} bulan</td>
                  <td>Rp{baseCost.toLocaleString('id-ID')}</td>
                  <td>Rp{discount.toLocaleString('id-ID')}</td>
                  <td>{discountRate * 100}%</td>
                  <td><strong>Rp{finalCost.toLocaleString('id-ID')}</strong></td>
                  <td>
                    <button
                      className={`sewa-button ${interval === m ? 'selected' : ''}`}
                      onClick={() => setInterval(m)}
                    >
                      Pilih
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <button
        disabled={!interval || loading}
        className={`sewa-button ${!interval || loading ? 'disabled' : ''}`}
        onClick={handleAjukan}
      >
        {loading ? <span className="spinner" /> : 'Ajukan Perpanjangan'}
      </button>

      {showNotif && <div className="notification">{notif}</div>}
    </main>
  );
}
