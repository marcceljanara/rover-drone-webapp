import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './DetailPenyewaan.css';

const LABELS = {
  id: 'ID Penyewaan',
  user_id: 'ID Pengguna',
  start_date: 'Tanggal Mulai',
  end_date: 'Tanggal Selesai',
  rental_status: 'Status Penyewaan',
  // reserved_until: 'Batas Bayar',
  // shipping_address_id: 'Alamat Pengiriman',
  total_cost: 'Total Biaya',
  base_cost: 'Biaya Dasar',
  sensor_cost: 'Biaya Sensor',
  shipping_cost: 'Biaya Pengiriman',
  setup_cost: 'Biaya Pemasangan',
  nama_penerima: 'Nama Penerima',
  no_hp: 'No. HP',
  full_address: 'Alamat Lengkap',
};

const STATUS_MAP = {
  active: 'Aktif',
  pending: 'Menunggu',
  cancelled: 'Dibatalkan',
  finished: 'Selesai',
};

const HIDDEN_KEYS = ['is_deleted', 'created_at', 'updated_at', 'shipping_address_id', 'reserved_until'];

function formatValue(key, value) {
  if (value == null) return '-';

  if (/_date$|reserved_until/.test(key)) {
    const date = new Date(value);
    return date.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Asia/Jakarta',
    });
  }

  if (/_cost$/.test(key)) {
    return Number(value).toLocaleString('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  }

  if (key === 'rental_status') return STATUS_MAP[value] || value;

  return String(value);
}

function DetailPenyewaan() {
  const { id } = useParams();
  const navigate = useNavigate();
  const accessToken = localStorage.getItem('accessToken');

  const [rental, setRental] = useState(null);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    let interval;

    const fetchRental = async () => {
      try {
        const resp = await fetch(`hhttp://localhost:5000/v1/rentals/${id}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const json = await resp.json();
        if (!resp.ok) throw new Error(json.message || 'Gagal mengambil detail penyewaan');

        const data = json.data.rental;
        setRental(data);

        const reservedUntil = new Date(data.reserved_until).getTime();
        const tick = () => {
          const sisa = reservedUntil - Date.now();
          if (sisa <= 0) {
            setTimeLeft('Batas waktu pembayaran habis');
            clearInterval(interval);
          } else {
            const h = Math.floor((sisa % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const m = Math.floor((sisa % (1000 * 60 * 60)) / (1000 * 60));
            const s = Math.floor((sisa % (1000 * 60)) / 1000);
            setTimeLeft(`${h}h ${m}m ${s}s`);
          }
        };
        tick();
        interval = setInterval(tick, 1000);

      } catch (err) {
        setError(err.message);
      }
    };

    fetchRental();
    return () => clearInterval(interval);
  }, [id, accessToken]);

  if (error)
    return (
      <div className="rental-detail-container">
        <p className="rental-detail-error">{error}</p>
        <button onClick={() => navigate(-1)} className="rental-detail-back-btn">
          Kembali
        </button>
      </div>
    );

  if (!rental) return <div className="rental-detail-container">Memuat detail penyewaan…</div>;

  return (
    <div className="rental-detail-container">
      <h2 className="rental-detail-title">Detail Penyewaan</h2>

      <button onClick={() => navigate(-1)} className="rental-back-btn">Kembali</button>

      <div className="rental-detail-table-wrapper">
        <table className="rental-detail-table">
          <tbody>
            {Object.entries(rental)
              .filter(([k]) => !HIDDEN_KEYS.includes(k))
              .map(([key, value]) => (
                <tr key={key}>
                  <td data-label="Field"><strong>{LABELS[key] || key}</strong></td>
                  <td data-label={LABELS[key] || key}>{formatValue(key, value)}</td>
                </tr>
              ))}

            <tr>
              <td data-label="Field"><strong>Sisa Waktu Pembayaran</strong></td>
              <td
                data-label="Sisa Waktu Pembayaran"
                style={{ color: timeLeft === 'Batas waktu pembayaran habis' ? 'red' : 'black' }}
              >
                {timeLeft}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="rental-detail-buttons">
        <button onClick={() => navigate(`/penyewaan/${id}/shipment`)} className="rental-detail-action-btn">Pengiriman</button>
        <button onClick={() => navigate(`/penyewaan/${id}/returns`)} className="rental-detail-action-btn">Pengembalian</button>
        <button onClick={() => navigate(`/penyewaan/${id}/extensions`)} className="rental-detail-action-btn purple">Perpanjangan</button>
      </div>
    </div>
  );
}

export default DetailPenyewaan;
