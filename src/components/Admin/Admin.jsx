/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Admin.css';

const Admin = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState(null);
  const [glowingButton, setGlowingButton] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    fullname: '',
    email: '',
  });

  const navigate = useNavigate();
  const accessToken = localStorage.getItem('accessToken');

  const fetchUsers = async () => {
    try {
      const response = await fetch(`http://localhost:5000/v1/admin?limit=100`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Gagal memuat data pengguna');
      setUsers(result.data.users);
    } catch (error) {
      setNotification(`Gagal: ${error.message}`);
      setTimeout(() => setNotification(null), 3000);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    const filtered = users.filter((user) =>
      [user.id, user.username, user.email].some((field) =>
        String(field).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
    setFilteredUsers(filtered);
    setCurrentPage(1);
  }, [users, searchTerm]);

  const handleGlow = (buttonType) => {
    setGlowingButton(buttonType);
    setTimeout(() => setGlowingButton(null), 1000);
  };

  const handleAddUser = async () => {
    if (formData.password !== formData.confirmPassword) {
      setNotification("Password dan konfirmasi tidak cocok");
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/v1/admin', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
          fullname: formData.fullname,
          email: formData.email,
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Gagal menambahkan pengguna');

      setNotification(result.message);
      setShowAddModal(false);
      setFormData({ username: '', password: '', confirmPassword: '', fullname: '', email: '' });
      fetchUsers();
    } catch (error) {
      setNotification(`Error: ${error.message}`);
    }

    setTimeout(() => setNotification(null), 3000);
  };

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="container">
      <h2>Kelola Pengguna</h2>

      <div className="search-add-bar">
        <input
          type="text"
          placeholder="Cari berdasarkan ID, Username, atau Email"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button
          className={`add-btn ${glowingButton === 'add' ? 'glow' : ''}`}
          onClick={() => {
            setShowAddModal(true);
            handleGlow('add');
          }}
        >
          + Tambah Pengguna
        </button>
      </div>

      {notification && <div className="notification">{notification}</div>}

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Username</th>
              <th>Email</th>
              <th>Status Verifikasi</th>
            </tr>
          </thead>
          <tbody>
            {paginatedUsers.map((user) => (
              <tr key={user.id}>
                <td data-label="ID" className="clickable-id" onClick={() => navigate(`/admin/${user.id}`)}>{user.id}</td>
                <td data-label="Username">{user.username}</td>
                <td data-label="Email">{user.email}</td>
                <td data-label="Status Verifikasi">{user.is_verified ? 'Terverifikasi' : 'Belum Terverifikasi'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="footer">
        <span>
          Menampilkan {paginatedUsers.length} pengguna dari total {filteredUsers.length}
        </span>
        <div className="pagination">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            ←
          </button>
          <span className="page-number">Halaman {currentPage}</span>
          <button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            →
          </button>
        </div>
      </div>

      {/* === MODAL TAMBAH PENGGUNA === */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Tambah Pengguna Baru</h3>
            <input
              type="text"
              placeholder="Username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            />
            <input
              type="text"
              placeholder="Nama Lengkap"
              value={formData.fullname}
              onChange={(e) => setFormData({ ...formData, fullname: e.target.value })}
            />
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <input
              type="password"
              placeholder="Password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
            <input
              type="password"
              placeholder="Konfirmasi Password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            />
            <div className="modal-buttons">
              <button className="add-btn" onClick={handleAddUser}>Simpan</button>
              <button className="cancel-btn" onClick={() => setShowAddModal(false)}>Batal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
