'use client';
import { useState, useEffect } from 'react';
import PortalShell from '../components/PortalShell';
import { api } from '../utils/api';
import { uploadImageToCloudinary } from '../utils/cloudinary';

export default function DriverPage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // States
  const [user, setUser] = useState(null);
  const [assignedCar, setAssignedCar] = useState(null);
  const [myReports, setMyReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingVerifications, setPendingVerifications] = useState([]);

  // Report Forms
  const [issueCategory, setIssueCategory] = useState('Engine');
  const [reportDescription, setReportDescription] = useState('');
  const [reportPhoto, setReportPhoto] = useState(null);
  const [submittingReport, setSubmittingReport] = useState(false);

  // Verification Forms
  const [selectedCaseForVerify, setSelectedCaseForVerify] = useState('');
  const [verifyDescription, setVerifyDescription] = useState('');
  const [verifyPhoto, setVerifyPhoto] = useState(null);
  const [submittingVerify, setSubmittingVerify] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const meRes = await api.get('/users/me');
      if (meRes.success) {
        setUser(meRes.user);
        if (meRes.user.assignedCar) {
          setAssignedCar(meRes.user.assignedCar);
        }
      }

      const repRes = await api.get('/issue-reports/my-reports');
      if (repRes.success) {
        setMyReports(repRes.reports || []);
      }

      const verRes = await api.get('/final-verifications/pending');
      if (verRes.success) {
        setPendingVerifications(verRes.cases || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Submit new issue report
  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!reportPhoto) {
      alert('Photo is required for issue reports.');
      return;
    }
    setSubmittingReport(true);

    try {
      const photoUrl = await uploadImageToCloudinary(reportPhoto);
      if (!photoUrl) {
        alert('Failed to upload photo to Cloudinary.');
        setSubmittingReport(false);
        return;
      }

      const payload = {
        car: assignedCar ? assignedCar._id : undefined,
        issueCategory,
        description: reportDescription,
        photo: photoUrl
      };

      const res = await api.post('/issue-reports', payload);
      if (res.success) {
        alert('Issue report submitted successfully directly to Admin!');
        setReportDescription('');
        setIssueCategory('Engine');
        setReportPhoto(null);
        setActiveTab('dashboard');
        fetchInitialData();
      } else {
        alert(res.message || 'Submission failed');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingReport(false);
    }
  };

  // Submit final verification
  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    if (!selectedCaseForVerify) {
      alert('Please select the repair case.');
      return;
    }
    if (!verifyPhoto) {
      alert('Photo is required for verification.');
      return;
    }
    setSubmittingVerify(true);

    try {
      const photoUrl = await uploadImageToCloudinary(verifyPhoto);
      if (!photoUrl) {
        alert('Failed to upload photo to Cloudinary.');
        setSubmittingVerify(false);
        return;
      }

      const payload = {
        issueCase: selectedCaseForVerify,
        description: verifyDescription,
        photo: photoUrl
      };

      const res = await api.post('/final-verifications', payload);
      if (res.success) {
        alert('Final verification submitted to Admin. Thank you!');
        setVerifyDescription('');
        setVerifyPhoto(null);
        setSelectedCaseForVerify('');
        setActiveTab('dashboard');
        fetchInitialData();
      } else {
        alert(res.message || 'Submission failed');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingVerify(false);
    }
  };

  const tabs = [
    {
      id: 'dashboard',
      label: 'My Machinery',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>
          <circle cx="7" cy="17" r="2"/>
          <path d="M9 17h6"/>
          <circle cx="17" cy="17" r="2"/>
        </svg>
      )
    },
    {
      id: 'report-new',
      label: 'Report Issue',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      )
    },
    {
      id: 'verify',
      label: 'Confirm Repair',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
      )
    }
  ];

  const getImageUrl = (url) => {
    if (!url) return '';
    return url.startsWith('http') ? url : `http://localhost:5000${url}`;
  };

  return (
    <PortalShell role="Driver" activeTab={activeTab} setActiveTab={setActiveTab} tabs={tabs}>
      {loading ? (
        <div className="flex-center" style={{ height: '300px' }}><span className="spinner"></span></div>
      ) : (
        <div className="tab-viewport">
          
          {/* DASHBOARD TAB */}
          {activeTab === 'dashboard' && (
            <div className="dashboard-grid animate-fade-in">
              
              {/* Assigned Machinery Status */}
              <div className="glass-card car-status-card">
                {assignedCar ? (
                  <>
                    <div className="car-hero-img" style={{ backgroundImage: assignedCar.photo ? `url(${getImageUrl(assignedCar.photo)})` : 'linear-gradient(135deg, #1e293b, #0f172a)' }}>
                      <span className={`status-badge ${assignedCar.status.replace(/\s+/g, '').toLowerCase()}`}>{assignedCar.status}</span>
                    </div>
                    <div className="car-details">
                      <h3>{assignedCar.name}</h3>
                      <div className="car-specs">
                        <div><strong>Plate Number:</strong> <code>{assignedCar.plateNumber}</code></div>
                        <div><strong>Asset Category:</strong> {assignedCar.type}</div>
                        <div><strong>Brand:</strong> {assignedCar.brand || 'N/A'}</div>
                        <div><strong>Model:</strong> {assignedCar.model || 'N/A'}</div>
                        <div><strong>Manufacturing Year:</strong> {assignedCar.manufacturingYear || 'N/A'}</div>
                        <div><strong>Engine Number:</strong> {assignedCar.engineNumber || 'N/A'}</div>
                        <div><strong>Chassis Number:</strong> {assignedCar.chassisNumber || 'N/A'}</div>
                        <div><strong>Current Mileage:</strong> {assignedCar.currentMileage || 'N/A'}</div>
                        <div><strong>Project Site:</strong> {assignedCar.assignedSite || 'N/A'}</div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="unassigned-state">
                    <h3>⚠️ No Machinery Assigned</h3>
                    <p>Contact the system administrator to link a machinery asset to your account.</p>
                  </div>
                )}
              </div>
 
              {/* My Recent Reports */}
              <div className="glass-card reports-section">
                <div className="section-header">
                  <h3>My Issue Reports</h3>
                </div>
                <div className="reports-timeline">
                  {myReports.length === 0 ? (
                    <p className="text-muted">You haven't reported any issues yet.</p>
                  ) : (
                    myReports.map((r) => (
                      <div key={r._id} className="timeline-report-item glass-card">
                        <div className="report-img" style={{ backgroundImage: `url(${getImageUrl(r.photo)})` }}></div>
                        <div className="report-desc">
                          <div className="report-meta">
                            <span className="report-date">{new Date(r.date).toLocaleDateString()}</span>
                            <span className={`status-tag ${r.status.toLowerCase()}`}>{r.status}</span>
                          </div>
                          <p><strong>Category:</strong> {r.issueCategory}</p>
                          <p>{r.description || 'No description provided.'}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          )}

          {/* REPORT NEW ISSUE TAB */}
          {activeTab === 'report-new' && (
            <div className="form-container animate-fade-in">
              <div className="glass-card form-box">
                <div className="form-header">
                  <h3>Report Machinery Anomaly</h3>
                  <p>All issue reports require clear category assignment and photo evidence to match with site observations.</p>
                </div>
                
                <form onSubmit={handleReportSubmit}>
                  {assignedCar && (
                    <div className="form-group">
                      <label className="form-label">Asset Under Report</label>
                      <input type="text" className="form-input" disabled value={`${assignedCar.name} (${assignedCar.plateNumber})`} />
                    </div>
                  )}

                  <div className="form-group">
                    <label className="form-label">Issue Category</label>
                    <select 
                      className="form-input"
                      required
                      value={issueCategory}
                      onChange={(e) => setIssueCategory(e.target.value)}
                    >
                      <option value="Engine">Engine</option>
                      <option value="Transmission">Transmission</option>
                      <option value="Hydraulic System">Hydraulic System</option>
                      <option value="Electrical System">Electrical System</option>
                      <option value="Brakes">Brakes</option>
                      <option value="Steering">Steering</option>
                      <option value="Tires/Tracks">Tires/Tracks</option>
                      <option value="Body/Frame">Body/Frame</option>
                      <option value="Cooling System">Cooling System</option>
                      <option value="Fuel System">Fuel System</option>
                      <option value="Exhaust System">Exhaust System</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Issue Description (Optional)</label>
                    <textarea 
                      className="form-input" 
                      rows="4" 
                      placeholder="Describe what is broken, e.g. hydraulic fluid leaking, grinding sound from gearbox..."
                      value={reportDescription}
                      onChange={(e) => setReportDescription(e.target.value)}
                    ></textarea>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Photo Evidence (Required)</label>
                    <input 
                      type="file" 
                      className="form-input" 
                      accept="image/*" 
                      required
                      onChange={(e) => setReportPhoto(e.target.files[0])}
                    />
                  </div>

                  <button type="submit" className="btn btn-primary w-full" disabled={submittingReport || !assignedCar}>
                    {submittingReport ? 'Submitting...' : 'Send Issue Report'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* CONFIRM REPAIR TAB */}
          {activeTab === 'verify' && (
            <div className="form-container animate-fade-in">
              <div className="glass-card form-box">
                <div className="form-header">
                  <h3>Confirm Maintenance/Repair Complete</h3>
                  <p>Provide evidence that the spare part replacement was successful and the machinery is operational.</p>
                </div>

                <form onSubmit={handleVerifySubmit}>
                  <div className="form-group">
                    <label className="form-label">Select Active Repair Case</label>
                    <select 
                      className="form-input" 
                      required 
                      value={selectedCaseForVerify}
                      onChange={(e) => setSelectedCaseForVerify(e.target.value)}
                    >
                      <option value="">-- Choose repair case --</option>
                      {pendingVerifications.map(c => (
                        <option key={c._id} value={c._id}>
                          Case on {c.car?.name} (Created {new Date(c.createdAt).toLocaleDateString()})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Verification Description (Optional)</label>
                    <textarea 
                      className="form-input" 
                      rows="4" 
                      placeholder="Explain current status, e.g., Spare part installed, tested and fully operational..."
                      value={verifyDescription}
                      onChange={(e) => setVerifyDescription(e.target.value)}
                    ></textarea>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Evidence Photo of Repaired Area (Required)</label>
                    <input 
                      type="file" 
                      className="form-input" 
                      accept="image/*" 
                      required
                      onChange={(e) => setVerifyPhoto(e.target.files[0])}
                    />
                  </div>

                  <button type="submit" className="btn btn-primary w-full" disabled={submittingVerify}>
                    {submittingVerify ? 'Submitting...' : 'Submit Verification'}
                  </button>
                </form>
              </div>
            </div>
          )}

        </div>
      )}

      {/* Styled JSX */}
      <style jsx>{`
        .tab-viewport {
          width: 100%;
        }

        .dashboard-grid {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 30px;
        }

        .car-status-card {
          overflow: hidden;
          display: flex;
          flex-direction: column;
          height: fit-content;
        }

        .car-hero-img {
          height: 250px;
          background-size: cover;
          background-position: center;
          position: relative;
        }

        .status-badge {
          position: absolute;
          top: 12px;
          right: 12px;
          font-size: 0.75rem;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 20px;
          text-transform: uppercase;
          background: rgba(0, 0, 0, 0.65);
          border: 1px solid rgba(255, 255, 255, 0.15);
        }

        .status-badge.active { color: #10b981; }
        .status-badge.undermaintenance { color: #f59e0b; }
        .status-badge.waitingforsparepart { color: #e11d48; }
        .status-badge.outofservice { color: #64748b; }

        .car-details {
          padding: 24px;
        }

        .car-details h3 {
          font-size: 1.3rem;
          font-weight: 600;
          margin-bottom: 15px;
        }

        .car-specs {
          display: flex;
          flex-direction: column;
          gap: 8px;
          font-size: 0.95rem;
        }

        .unassigned-state {
          padding: 40px;
          text-align: center;
        }

        .unassigned-state h3 {
          margin-bottom: 10px;
        }

        .reports-section {
          padding: 24px;
          display: flex;
          flex-direction: column;
          max-height: 600px;
        }

        .section-header {
          margin-bottom: 20px;
        }

        .reports-timeline {
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .timeline-report-item {
          display: flex;
          gap: 15px;
          padding: 15px;
        }

        .report-img {
          width: 80px;
          height: 80px;
          border-radius: 6px;
          background-size: cover;
          background-position: center;
          flex-shrink: 0;
        }

        .report-desc {
          display: flex;
          flex-direction: column;
          gap: 6px;
          flex-grow: 1;
        }

        .report-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .report-date {
          font-size: 0.8rem;
          color: hsl(var(--muted-foreground));
        }

        .status-tag {
          font-size: 0.7rem;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 12px;
          text-transform: uppercase;
        }

        .status-tag.reported { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
        .status-tag.matched { background: rgba(16, 185, 129, 0.1); color: #10b981; }
        .status-tag.unconfirmed { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }

        .form-container {
          display: flex;
          justify-content: center;
          padding: 20px 0;
        }

        .form-box {
          width: 100%;
          max-width: 500px;
          padding: 30px;
        }

        .form-header {
          margin-bottom: 24px;
        }

        .form-header h3 {
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: 6px;
        }

        .form-header p {
          font-size: 0.85rem;
          color: hsl(var(--muted-foreground));
        }

        .w-full {
          width: 100%;
        }

        textarea.form-input {
          resize: none;
        }

        @media (max-width: 768px) {
          .dashboard-grid { grid-template-columns: 1fr; gap: 16px; }
          .car-details, .reports-section, .form-box { padding: 20px; }
          .car-hero-img { height: 190px; }
          .timeline-report-item { align-items: flex-start; padding: 12px; }
          .report-meta { align-items: flex-start; flex-direction: column; }
          .form-container { padding: 0; }
        }
      `}</style>
    </PortalShell>
  );
}
