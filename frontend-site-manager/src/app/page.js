'use client';
import { useState, useEffect } from 'react';
import PortalShell from '../components/PortalShell';
import { api } from '../utils/api';
import { uploadImageToCloudinary } from '../utils/cloudinary';

export default function SiteManagerPage() {
  const [activeTab, setActiveTab] = useState('dashboard');

  // States
  const [cars, setCars] = useState([]);
  const [myReports, setMyReports] = useState([]);
  const [assignedRequests, setAssignedRequests] = useState([]);
  const [activeCases, setActiveCases] = useState([]);
  const [loading, setLoading] = useState(true);

  // Forms
  const [reportForm, setReportForm] = useState({ car: '', issueCategory: 'Engine', description: '' });
  const [reportPhoto, setReportPhoto] = useState(null);
  const [submittingReport, setSubmittingReport] = useState(false);

  const [receiptForm, setReceiptForm] = useState({ sparePartRequest: '', description: '' });
  const [receiptPhoto, setReceiptPhoto] = useState(null);
  const [submittingReceipt, setSubmittingReceipt] = useState(false);

  const [verifyForm, setVerifyForm] = useState({ issueCase: '', description: '' });
  const [verifyPhoto, setVerifyPhoto] = useState(null);
  const [submittingVerify, setSubmittingVerify] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const carsRes = await api.get('/cars');
      if (carsRes.success) setCars(carsRes.cars || []);

      const reportsRes = await api.get('/issue-reports/my-reports');
      if (reportsRes.success) setMyReports(reportsRes.reports || []);

      const reqRes = await api.get('/spare-part-requests/assigned');
      if (reqRes.success) setAssignedRequests(reqRes.requests || []);

      const casesRes = await api.get('/issue-cases/active');
      if (casesRes.success) setActiveCases(casesRes.issueCases || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Submit issue report
  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!reportPhoto) {
      alert('Photo evidence is required.');
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
        car: reportForm.car,
        issueCategory: reportForm.issueCategory,
        description: reportForm.description,
        photo: photoUrl
      };

      const res = await api.post('/issue-reports', payload);
      if (res.success) {
        alert('Independent issue report submitted successfully to Admin.');
        setReportForm({ car: '', issueCategory: 'Engine', description: '' });
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

  // Confirm receipt of spare part from Accountant
  const handleReceiptSubmit = async (e) => {
    e.preventDefault();
    if (!receiptPhoto) {
      alert('Photo of physical part is required.');
      return;
    }
    setSubmittingReceipt(true);

    try {
      const photoUrl = await uploadImageToCloudinary(receiptPhoto);
      if (!photoUrl) {
        alert('Failed to upload photo to Cloudinary.');
        setSubmittingReceipt(false);
        return;
      }

      const payload = {
        sparePartRequest: receiptForm.sparePartRequest,
        description: receiptForm.description || 'I have received this spare part from the Accountant.',
        photo: photoUrl
      };

      const res = await api.post('/received-verifications', payload);
      if (res.success) {
        alert('Spare part receipt confirmed. Accountant transaction will now be validated by Admin.');
        setReceiptForm({ sparePartRequest: '', description: '' });
        setReceiptPhoto(null);
        setActiveTab('dashboard');
        fetchInitialData();
      } else {
        alert(res.message || 'Verification failed');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingReceipt(false);
    }
  };

  // Submit final repair verification
  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    if (!verifyPhoto) {
      alert('Photo of repaired machine is required.');
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
        issueCase: verifyForm.issueCase,
        description: verifyForm.description,
        photo: photoUrl
      };

      const res = await api.post('/final-verifications', payload);
      if (res.success) {
        alert('Repair verification submitted. Case will close once Driver also verifies.');
        setVerifyForm({ issueCase: '', description: '' });
        setVerifyPhoto(null);
        setActiveTab('dashboard');
        fetchInitialData();
      } else {
        alert(res.message || 'Verification failed');
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
      label: 'Dashboard',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <rect x="3" y="3" width="7" height="9" rx="1"></rect>
          <rect x="14" y="3" width="7" height="5" rx="1"></rect>
          <rect x="14" y="12" width="7" height="9" rx="1"></rect>
          <rect x="3" y="16" width="7" height="5" rx="1"></rect>
        </svg>
      )
    },
    {
      id: 'reports',
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
      id: 'receipt',
      label: 'Spare Part Receipt',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
        </svg>
      )
    },
    {
      id: 'verify',
      label: 'Verify Repair',
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
    <PortalShell role="SiteManager" activeTab={activeTab} setActiveTab={setActiveTab} tabs={tabs}>
      {loading ? (
        <div className="flex-center" style={{ height: '300px' }}><span className="spinner"></span></div>
      ) : (
        <div className="tab-viewport">

          {/* DASHBOARD TAB */}
          {activeTab === 'dashboard' && (
            <div className="dashboard-grid animate-fade-in">
              
              {/* Urgent Handover Card */}
              <div className="glass-card stat-section">
                <div className="section-header">
                  <h3>Awaiting Part Handover ({assignedRequests.length})</h3>
                  <p>Spare parts purchased by Accountant that require physical receipt verification from you.</p>
                </div>
                <div className="requests-quick-list">
                  {assignedRequests.length === 0 ? (
                    <div className="empty-quick text-muted">No spare parts waiting to be received.</div>
                  ) : (
                    assignedRequests.map(r => (
                      <div key={r._id} className="quick-list-item glass-card">
                        <div className="item-details">
                          <h4>{r.sparePartName}</h4>
                          <span>S/N: <code>{r.serialNumber}</code> • Machine: {r.car?.name}</span>
                        </div>
                        <button className="btn btn-accent btn-sm" onClick={() => {
                          setReceiptForm({ sparePartRequest: r._id, description: '' });
                          setActiveTab('receipt');
                        }}>
                          Confirm Receipt
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* My Independent Reports */}
              <div className="glass-card stat-section">
                <div className="section-header">
                  <h3>My Site Observation Reports</h3>
                </div>
                <div className="reports-timeline">
                  {myReports.length === 0 ? (
                    <p className="text-muted">You haven't submitted any reports yet.</p>
                  ) : (
                    myReports.map((r) => (
                      <div key={r._id} className="timeline-report-item glass-card">
                        <div className="report-img" style={{ backgroundImage: `url(${getImageUrl(r.photo)})` }}></div>
                        <div className="report-desc">
                          <div className="report-meta">
                            <span className="report-date">{new Date(r.date).toLocaleDateString()}</span>
                            <span className={`status-tag ${r.status.toLowerCase()}`}>{r.status}</span>
                          </div>
                          <h4>{r.car?.name}</h4>
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
          {activeTab === 'reports' && (
            <div className="form-container animate-fade-in">
              <div className="glass-card form-box">
                <div className="form-header">
                  <h3>Log Site Observation</h3>
                  <p>Provide details of anomalies detected on-site. Photo evidence is strictly required for cross-validation.</p>
                </div>

                <form onSubmit={handleReportSubmit}>
                  <div className="form-group">
                    <label className="form-label">Select Machinery</label>
                    <select 
                      className="form-input" 
                      required 
                      value={reportForm.car}
                      onChange={(e) => setReportForm({ ...reportForm, car: e.target.value })}
                    >
                      <option value="">-- Choose machinery --</option>
                      {cars.map(c => (
                        <option key={c._id} value={c._id}>{c.name} ({c.plateNumber})</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Issue Category</label>
                    <select 
                      className="form-input"
                      required
                      value={reportForm.issueCategory}
                      onChange={(e) => setReportForm({ ...reportForm, issueCategory: e.target.value })}
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
                    <label className="form-label">Observation Details</label>
                    <textarea 
                      className="form-input" 
                      rows="4" 
                      required
                      placeholder="Detail the failure point, component wearing, or damage observed..."
                      value={reportForm.description}
                      onChange={(e) => setReportForm({ ...reportForm, description: e.target.value })}
                    ></textarea>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Evidence Photo (Required)</label>
                    <input 
                      type="file" 
                      className="form-input" 
                      accept="image/*" 
                      required
                      onChange={(e) => setReportPhoto(e.target.files[0])}
                    />
                  </div>

                  <button type="submit" className="btn btn-primary w-full" disabled={submittingReport}>
                    {submittingReport ? 'Submitting...' : 'Dispatch Report'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* SPARE PART RECEIPT VERIFICATION TAB */}
          {activeTab === 'receipt' && (
            <div className="form-container animate-fade-in">
              <div className="glass-card form-box">
                <div className="form-header">
                  <h3>Verify Spare Part Receipt</h3>
                  <p>Log receipt of physical components handed over by the accountant. Take a clear photo of the received part showing serial numbers.</p>
                </div>

                <form onSubmit={handleReceiptSubmit}>
                  <div className="form-group">
                    <label className="form-label">Select Spare Part Transaction</label>
                    <select 
                      className="form-input" 
                      required 
                      value={receiptForm.sparePartRequest}
                      onChange={(e) => setReceiptForm({ ...receiptForm, sparePartRequest: e.target.value })}
                    >
                      <option value="">-- Choose spare part --</option>
                      {assignedRequests.map(r => (
                        <option key={r._id} value={r._id}>
                          {r.sparePartName} (S/N: {r.serialNumber}) for {r.car?.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Verification Description (Optional)</label>
                    <textarea 
                      className="form-input" 
                      rows="4" 
                      placeholder="Provide additional details (e.g. part packaging intact, serial numbers checked)..."
                      value={receiptForm.description}
                      onChange={(e) => setReceiptForm({ ...receiptForm, description: e.target.value })}
                    ></textarea>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Photo of Physical Spare Part (Required)</label>
                    <input 
                      type="file" 
                      className="form-input" 
                      accept="image/*" 
                      required
                      onChange={(e) => setReceiptPhoto(e.target.files[0])}
                    />
                  </div>

                  <button type="submit" className="btn btn-primary w-full" disabled={submittingReceipt || assignedRequests.length === 0}>
                    {submittingReceipt ? 'Verifying...' : 'Confirm Receipt & Handover'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* FINAL REPAIR VERIFICATION TAB */}
          {activeTab === 'verify' && (
            <div className="form-container animate-fade-in">
              <div className="glass-card form-box">
                <div className="form-header">
                  <h3>Confirm Repair & Handback</h3>
                  <p>Submit final verification that the machine is operational and back on track. This requires verification photos.</p>
                </div>

                <form onSubmit={handleVerifySubmit}>
                  <div className="form-group">
                    <label className="form-label">Select Active Repair Case</label>
                    <select 
                      className="form-input" 
                      required 
                      value={verifyForm.issueCase}
                      onChange={(e) => setVerifyForm({ ...verifyForm, issueCase: e.target.value })}
                    >
                      <option value="">-- Choose active case --</option>
                      {activeCases.map(c => (
                        <option key={c._id} value={c._id}>
                          Case on {c.car?.name} ({c.car?.plateNumber})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Verification Notes</label>
                    <textarea 
                      className="form-input" 
                      rows="4" 
                      required
                      placeholder="e.g. Hydraulic arm tested with new seals. Replaced part fits properly. Ready for work."
                      value={verifyForm.description}
                      onChange={(e) => setVerifyForm({ ...verifyForm, description: e.target.value })}
                    ></textarea>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Photo of Completed Repair / Active Machine (Required)</label>
                    <input 
                      type="file" 
                      className="form-input" 
                      accept="image/*" 
                      required
                      onChange={(e) => setVerifyPhoto(e.target.files[0])}
                    />
                  </div>

                  <button type="submit" className="btn btn-primary w-full" disabled={submittingVerify || activeCases.length === 0}>
                    {submittingVerify ? 'Verifying...' : 'Confirm Active Status'}
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

        .stat-section {
          padding: 24px;
          display: flex;
          flex-direction: column;
        }

        .section-header {
          margin-bottom: 20px;
        }

        .requests-quick-list {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .quick-list-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 15px 20px;
        }

        .quick-list-item h4 {
          font-size: 1rem;
          font-weight: 600;
          margin-bottom: 4px;
        }

        .quick-list-item span {
          font-size: 0.8rem;
          color: hsl(var(--muted-foreground));
        }

        .empty-quick {
          text-align: center;
          padding: 30px 0;
          font-size: 0.9rem;
        }

        .reports-timeline {
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 15px;
          max-height: 400px;
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
          margin-top: 20px;
          margin-bottom: 40px;
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
          .stat-section, .form-box { padding: 20px; }
          .quick-list-item { align-items: stretch; flex-direction: column; gap: 12px; padding: 16px; }
          .quick-list-item .btn { width: 100%; }
          .timeline-report-item { align-items: flex-start; padding: 12px; }
          .report-meta { align-items: flex-start; flex-direction: column; }
          .form-container { padding: 0; }
        }
      `}</style>
    </PortalShell>
  );
}
