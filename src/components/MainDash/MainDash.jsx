// MainDash.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGithubCommits } from "../../Data/Data";
import "./MainDash.css";

const MainDash = () => {
  const [devices, setDevices] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const response = await fetch("http://localhost:5000/v1/devices", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const result = await response.json();
        setDevices(result.data.devices || []);
      } catch (error) {
        console.error("Error fetching devices:", error);
      }
    };

    fetchDevices();
  }, []);

  const filteredDevices = devices.filter((device) =>
    device.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredDevices.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedDevices = filteredDevices.slice(startIndex, startIndex + itemsPerPage);

  const handleNext = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handlePrev = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  return (
    <div className="page-container">
      {/* Main Dashboard */}
      <div className="main-dash">
        <h1 className="dashboard-title">Dashboard</h1>

        <div className="search-container">
          <input
            type="text"
            placeholder="Cari ID device..."
            className="search-box"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        <div className="dashboard-layout">
          <div className="main-content">
            <div className="cards-container">
              {paginatedDevices.map((device) => (
                <div
                  key={device.id}
                  className="device-card"
                  onClick={() => navigate(`/dashboard/${device.id}`)}
                  style={{ backgroundColor: getStatusColor(device.status) }}
                >
                  <h3>{device.id}</h3>
                  <p>Status: {device.status}</p>
                </div>
              ))}
            </div>

            <div className="pagination-controls">
              <button onClick={handlePrev} disabled={currentPage === 1}>←</button>
              <span>Halaman {currentPage} dari {totalPages}</span>
              <button onClick={handleNext} disabled={currentPage === totalPages}>→</button>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Update Box */}
      <div className="updates-floating">
        <h3 className="section-title">Updates</h3>
        <Updates />
      </div>
    </div>
  );

  function getStatusColor(status) {
    switch (status) {
      case "active":
        return "#34D399";
      case "inactive":
        return "#F87171";
      default:
        return "#D1D5DB";
    }
  }
};

const Updates = () => {
  const UpdatesData = useGithubCommits();

  return (
    <div className="Updates">
      {UpdatesData.map((update, index) => (
        <div className="update" key={index}>
          <img src={update.img} alt="profile" />
          <div className="noti">
            <div style={{ marginBottom: '0.5rem' }}>
              <span>{update.name}</span>
              <span> {update.noti}</span>
            </div>
            <span>{update.time}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MainDash;
