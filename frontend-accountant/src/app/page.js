'use client';
import { useState, useEffect } from 'react';
import PortalShell from '../components/PortalShell';
import { api } from '../utils/api';
import { uploadImageToCloudinary } from '../utils/cloudinary';

export default function AccountantPage() {
  const [activeTab, setActiveTab] = useState('dashboard');

  // States
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [myPurchases, setMyPurchases] = useState([]);
  const [loading, setLoading] = useState(true);

  // Forms
  const [purchaseForm, setPurchaseForm] = useState({ 
    sparePartRequest: '', 
    description: '', 
    supplier: '', 
    quantity: 1,
    unitPrice: '',
    invoiceNumber: '' 
  });
  const [purchasePhoto, setPurchasePhoto] = useState(null);
  const [receiptPhoto, setReceiptPhoto] = useState(null);
  const [submittingPurchase, setSubmittingPurchase] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const reqRes = await api.get('/spare-part-requests/assigned');
      if (reqRes.success) setIncomingRequests(reqRes.requests || []);

      const purRes = await api.get('/purchase-records/my-records');
      if (purRes.success) setMyPurchases(purRes.records || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Submit purchase record
  const handlePurchaseSubmit = async (e) => {
    e.preventDefault();
    if (!purchasePhoto) {
      alert('Purchase photo (invoice scan) is required.');
      return;
    }
    if (!receiptPhoto) {
      alert('Receipt photo is required.');
      return;
    }
    setSubmittingPurchase(true);

    try {
      const [uploadedPurchaseUrl, uploadedReceiptUrl] = await Promise.all([
        uploadImageToCloudinary(purchasePhoto),
        uploadImageToCloudinary(receiptPhoto)
      ]);

      if (!uploadedPurchaseUrl || !uploadedReceiptUrl) {
        alert('Failed to upload photos to Cloudinary.');
        setSubmittingPurchase(false);
        return;
      }

      const payload = {
        sparePartRequest: purchaseForm.sparePartRequest,
        description: purchaseForm.description,
        supplier: purchaseForm.supplier,
        quantity: purchaseForm.quantity,
        unitPrice: purchaseForm.unitPrice,
        totalPrice: (parseFloat(purchaseForm.unitPrice) || 0) * (parseInt(purchaseForm.quantity) || 1),
        invoiceNumber: purchaseForm.invoiceNumber,
        purchasePhoto: uploadedPurchaseUrl,
        receiptPhoto: uploadedReceiptUrl
      };

      const res = await api.post('/purchase-records', payload);
      if (res.success) {
        alert('Purchase logged successfully. The part is now ready for physical handover to the Site Manager.');
        setPurchaseForm({ 
          sparePartRequest: '', 
          description: '', 
          supplier: '', 
          quantity: 1,
          unitPrice: '',
          invoiceNumber: '' 
        });
        setPurchasePhoto(null);
        setReceiptPhoto(null);
        setActiveTab('dashboard');
        fetchInitialData();
      } else {
        alert(res.message || 'Submission failed');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingPurchase(false);
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
      id: 'requests',
      label: 'Pending Requests',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <polyline points="10 9 9 9 8 9"/>
        </svg>
      )
    },
    {
      id: 'purchase-log',
      label: 'Log Purchase',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
      )
    },
    {
      id: 'purchases',
      label: 'Purchase History',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
      )
    }
  ];

  const getImageUrl = (url) => {
    if (!url) return '';
    return url.startsWith('http') ? url : `http://localhost:5000${url}`;
  };

  return (
    <PortalShell role="Accountant" activeTab={activeTab} setActiveTab={setActiveTab} tabs={tabs}>
      {loading ? (
        <div className="flex-center" style={{ height: '300px' }}><span className="spinner"></span></div>
      ) : (
        <div className="tab-viewport">

          {/* DASHBOARD TAB */}
          {activeTab === 'dashboard' && (
            <div className="dashboard-grid animate-fade-in">
              
              {/* Stats Cards */}
              <div className="stats-cards">
                <div className="glass-card stat-card">
                  <div className="stat-info">
                    <span className="stat-label">Pending Orders</span>
                    <h3 className="stat-value">{incomingRequests.length}</h3>
                  </div>
                  <div className="stat-sub">
                    <span className="warning">Awaiting Purchase Action</span>
                  </div>
                </div>
                <div className="glass-card stat-card">
                  <div className="stat-info">
                    <span className="stat-label">My Total Purchases</span>
                    <h3 className="stat-value">{myPurchases.length}</h3>
                  </div>
                  <div className="stat-sub">
                    <span>Logs sent directly to Admin</span>
                  </div>
                </div>
                <div className="glass-card stat-card">
                  <div className="stat-info">
                    <span className="stat-label">Total Expenditure</span>
                    <h3 className="stat-value">
                      ${myPurchases.reduce((sum, p) => sum + (p.totalPrice || p.price || 0), 0).toLocaleString()}
                    </h3>
                  </div>
                  <div className="stat-sub">
                    <span>Across all purchases</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions / Incoming requests */}
              <div className="glass-card stat-section">
                <div className="section-header">
                  <h3>Incoming Spare Part Requests ({incomingRequests.length})</h3>
                </div>
                <div className="requests-quick-list">
                  {incomingRequests.length === 0 ? (
                    <div className="empty-quick text-muted">No pending spare part requests.</div>
                  ) : (
                    incomingRequests.map(r => (
                      <div key={r._id} className="quick-list-item glass-card">
                        <div className="item-details">
                          <h4>{r.sparePartName}</h4>
                          <span>S/N: <code>{r.serialNumber}</code> • Machinery: {r.car?.name}</span>
                          <span>Qty: {r.quantity || 1} • Priority: <strong>{r.priority || 'Medium'}</strong></span>
                        </div>
                        <button className="btn btn-primary btn-sm" onClick={() => {
                          setPurchaseForm({ 
                            sparePartRequest: r._id, 
                            description: '', 
                            supplier: '',
                            quantity: r.quantity || 1,
                            unitPrice: '',
                            invoiceNumber: '' 
                          });
                          setActiveTab('purchase-log');
                        }}>
                          Buy Part
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* My Purchases Table */}
              <div className="glass-card table-section" style={{ gridColumn: '1 / -1', marginTop: '20px' }}>
                <div className="table-header">
                  <h3>Recent Purchases</h3>
                </div>
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Spare Part</th>
                        <th>Machinery</th>
                        <th>Vendor</th>
                        <th>Invoice No</th>
                        <th>Qty</th>
                        <th>Unit Price</th>
                        <th>Total</th>
                        <th>Evidence</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myPurchases.length === 0 ? (
                        <tr><td colSpan="9" className="text-center">No purchases recorded by you yet.</td></tr>
                      ) : (
                        myPurchases.slice(0, 5).map((p) => (
                          <tr key={p._id}>
                            <td>{new Date(p.purchaseDate).toLocaleDateString()}</td>
                            <td><strong>{p.sparePartName || p.sparePartRequest?.sparePartName || 'N/A'}</strong></td>
                            <td>{p.sparePartRequest?.car?.name || 'N/A'}</td>
                            <td>{p.supplier || p.supplierName}</td>
                            <td><code>{p.invoiceNumber}</code></td>
                            <td>{p.quantity || 1}</td>
                            <td>${(p.unitPrice || 0).toLocaleString()}</td>
                            <td><strong>${(p.totalPrice || p.price || 0).toLocaleString()}</strong></td>
                            <td className="evidence-links">
                              <a href={getImageUrl(p.purchasePhoto || p.photo)} target="_blank" rel="noreferrer" className="btn-text">
                                Invoice
                              </a>
                              {p.receiptPhoto && (
                                <>
                                  {' • '}
                                  <a href={getImageUrl(p.receiptPhoto)} target="_blank" rel="noreferrer" className="btn-text">
                                    Receipt
                                  </a>
                                </>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* PENDING REQUESTS TAB */}
          {activeTab === 'requests' && (
            <div className="requests-view animate-fade-in">
              <div className="glass-card table-section">
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Date Requested</th>
                        <th>Request No</th>
                        <th>Machinery</th>
                        <th>Part Needed</th>
                        <th>Serial Ref</th>
                        <th>Qty</th>
                        <th>Priority</th>
                        <th>Site Manager</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {incomingRequests.length === 0 ? (
                        <tr><td colSpan="9" className="text-center">No pending spare part requests.</td></tr>
                      ) : (
                        incomingRequests.map((r) => (
                          <tr key={r._id}>
                            <td>{new Date(r.createdAt).toLocaleDateString()}</td>
                            <td><code>{r.requestNumber || r._id.slice(-6)}</code></td>
                            <td><strong>{r.car?.name}</strong></td>
                            <td>{r.sparePartName}</td>
                            <td><code>{r.serialNumber}</code></td>
                            <td>{r.quantity || 1}</td>
                            <td>
                              <span className={`priority-tag ${(r.priority || 'medium').toLowerCase()}`}>
                                {r.priority || 'Medium'}
                              </span>
                            </td>
                            <td>{r.assignedSiteManager?.fullName || r.assignedSiteManager?.username}</td>
                            <td>
                              <button className="btn btn-primary btn-sm" onClick={() => {
                                setPurchaseForm({ 
                                  sparePartRequest: r._id, 
                                  description: '', 
                                  supplier: '',
                                  quantity: r.quantity || 1,
                                  unitPrice: '',
                                  invoiceNumber: '' 
                                });
                                setActiveTab('purchase-log');
                              }}>
                                Log Purchase
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* LOG PURCHASE TAB */}
          {activeTab === 'purchase-log' && (
            <div className="form-container animate-fade-in">
              <div className="glass-card form-box">
                <div className="form-header">
                  <h3>Log Purchased Spare Part</h3>
                  <p>Record the procurement details including supplier, cost breakdown, invoice, and upload both purchase and receipt photo evidence.</p>
                </div>

                <form onSubmit={handlePurchaseSubmit}>
                  <div className="form-group">
                    <label className="form-label">Select Active Request</label>
                    <select 
                      className="form-input" 
                      required 
                      value={purchaseForm.sparePartRequest}
                      onChange={(e) => setPurchaseForm({ ...purchaseForm, sparePartRequest: e.target.value })}
                    >
                      <option value="">-- Choose request --</option>
                      {incomingRequests.map(r => (
                        <option key={r._id} value={r._id}>
                          {r.sparePartName} (S/N: {r.serialNumber}) for {r.car?.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Supplier / Vendor Name</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      required
                      placeholder="e.g. Caterpillar Ethiopia"
                      value={purchaseForm.supplier}
                      onChange={(e) => setPurchaseForm({ ...purchaseForm, supplier: e.target.value })}
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Quantity</label>
                      <input 
                        type="number" 
                        className="form-input" 
                        required 
                        min="1"
                        value={purchaseForm.quantity}
                        onChange={(e) => setPurchaseForm({ ...purchaseForm, quantity: parseInt(e.target.value) || 1 })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Unit Price (Birr)</label>
                      <input 
                        type="number" 
                        className="form-input" 
                        required 
                        min="0.01" 
                        step="0.01"
                        placeholder="e.g. 450.00"
                        value={purchaseForm.unitPrice}
                        onChange={(e) => setPurchaseForm({ ...purchaseForm, unitPrice: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Total Price (auto-calculated)</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      disabled 
                      value={`${((parseFloat(purchaseForm.unitPrice) || 0) * (parseInt(purchaseForm.quantity) || 1)).toFixed(2)} Birr`}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Invoice / Receipt Number</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      required
                      placeholder="e.g. INV-2026-9938"
                      value={purchaseForm.invoiceNumber}
                      onChange={(e) => setPurchaseForm({ ...purchaseForm, invoiceNumber: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Purchase Description</label>
                    <textarea 
                      className="form-input" 
                      rows="3" 
                      required
                      placeholder="Specify supplier locations, components matching serials, warranty details..."
                      value={purchaseForm.description}
                      onChange={(e) => setPurchaseForm({ ...purchaseForm, description: e.target.value })}
                    ></textarea>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Purchase Photo / Invoice Scan (Required)</label>
                    <input 
                      type="file" 
                      className="form-input" 
                      accept="image/*" 
                      required
                      onChange={(e) => setPurchasePhoto(e.target.files[0])}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Receipt Photo (Required)</label>
                    <input 
                      type="file" 
                      className="form-input" 
                      accept="image/*" 
                      required
                      onChange={(e) => setReceiptPhoto(e.target.files[0])}
                    />
                  </div>

                  <button type="submit" className="btn btn-primary w-full" disabled={submittingPurchase || incomingRequests.length === 0}>
                    {submittingPurchase ? 'Submitting Purchase...' : 'Log Spare Part Purchase'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* PURCHASE HISTORY TAB */}
          {activeTab === 'purchases' && (
            <div className="purchases-view animate-fade-in">
              <div className="glass-card table-section">
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Spare Part</th>
                        <th>Machinery</th>
                        <th>Vendor</th>
                        <th>Invoice No</th>
                        <th>Qty</th>
                        <th>Unit Price</th>
                        <th>Total</th>
                        <th>Evidence</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myPurchases.length === 0 ? (
                        <tr><td colSpan="9" className="text-center">No purchases recorded by you yet.</td></tr>
                      ) : (
                        myPurchases.map((p) => (
                          <tr key={p._id}>
                            <td>{new Date(p.purchaseDate).toLocaleDateString()}</td>
                            <td><strong>{p.sparePartName || p.sparePartRequest?.sparePartName || 'N/A'}</strong></td>
                            <td>{p.sparePartRequest?.car?.name || 'N/A'}</td>
                            <td>{p.supplier || p.supplierName}</td>
                            <td><code>{p.invoiceNumber}</code></td>
                            <td>{p.quantity || 1}</td>
                            <td>${(p.unitPrice || 0).toLocaleString()}</td>
                            <td><strong>${(p.totalPrice || p.price || 0).toLocaleString()}</strong></td>
                            <td className="evidence-links">
                              <a href={getImageUrl(p.purchasePhoto || p.photo)} target="_blank" rel="noreferrer" className="btn-text">
                                Invoice
                              </a>
                              {p.receiptPhoto && (
                                <>
                                  {' • '}
                                  <a href={getImageUrl(p.receiptPhoto)} target="_blank" rel="noreferrer" className="btn-text">
                                    Receipt
                                  </a>
                                </>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
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
          grid-template-columns: 1fr 1.2fr;
          gap: 30px;
        }

        .stats-cards {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .stat-card {
          padding: 24px;
        }

        .stat-label {
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: hsl(var(--muted-foreground));
        }

        .stat-value {
          font-size: 2.2rem;
          font-weight: 700;
          color: #fff;
          margin: 6px 0;
        }

        .stat-sub {
          font-size: 0.8rem;
          color: hsl(var(--muted-foreground));
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
          max-height: 400px;
          overflow-y: auto;
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
          display: block;
        }

        .empty-quick {
          text-align: center;
          padding: 30px 0;
          font-size: 0.9rem;
        }

        .priority-tag {
          font-size: 0.7rem;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 12px;
          text-transform: uppercase;
        }

        .priority-tag.low { background: rgba(16, 185, 129, 0.1); color: #10b981; }
        .priority-tag.medium { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
        .priority-tag.high { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
        .priority-tag.critical { background: rgba(220, 38, 38, 0.15); color: #dc2626; }

        .table-section {
          padding: 24px;
        }

        .table-wrapper {
          width: 100%;
          overflow-x: auto;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }

        th {
          padding: 14px 16px;
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: hsl(var(--muted-foreground));
          border-bottom: 1px solid hsl(var(--border));
          white-space: nowrap;
        }

        td {
          padding: 16px;
          font-size: 0.9rem;
          border-bottom: 1px solid hsl(var(--border));
        }

        tr:hover td {
          background: rgba(255, 255, 255, 0.01);
        }

        .evidence-links {
          white-space: nowrap;
        }

        .btn-text {
          color: hsl(var(--primary));
          background: none;
          border: none;
          cursor: pointer;
          font-weight: 500;
          text-decoration: none;
          font-size: 0.85rem;
        }

        .form-container {
          display: flex;
          justify-content: center;
          padding: 20px 0;
        }

        .form-box {
          width: 100%;
          max-width: 540px;
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

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .w-full {
          width: 100%;
        }

        textarea.form-input {
          resize: none;
        }

        @media (max-width: 768px) {
          .dashboard-grid { grid-template-columns: 1fr; gap: 16px; }
          .stat-section, .stat-card, .table-section, .form-box { padding: 20px; }
          .quick-list-item { align-items: stretch; flex-direction: column; gap: 12px; padding: 16px; }
          .quick-list-item .btn { width: 100%; }
          .form-row { grid-template-columns: 1fr; gap: 0; }
          .form-container { padding: 0; }
        }
      `}</style>
    </PortalShell>
  );
}
