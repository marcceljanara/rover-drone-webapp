import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './ReportDetail.css';
import { formatIntervalIndonesian, formatTanggalDanWaktuIndonesia} from '../../utils/datetimeIndonesia';

const ReportDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReportDetail = async () => {
      const accessToken = localStorage.getItem('accessToken');
      try {
        const response = await fetch(`http://localhost:5000/v1/reports/${id}`, {
          method: 'GET',
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || 'Gagal memuat detail laporan');
        }

        setReport(result.data.report);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchReportDetail();
  }, [id]);

  const handleDownload = () => {
    const accessToken = localStorage.getItem('accessToken');
    const downloadUrl = `http://localhost:5000/v1/reports/${id}/download`;

    fetch(downloadUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((res) => res.blob())
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Laporan_${id}.pdf`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      })
      .catch(() => alert('Gagal mengunduh laporan'));
  };

  const handleBack = () => {
    navigate('/reports');
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="report-detail">
      <div className="button-group">
        <button className="back-btn" onClick={handleBack}>⬅ Kembali</button>
        <button className="download-btn" onClick={handleDownload}>📄 Unduh Laporan PDF</button>
      </div>

      <h2>Detail Laporan Keuangan</h2>
      <p><strong>ID Laporan:</strong> {report.id}</p>
      <p><strong>Interval Laporan:</strong> {formatIntervalIndonesian(report.report_interval)}</p>
      <p><strong>Total Transaksi:</strong> {report.total_transactions}</p>
      <p><strong>Total Jumlah:</strong> {Number(report.total_amount).toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}</p>
      <p><strong>Tanggal Laporan:</strong> {formatTanggalDanWaktuIndonesia(report.report_date)}</p>
      
      <h3>Payments</h3>
      <table>
        <thead>
          <tr>
            <th>ID Pembayaran</th>
            <th>Rental ID</th>
            <th>Jumlah Pembayaran</th>
            <th>Tanggal Pembayaran</th>
            <th>Status Pembayaran</th>
            <th>Metode Pembayaran</th>
          </tr>
        </thead>
        <tbody>
          {report.payments.map((payment) => (
            <tr key={payment.id}>
              <td data-label="ID Pembayaran">{payment.id}</td>
              <td data-label="Rental ID">{payment.rental_id}</td>
              <td data-label="Jumlah Pembayaran">
                {Number(payment.amount).toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}
              </td>
              <td data-label="Tanggal Pembayaran">
                {formatTanggalDanWaktuIndonesia(payment.payment_date)}
              </td>
              <td data-label="Status Pembayaran">{payment.payment_status}</td>
              <td data-label="Metode Pembayaran">{payment.payment_method}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ReportDetail;
