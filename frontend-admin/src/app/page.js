'use client';
import { useState, useEffect } from 'react';
import PortalShell from '../components/PortalShell';
import { api } from '../utils/api';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // States
  const [stats, setStats] = useState(null);
  const [cars, setCars] = useState([]);
  const [users, setUsers] = useState([]);
  const [issueReports, setIssueReports] = useState([]);
  const [issueCases, setIssueCases] = useState([]);
  const [sparePartRequests, setSparePartRequests] = useState([]);
  const [handoverValidations, setHandoverValidations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter states for all tabs
  const [searchCar, setSearchCar] = useState('');
  const [carStatusFilter, setCarStatusFilter] = useState('');
  const [searchUser, setSearchUser] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [searchCase, setSearchCase] = useState('');
  const [caseStatusFilter, setCaseStatusFilter] = useState('');
  const [searchPart, setSearchPart] = useState('');
  const [partStatusFilter, setPartStatusFilter] = useState('');
  const [searchHandover, setSearchHandover] = useState('');
  const [handoverStatusFilter, setHandoverStatusFilter] = useState('');
  const [searchApproval, setSearchApproval] = useState('');
  
  // Reporting and History filter states
  const [filterMachine, setFilterMachine] = useState('');
  const [filterEventType, setFilterEventType] = useState('');
  const [filterDriver, setFilterDriver] = useState('');
  const [filterSiteManager, setFilterSiteManager] = useState('');
  const [filterAccountant, setFilterAccountant] = useState('');
  const [filterSupplier, setFilterSupplier] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [selectedHistoryDetail, setSelectedHistoryDetail] = useState(null);

  // Modals and forms
  const [showCarModal, setShowCarModal] = useState(false);
  const [selectedCar, setSelectedCar] = useState(null);
  const [carForm, setCarForm] = useState({ 
    name: '', plateNumber: '', type: '', assignedDriver: '', status: 'Active',
    brand: '', model: '', manufacturingYear: '', engineNumber: '', chassisNumber: '', 
    currentMileage: '', assignedSite: ''
  });
  const [carPhoto, setCarPhoto] = useState(null);
  const [carHistory, setCarHistory] = useState([]);
  const [viewingCarHistory, setViewingCarHistory] = useState(null);

  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userForm, setUserForm] = useState({ username: '', password: '', role: 'Driver', fullName: '', phone: '', assignedCar: '' });

  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedCaseForRequest, setSelectedCaseForRequest] = useState(null);
  const [requestForm, setRequestForm] = useState({ sparePartName: '', serialNumber: '', assignedSiteManager: '', assignedAccountant: '' });
  const [requestPhoto, setRequestPhoto] = useState(null);

  const [validationNotes, setValidationNotes] = useState('');
  
  // Final Verifications (PRD v3.0 closing stages)
  const [finalVerifications, setFinalVerifications] = useState([]);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedCaseForApproval, setSelectedCaseForApproval] = useState(null);
  const [approveForm, setApproveForm] = useState({
    oldPartSerialNumber: '',
    newPartSerialNumber: '',
    installedBy: 'Technician',
    maintenanceCost: 0,
    description: ''
  });

  // Fetch initial data
  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'dashboard') {
        const res = await api.get('/dashboard/stats');
        if (res.success) setStats(res.stats);
      } else if (activeTab === 'cars') {
        const res = await api.get('/cars');
        if (res.success) setCars(res.cars);
        const driversRes = await api.get('/users?role=Driver');
        if (driversRes.success) setUsers(driversRes.users);
      } else if (activeTab === 'users') {
        const res = await api.get('/users');
        if (res.success) setUsers(res.users);
        const carsRes = await api.get('/cars');
        if (carsRes.success) setCars(carsRes.cars);
      } else if (activeTab === 'issue-validation') {
        const reportsRes = await api.get('/issue-reports?status=Reported');
        if (reportsRes.success) setIssueReports(reportsRes.reports);
        const casesRes = await api.get('/issue-cases');
        if (casesRes.success) setIssueCases(casesRes.issueCases);
        const carsRes = await api.get('/cars');
        if (carsRes.success) setCars(carsRes.cars);
        const managersRes = await api.get('/users?role=SiteManager');
        const accountantsRes = await api.get('/users?role=Accountant');
        if (managersRes.success || accountantsRes.success) {
          setUsers([...(managersRes.success ? managersRes.users : []), ...(accountantsRes.success ? accountantsRes.users : [])]);
        }
      } else if (activeTab === 'spare-parts') {
        const res = await api.get('/spare-part-requests');
        if (res.success) setSparePartRequests(res.requests);
        const managersRes = await api.get('/users?role=SiteManager');
        const accountantsRes = await api.get('/users?role=Accountant');
        if (managersRes.success && accountantsRes.success) {
          setUsers([...managersRes.users, ...accountantsRes.users]);
        }
      } else if (activeTab === 'handover-validation') {
        const res = await api.get('/handover-validations');
        if (res.success) setHandoverValidations(res.validations);
      } else if (activeTab === 'final-approval') {
        const res = await api.get('/final-verifications');
        if (res.success) setFinalVerifications(res.verifications);
      } else if (activeTab === 'reports') {
        const res = await api.get('/cars/history/all');
        if (res.success) setCarHistory(res.history);
        const carsRes = await api.get('/cars');
        if (carsRes.success) setCars(carsRes.cars);
        const usersRes = await api.get('/users');
        if (usersRes.success) setUsers(usersRes.users);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Car Management actions
  const handleCarSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('name', carForm.name);
    formData.append('plateNumber', carForm.plateNumber);
    formData.append('type', carForm.type);
    formData.append('status', carForm.status);
    formData.append('brand', carForm.brand || '');
    formData.append('model', carForm.model || '');
    formData.append('manufacturingYear', carForm.manufacturingYear || '');
    formData.append('engineNumber', carForm.engineNumber || '');
    formData.append('chassisNumber', carForm.chassisNumber || '');
    formData.append('currentMileage', carForm.currentMileage || '');
    formData.append('assignedSite', carForm.assignedSite || '');
    if (carForm.assignedDriver) formData.append('assignedDriver', carForm.assignedDriver);
    if (carPhoto) formData.append('photo', carPhoto);

    try {
      let res;
      if (selectedCar) {
        res = await api.put(`/cars/${selectedCar._id}`, formData, true);
      } else {
        res = await api.post('/cars', formData, true);
      }
      if (res.success) {
        setShowCarModal(false);
        setCarForm({ 
          name: '', plateNumber: '', type: '', assignedDriver: '', status: 'Active',
          brand: '', model: '', manufacturingYear: '', engineNumber: '', chassisNumber: '', 
          currentMileage: '', assignedSite: ''
        });
        setCarPhoto(null);
        setSelectedCar(null);
        fetchData();
      } else {
        alert(res.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditCar = (car) => {
    setSelectedCar(car);
    setCarForm({
      name: car.name,
      plateNumber: car.plateNumber,
      type: car.type,
      assignedDriver: car.assignedDriver?._id || '',
      status: car.status,
      brand: car.brand || '',
      model: car.model || '',
      manufacturingYear: car.manufacturingYear || '',
      engineNumber: car.engineNumber || '',
      chassisNumber: car.chassisNumber || '',
      currentMileage: car.currentMileage || '',
      assignedSite: car.assignedSite || ''
    });
    setShowCarModal(true);
  };

  const handleDeleteCar = async (id) => {
    if (confirm('Are you sure you want to remove this machinery?')) {
      const res = await api.delete(`/cars/${id}`);
      if (res.success) fetchData();
    }
  };

  const handleViewCarHistory = async (car) => {
    setViewingCarHistory(car);
    const res = await api.get(`/cars/${car._id}/history`);
    if (res.success) setCarHistory(res.history);
  };

  // User Management actions
  const handleUserSubmit = async (e) => {
    e.preventDefault();
    try {
      let res;
      if (selectedUser) {
        res = await api.put(`/users/${selectedUser._id}`, userForm);
      } else {
        res = await api.post('/users', userForm);
      }
      if (res.success) {
        setShowUserModal(false);
        setUserForm({ username: '', password: '', role: 'Driver', fullName: '', phone: '', assignedCar: '' });
        setSelectedUser(null);
        fetchData();
      } else {
        alert(res.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setUserForm({
      username: user.username,
      password: '',
      role: user.role,
      fullName: user.fullName || '',
      phone: user.phone || '',
      assignedCar: user.assignedCar?._id || ''
    });
    setShowUserModal(true);
  };

  const handleDeleteUser = async (id) => {
    if (confirm('Are you sure you want to deactivate this account?')) {
      const res = await api.delete(`/users/${id}`);
      if (res.success) fetchData();
    }
  };

  // Issue cross-validation
  const handleCreateCase = async (driverRepId, smRepId, carId) => {
    try {
      const res = await api.post('/issue-cases', {
        car: carId,
        driverReport: driverRepId,
        siteManagerReport: smRepId
      });
      if (res.success) {
        alert('Reports successfully paired into a Case!');
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleValidateCase = async (caseId, status) => {
    try {
      const res = await api.put(`/issue-cases/${caseId}/validate`, {
        matchStatus: status,
        adminNotes: validationNotes
      });
      if (res.success) {
        alert(`Case validation updated to: ${status}`);
        setValidationNotes('');
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Spare part request
  const handleOpenRequestModal = (issueCase) => {
    setSelectedCaseForRequest(issueCase);
    setRequestForm({
      sparePartName: '',
      serialNumber: '',
      assignedSiteManager: issueCase.siteManagerReport?.reportedBy?._id || issueCase.driverReport?.reportedBy?.assignedCar?.assignedDriver || '',
      assignedAccountant: ''
    });
    // fetch accountants
    api.get('/users?role=Accountant').then(res => {
      if (res.success) {
        setUsers(prev => [...prev, ...res.users]);
      }
    });
    setShowRequestModal(true);
  };

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('issueCase', selectedCaseForRequest._id);
    formData.append('car', selectedCaseForRequest.car._id);
    formData.append('sparePartName', requestForm.sparePartName);
    formData.append('serialNumber', requestForm.serialNumber);
    formData.append('assignedSiteManager', requestForm.assignedSiteManager);
    formData.append('assignedAccountant', requestForm.assignedAccountant);
    if (requestPhoto) formData.append('photo', requestPhoto);

    try {
      const res = await api.post('/spare-part-requests', formData, true);
      if (res.success) {
        setShowRequestModal(false);
        setRequestForm({ sparePartName: '', serialNumber: '', assignedSiteManager: '', assignedAccountant: '' });
        setRequestPhoto(null);
        setSelectedCaseForRequest(null);
        // Put car under repair
        await api.put(`/cars/${selectedCaseForRequest.car._id}`, { status: 'Under Maintenance' });
        fetchData();
      } else {
        alert(res.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handover validation
  const handleValidateHandover = async (validationId, status) => {
    try {
      const res = await api.put(`/handover-validations/${validationId}/validate`, {
        matchStatus: status,
        adminNotes: validationNotes
      });
      if (res.success) {
        alert(`Handover validation updated to: ${status}`);
        setValidationNotes('');
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Final approval submitting
  const handleOpenApproveModal = (caseId, sparePartRequest, purchaseRecord) => {
    setSelectedCaseForApproval(caseId);
    setApproveForm({
      oldPartSerialNumber: sparePartRequest ? sparePartRequest.serialNumber : '',
      newPartSerialNumber: purchaseRecord ? purchaseRecord.serialNumber : '',
      installedBy: 'Technician',
      maintenanceCost: purchaseRecord ? purchaseRecord.totalPrice : 0,
      description: 'Spare part replacement approved. Both Driver and Site Manager verified.'
    });
    setShowApprovalModal(true);
  };

  const handleApproveSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put(`/final-verifications/issue-case/${selectedCaseForApproval}/approve`, approveForm);
      if (res.success) {
        alert('Repair approved and closed successfully!');
        setShowApprovalModal(false);
        setSelectedCaseForApproval(null);
        fetchData();
      } else {
        alert(res.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Group final verifications by issueCase ID
  const groupedVerifications = {};
  finalVerifications.forEach(v => {
    const caseId = v.issueCase?._id;
    if (!caseId) return;
    if (!groupedVerifications[caseId]) {
      groupedVerifications[caseId] = {
        issueCase: v.issueCase,
        sparePartRequest: v.sparePartRequest,
        driverVer: null,
        siteManagerVer: null,
        all: []
      };
    }
    groupedVerifications[caseId].all.push(v);
    if (v.submitterRole === 'Driver') {
      groupedVerifications[caseId].driverVer = v;
    } else if (v.submitterRole === 'SiteManager') {
      groupedVerifications[caseId].siteManagerVer = v;
    }
  });

  // Filter helper functions
  const filteredCars = cars.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchCar.toLowerCase()) || c.plateNumber.toLowerCase().includes(searchCar.toLowerCase());
    const matchesStatus = !carStatusFilter || c.status === carStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredUsers = users.filter(u => {
    const matchesSearch = (u.fullName || u.username).toLowerCase().includes(searchUser.toLowerCase());
    const matchesRole = !roleFilter || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const filteredIssueCases = issueCases.filter(c => {
    const matchesSearch = (c.car?.name || '').toLowerCase().includes(searchCase.toLowerCase()) || (c.car?.plateNumber || '').toLowerCase().includes(searchCase.toLowerCase());
    const matchesStatus = !caseStatusFilter || c.matchStatus === caseStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredSpareParts = sparePartRequests.filter(r => {
    const matchesSearch = (r.sparePartName || '').toLowerCase().includes(searchPart.toLowerCase()) || (r.car?.name || '').toLowerCase().includes(searchPart.toLowerCase());
    const matchesStatus = !partStatusFilter || r.status === partStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredHandovers = handoverValidations.filter(v => {
    const matchesSearch = (v.sparePartRequest?.sparePartName || '').toLowerCase().includes(searchHandover.toLowerCase());
    const matchesStatus = !handoverStatusFilter || v.matchStatus === handoverStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredApprovals = Object.keys(groupedVerifications).filter(caseId => {
    const group = groupedVerifications[caseId];
    const matchesSearch = (group.issueCase?.car?.name || '').toLowerCase().includes(searchApproval.toLowerCase());
    return matchesSearch;
  }).reduce((acc, key) => { acc[key] = groupedVerifications[key]; return acc; }, {});

  // Tabs layout config
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
      id: 'cars',
      label: 'Machinery Management',
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
      id: 'users',
      label: 'Team Members',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      )
    },
    {
      id: 'issue-validation',
      label: 'Issue Validation',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="m22 2-7 20-4-9-9-4Z"/>
          <path d="M22 2 11 13"/>
        </svg>
      )
    },
    {
      id: 'spare-parts',
      label: 'Spare Parts',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
        </svg>
      )
    },
    {
      id: 'handover-validation',
      label: 'Handover Validation',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      )
    },
    {
      id: 'final-approval',
      label: 'Final Approval',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
      )
    },
    {
      id: 'reports',
      label: 'Reports & Audit',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path>
          <path d="M22 12A10 10 0 0 0 12 2v10z"></path>
        </svg>
      )
    }
  ];

  return (
    <PortalShell role="Admin" activeTab={activeTab} setActiveTab={setActiveTab} tabs={tabs}>
      {loading ? (
        <div className="flex-center" style={{ height: '300px' }}><span className="spinner"></span></div>
      ) : (
        <div className="tab-viewport">
          
          {/* DASHBOARD TAB */}
          {activeTab === 'dashboard' && stats && (
            <div className="dashboard-grid animate-fade-in">
              <div className="stats-cards">
                <div className="glass-card stat-card">
                  <div className="stat-info">
                    <span className="stat-label">Total Machinery</span>
                    <h3 className="stat-value">{stats.fleet.total}</h3>
                  </div>
                  <div className="stat-sub">
                    <span className="success">{stats.fleet.active} Active</span> • <span>{stats.fleet.underRepair} Repair</span>
                  </div>
                </div>
                <div className="glass-card stat-card">
                  <div className="stat-info">
                    <span className="stat-label">Pending Issue Cases</span>
                    <h3 className="stat-value">{stats.issues.pendingCases}</h3>
                  </div>
                  <div className="stat-sub">
                    <span className="warning">{stats.issues.openReports} Reports Awaiting Validation</span>
                  </div>
                </div>
                <div className="glass-card stat-card">
                  <div className="stat-info">
                    <span className="stat-label">Active Part Orders</span>
                    <h3 className="stat-value">{stats.spareParts.pendingRequests}</h3>
                  </div>
                  <div className="stat-sub">
                    <span>{stats.spareParts.awaitingHandover} Purchased, Awaiting Handover</span>
                  </div>
                </div>
                <div className="glass-card stat-card">
                  <div className="stat-info">
                    <span className="stat-label">Team Size</span>
                    <h3 className="stat-value">{stats.users.drivers + stats.users.siteManagers + stats.users.accountants}</h3>
                  </div>
                  <div className="stat-sub">
                    <span>{stats.users.drivers} Drivers • {stats.users.siteManagers} SMs • {stats.users.accountants} Acct</span>
                  </div>
                </div>
              </div>

              {/* Recent History Table */}
              <div className="glass-card table-section">
                <div className="table-header">
                  <h3>Recent Machinery History Logs</h3>
                </div>
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Machine</th>
                        <th>Event Type</th>
                        <th>Old Spare Part</th>
                        <th>New Spare Part</th>
                        <th>Logged By</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.recentHistory.length === 0 ? (
                        <tr><td colSpan="6" className="text-center">No history records found yet.</td></tr>
                      ) : (
                        stats.recentHistory.map((h) => (
                          <tr key={h._id}>
                            <td><strong>{h.car?.name}</strong> ({h.car?.plateNumber})</td>
                            <td><span className="badge badge-success">{h.eventType}</span></td>
                            <td className="text-muted">{h.oldPartName || 'N/A'}</td>
                            <td>{h.newPartName || 'N/A'}</td>
                            <td>{h.createdBy?.fullName || h.createdBy?.username}</td>
                            <td>{new Date(h.date).toLocaleDateString()}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* FLEET/MACHINERY MANAGEMENT TAB */}
          {activeTab === 'cars' && (
            <div className="fleet-view animate-fade-in">
              <div className="view-actions">
                <button className="btn btn-primary" onClick={() => { setSelectedCar(null); setCarForm({ name: '', plateNumber: '', type: '', assignedDriver: '', status: 'Active', brand: '', model: '', manufacturingYear: '', engineNumber: '', chassisNumber: '', currentMileage: '', assignedSite: '' }); setShowCarModal(true); }}>
                  + Add New Machinery
                </button>
              </div>

              {/* Search and Filter Section */}
              <div className="glass-card" style={{ padding: '16px', marginBottom: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label">Search by Name or Plate</label>
                  <input type="text" className="form-input" placeholder="Search machinery..." value={searchCar} onChange={(e) => setSearchCar(e.target.value)} />
                </div>
                <div>
                  <label className="form-label">Filter by Status</label>
                  <select className="form-input" value={carStatusFilter} onChange={(e) => setCarStatusFilter(e.target.value)}>
                    <option value="">All Status</option>
                    <option value="Active">Active</option>
                    <option value="Under Maintenance">Under Maintenance</option>
                    <option value="Out of Service">Out of Service</option>
                  </select>
                </div>
              </div>

              <div className="cards-grid">
                {filteredCars.length === 0 ? (
                  <div className="glass-card text-center" style={{ gridColumn: '1/-1', padding: '40px' }}>No machinery found matching your filters.</div>
                ) : (
                  filteredCars.map((car) => (
                    <div key={car._id} className="glass-card resource-card">
                    <div className="resource-photo" style={{ backgroundImage: car.photo ? `url(http://localhost:5000${car.photo})` : 'linear-gradient(135deg, #1e293b, #0f172a)' }}>
                      <span className={`status-badge ${car.status.replace(/\s+/g, '').toLowerCase()}`}>{car.status}</span>
                    </div>
                    <div className="resource-body">
                      <h3>{car.name}</h3>
                      <div className="resource-meta">
                        <div><strong>Plate:</strong> {car.plateNumber}</div>
                        <div><strong>Type:</strong> {car.type}</div>
                        <div><strong>Driver:</strong> {car.assignedDriver ? car.assignedDriver.fullName || car.assignedDriver.username : <span className="text-muted">Unassigned</span>}</div>
                      </div>
                      <div className="resource-footer">
                        <button className="btn btn-secondary" onClick={() => handleEditCar(car)}>Edit</button>
                        <button className="btn btn-accent" onClick={() => handleViewCarHistory(car)}>History</button>
                        <button className="btn btn-danger" onClick={() => handleDeleteCar(car._id)}>Delete</button>
                      </div>
                    </div>
                  </div>
                  ))
                )}
              </div>

              {/* Car History Modal/Widget */}
              {viewingCarHistory && (
                <div className="modal-overlay">
                  <div className="glass-card modal-content wide">
                    <div className="modal-header">
                      <h3>Maintenance History: {viewingCarHistory.name}</h3>
                      <button className="btn-close" onClick={() => setViewingCarHistory(null)}>×</button>
                    </div>
                    <div className="history-timeline">
                      {carHistory.length === 0 ? (
                        <div className="empty-history text-center">No maintenance logs exist for this machinery yet.</div>
                      ) : (
                        carHistory.map((h) => (
                          <div key={h._id} className="timeline-item">
                            <div className="timeline-date">{new Date(h.createdAt || h.date).toLocaleDateString()}</div>
                            <div className="timeline-content glass-card">
                              <h4>{h.description}</h4>
                              <div className="part-change">
                                <span className="removed-part">{h.oldPartName || 'None'} (S/N: {h.oldPartSerialNumber || 'N/A'})</span>
                                <span className="arrow">→</span>
                                <span className="installed-part">{h.newPartName || 'None'} (S/N: {h.newPartSerialNumber || 'N/A'})</span>
                              </div>
                              <div style={{ fontSize: '0.85rem', color: 'hsl(var(--muted-foreground))', marginTop: '6px' }}>
                                <strong>Installed By:</strong> {h.installedBy} • <strong>Cost:</strong> ${h.maintenanceCost}
                              </div>
                              {h.photosBeforeRepair && h.photosBeforeRepair.length > 0 && (
                                <div style={{ marginTop: '10px' }}>
                                  <div style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px' }}>Photos Before Repair:</div>
                                  <div className="history-photos">
                                    {h.photosBeforeRepair.map((p, idx) => (
                                      <img key={idx} src={`http://localhost:5000${p}`} alt="Before Repair" className="evidence-thumb" />
                                    ))}
                                  </div>
                                </div>
                              )}
                              {h.photosAfterRepair && h.photosAfterRepair.length > 0 && (
                                <div style={{ marginTop: '10px' }}>
                                  <div style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px' }}>Photos After Repair:</div>
                                  <div className="history-photos">
                                    {h.photosAfterRepair.map((p, idx) => (
                                      <img key={idx} src={`http://localhost:5000${p}`} alt="After Repair" className="evidence-thumb" />
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Car CRUD Modal */}
              {showCarModal && (
                <div className="modal-overlay">
                  <form onSubmit={handleCarSubmit} className="glass-card modal-content">
                    <div className="modal-header">
                      <h3>{selectedCar ? 'Edit Machinery Details' : 'Add New Heavy Machinery'}</h3>
                      <button type="button" className="btn-close" onClick={() => setShowCarModal(false)}>×</button>
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">Machinery Name</label>
                      <input type="text" className="form-input" required value={carForm.name} onChange={(e) => setCarForm({ ...carForm, name: e.target.value })} placeholder="e.g. Caterpillar 320 Excavator" />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Plate / Asset Number</label>
                      <input type="text" className="form-input" required value={carForm.plateNumber} onChange={(e) => setCarForm({ ...carForm, plateNumber: e.target.value })} placeholder="e.g. THA-EX-004" />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Machinery Type</label>
                      <input type="text" className="form-input" required value={carForm.type} onChange={(e) => setCarForm({ ...carForm, type: e.target.value })} placeholder="e.g. Excavator / Loader" />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Brand</label>
                      <input type="text" className="form-input" value={carForm.brand} onChange={(e) => setCarForm({ ...carForm, brand: e.target.value })} placeholder="e.g. Caterpillar" />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Model</label>
                      <input type="text" className="form-input" value={carForm.model} onChange={(e) => setCarForm({ ...carForm, model: e.target.value })} placeholder="e.g. 320D" />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Manufacturing Year</label>
                      <input type="number" className="form-input" value={carForm.manufacturingYear} onChange={(e) => setCarForm({ ...carForm, manufacturingYear: e.target.value })} placeholder="e.g. 2021" />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Engine Number</label>
                      <input type="text" className="form-input" value={carForm.engineNumber} onChange={(e) => setCarForm({ ...carForm, engineNumber: e.target.value })} placeholder="e.g. ENG-928472" />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Chassis Number</label>
                      <input type="text" className="form-input" value={carForm.chassisNumber} onChange={(e) => setCarForm({ ...carForm, chassisNumber: e.target.value })} placeholder="e.g. CHA-88123-B" />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Current Mileage (km / hours)</label>
                      <input type="number" className="form-input" value={carForm.currentMileage} onChange={(e) => setCarForm({ ...carForm, currentMileage: e.target.value })} placeholder="e.g. 45000" />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Assigned Site / Project Location</label>
                      <input type="text" className="form-input" value={carForm.assignedSite} onChange={(e) => setCarForm({ ...carForm, assignedSite: e.target.value })} placeholder="e.g. Bole Airport Expansion" />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Assigned Driver</label>
                      <select className="form-input" value={carForm.assignedDriver} onChange={(e) => setCarForm({ ...carForm, assignedDriver: e.target.value })}>
                        <option value="">-- Select Driver --</option>
                        {users.filter(u => u.role === 'Driver').map(u => (
                          <option key={u._id} value={u._id}>{u.fullName || u.username}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Status</label>
                      <select className="form-input" value={carForm.status} onChange={(e) => setCarForm({ ...carForm, status: e.target.value })}>
                        <option value="Active">Active</option>
                        <option value="Under Maintenance">Under Maintenance</option>
                        <option value="Waiting for Spare Part">Waiting for Spare Part</option>
                        <option value="Out of Service">Out of Service</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Machinery Photo</label>
                      <input type="file" className="form-input" onChange={(e) => setCarPhoto(e.target.files[0])} />
                    </div>

                    <button type="submit" className="btn btn-primary">{selectedCar ? 'Save Changes' : 'Create Machinery'}</button>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* TEAM MEMBERS TAB */}
          {activeTab === 'users' && (
            <div className="team-view animate-fade-in">
              <div className="view-actions">
                <button className="btn btn-primary" onClick={() => { setSelectedUser(null); setUserForm({ username: '', password: '', role: 'Driver', fullName: '', phone: '', assignedCar: '' }); setShowUserModal(true); }}>
                  + Add Team Member
                </button>
              </div>

              {/* Search and Filter Section */}
              <div className="glass-card" style={{ padding: '16px', marginBottom: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label">Search by Name or Username</label>
                  <input type="text" className="form-input" placeholder="Search team members..." value={searchUser} onChange={(e) => setSearchUser(e.target.value)} />
                </div>
                <div>
                  <label className="form-label">Filter by Role</label>
                  <select className="form-input" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                    <option value="">All Roles</option>
                    <option value="Driver">Driver</option>
                    <option value="SiteManager">Site Manager</option>
                    <option value="Accountant">Accountant</option>
                  </select>
                </div>
              </div>

              <div className="glass-card table-section">
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>FullName</th>
                        <th>Username</th>
                        <th>Role</th>
                        <th>Phone</th>
                        <th>Assigned Machinery</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.length === 0 ? (
                        <tr><td colSpan="6" className="text-center">No team members found matching your filters.</td></tr>
                      ) : (
                        filteredUsers.map((user) => (
                          <tr key={user._id}>
                          <td><strong>{user.fullName || 'N/A'}</strong></td>
                          <td>{user.username}</td>
                          <td><span className={`badge ${user.role.toLowerCase()}`}>{user.role}</span></td>
                          <td>{user.phone || 'N/A'}</td>
                          <td>{user.assignedCar ? `${user.assignedCar.name} (${user.assignedCar.plateNumber})` : 'N/A'}</td>
                          <td className="table-actions">
                            <button className="btn btn-secondary btn-sm" onClick={() => handleEditUser(user)}>Edit</button>
                            <button className="btn btn-danger btn-sm" onClick={() => handleDeleteUser(user._id)}>Deactivate</button>
                          </td>
                        </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* User CRUD Modal */}
              {showUserModal && (
                <div className="modal-overlay">
                  <form onSubmit={handleUserSubmit} className="glass-card modal-content">
                    <div className="modal-header">
                      <h3>{selectedUser ? 'Edit Team Member' : 'Provision New Account'}</h3>
                      <button type="button" className="btn-close" onClick={() => setShowUserModal(false)}>×</button>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Full Name</label>
                      <input type="text" className="form-input" required value={userForm.fullName} onChange={(e) => setUserForm({ ...userForm, fullName: e.target.value })} placeholder="e.g. Abebe Balcha" />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Username (Login ID)</label>
                      <input type="text" className="form-input" required disabled={!!selectedUser} value={userForm.username} onChange={(e) => setUserForm({ ...userForm, username: e.target.value })} placeholder="e.g. abebe_b" />
                    </div>

                    {!selectedUser && (
                      <div className="form-group">
                        <label className="form-label">Initial Password</label>
                        <input type="password" className="form-input" required value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} placeholder="Temporary password" />
                      </div>
                    )}

                    {selectedUser && (
                      <div className="form-group">
                        <label className="form-label">Reset Password (Optional)</label>
                        <input type="password" className="form-input" value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} placeholder="Leave blank to keep same" />
                      </div>
                    )}

                    <div className="form-group">
                      <label className="form-label">Role</label>
                      <select className="form-input" required value={userForm.role} onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}>
                        <option value="Driver">Driver</option>
                        <option value="SiteManager">Site Manager</option>
                        <option value="Accountant">Accountant</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Phone Number</label>
                      <input type="text" className="form-input" value={userForm.phone} onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })} placeholder="e.g. +251..." />
                    </div>

                    {userForm.role === 'Driver' && (
                      <div className="form-group">
                        <label className="form-label">Assign Machinery</label>
                        <select className="form-input" value={userForm.assignedCar} onChange={(e) => setUserForm({ ...userForm, assignedCar: e.target.value })}>
                          <option value="">-- Select Machinery --</option>
                          {cars.map(c => (
                            <option key={c._id} value={c._id}>{c.name} ({c.plateNumber})</option>
                          ))}
                        </select>
                      </div>
                    )}

                    <button type="submit" className="btn btn-primary">{selectedUser ? 'Save Details' : 'Provision User'}</button>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* ISSUE VALIDATION (CROSS-CHECKING) TAB */}
          {activeTab === 'issue-validation' && (
            <div className="validation-view animate-fade-in">
              <div className="grid-split-2">
                
                {/* Reports Inbox */}
                <div className="glass-card inbox-pane">
                  <div className="pane-header">
                    <h3>Unconfirmed Issue Reports</h3>
                    <p>Issues reported directly from the field by Drivers or Site Managers.</p>
                  </div>
                  <div className="reports-list">
                    {issueReports.length === 0 ? (
                      <div className="empty-inbox">All incoming reports have been processed.</div>
                    ) : (
                      issueReports.map((r) => (
                        <div key={r._id} className="report-list-item glass-card">
                          <div className="item-photo" style={{ backgroundImage: `url(http://localhost:5000${r.photo})` }}></div>
                          <div className="item-details">
                            <div className="item-meta">
                              <span className={`badge ${r.reporterRole.toLowerCase()}`}>{r.reporterRole}</span>
                              <span className="item-date">{new Date(r.date).toLocaleDateString()}</span>
                            </div>
                            <h4>{r.car?.name}</h4>
                            <p><strong>Category:</strong> {r.issueCategory}</p>
                            <p>{r.description || 'No description provided.'}</p>
                            <div className="report-action-helpers">
                              <button className="btn btn-secondary btn-sm" onClick={() => {
                                // Find another report for same car to pair
                                const pair = issueReports.find(other => other._id !== r._id && other.car?._id === r.car?._id);
                                if (pair) {
                                  if (confirm(`Pair this report with ${pair.reporterRole}'s report for same machinery?`)) {
                                    handleCreateCase(
                                      r.reporterRole === 'Driver' ? r._id : pair._id,
                                      r.reporterRole === 'SiteManager' ? r._id : pair._id,
                                      r.car?._id
                                    );
                                  }
                                } else {
                                  // Create unilateral case
                                  handleCreateCase(
                                    r.reporterRole === 'Driver' ? r._id : null,
                                    r.reporterRole === 'SiteManager' ? r._id : null,
                                    r.car?._id
                                  );
                                }
                              }}>
                                Group as Case
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Cases Processing */}
                <div className="glass-card inbox-pane">
                  <div className="pane-header">
                    <h3>Active Issue Cases</h3>
                    <p>Validate paired reports before creating spare part requests.</p>
                  </div>
                  
                  {/* Search and Filter for Cases */}
                  <div style={{ padding: '12px 0', borderBottom: '1px solid var(--border)', marginBottom: '12px' }}>
                    <input type="text" className="form-input" placeholder="Search cases by machinery name..." value={searchCase} onChange={(e) => setSearchCase(e.target.value)} style={{ marginBottom: '8px' }} />
                    <select className="form-input" value={caseStatusFilter} onChange={(e) => setCaseStatusFilter(e.target.value)}>
                      <option value="">All Status</option>
                      <option value="Pending">Pending</option>
                      <option value="Matched">Matched</option>
                      <option value="Approved">Approved</option>
                      <option value="Unconfirmed">Unconfirmed</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>

                  <div className="cases-list">
                    {filteredIssueCases.length === 0 ? (
                      <div className="glass-card text-center" style={{ padding: '24px' }}>No cases found matching your filters.</div>
                    ) : (
                      filteredIssueCases.map((c) => (
                      <div key={c._id} className="case-item glass-card">
                        <div className="case-title-row">
                          <h4>Case: {c.car?.name} ({c.car?.plateNumber})</h4>
                          <span className={`status-badge ${c.matchStatus.toLowerCase()}`}>{c.matchStatus}</span>
                        </div>
                        
                        <div className="case-reports-compare">
                          <div className="compare-pane">
                            <div className="pane-title">Driver Evidence</div>
                            {c.driverReport ? (
                              <div className="evidence-block">
                                <img src={`http://localhost:5000${c.driverReport.photo}`} className="evidence-img" />
                                <p><strong>Category:</strong> {c.driverReport.issueCategory}</p>
                                <p>{c.driverReport.description || 'No description'}</p>
                              </div>
                            ) : (
                              <div className="empty-evidence error">⚠️ DRIVER REPORT MISSING</div>
                            )}
                          </div>

                          <div className="compare-pane">
                            <div className="pane-title">Site Manager Evidence</div>
                            {c.siteManagerReport ? (
                              <div className="evidence-block">
                                <img src={`http://localhost:5000${c.siteManagerReport.photo}`} className="evidence-img" />
                                <p><strong>Category:</strong> {c.siteManagerReport.issueCategory}</p>
                                <p>{c.siteManagerReport.description || 'No description'}</p>
                              </div>
                            ) : (
                              <div className="empty-evidence error">⚠️ SITE MANAGER REPORT MISSING</div>
                            )}
                          </div>
                        </div>

                        {c.matchStatus === 'Pending' && (
                          <div className="validation-actions">
                            <input type="text" className="form-input" placeholder="Admin verification notes..." value={validationNotes} onChange={(e) => setValidationNotes(e.target.value)} />
                            <div className="btn-group">
                              <button className="btn btn-primary" disabled={!c.driverReport || !c.siteManagerReport} onClick={() => handleValidateCase(c._id, 'Matched')}>
                                Match & Confirm
                              </button>
                              <button className="btn btn-secondary" onClick={() => handleValidateCase(c._id, 'Unconfirmed')}>
                                Flag Unconfirmed
                              </button>
                              <button className="btn btn-danger" onClick={() => handleValidateCase(c._id, 'Rejected')}>
                                Reject Case
                              </button>
                            </div>
                          </div>
                        )}

                        {(c.matchStatus === 'Matched' || c.matchStatus === 'Approved') && (
                          <div className="case-next-actions">
                            <button className="btn btn-accent" onClick={() => handleOpenRequestModal(c)}>
                              Create Spare Part Request
                            </button>
                          </div>
                        )}
                      </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Spare Part Request creation Modal */}
              {showRequestModal && selectedCaseForRequest && (
                <div className="modal-overlay">
                  <form onSubmit={handleRequestSubmit} className="glass-card modal-content">
                    <div className="modal-header">
                      <h3>Create Spare Part Request</h3>
                      <button type="button" className="btn-close" onClick={() => setShowRequestModal(false)}>×</button>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Part Name</label>
                      <input type="text" className="form-input" required value={requestForm.sparePartName} onChange={(e) => setRequestForm({ ...requestForm, sparePartName: e.target.value })} placeholder="e.g. Caterpillar Engine Oil Filter" />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Part Serial Number</label>
                      <input type="text" className="form-input" required value={requestForm.serialNumber} onChange={(e) => setRequestForm({ ...requestForm, serialNumber: e.target.value })} placeholder="e.g. PN-99482-A" />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Assigned Site Manager (For Handover)</label>
                      <select className="form-input" required value={requestForm.assignedSiteManager} onChange={(e) => setRequestForm({ ...requestForm, assignedSiteManager: e.target.value })}>
                        <option value="">-- Select Site Manager --</option>
                        {users.filter(u => u.role === 'SiteManager').map(u => (
                          <option key={u._id} value={u._id}>{u.fullName || u.username}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Assigned Accountant (For Purchase)</label>
                      <select className="form-input" required value={requestForm.assignedAccountant} onChange={(e) => setRequestForm({ ...requestForm, assignedAccountant: e.target.value })}>
                        <option value="">-- Select Accountant --</option>
                        {users.filter(u => u.role === 'Accountant').map(u => (
                          <option key={u._id} value={u._id}>{u.fullName || u.username}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Part Photo Reference (Optional)</label>
                      <input type="file" className="form-input" onChange={(e) => setRequestPhoto(e.target.files[0])} />
                    </div>

                    <button type="submit" className="btn btn-primary">Dispatch Request</button>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* SPARE PARTS LIFE-CYCLE TAB */}
          {activeTab === 'spare-parts' && (
            <div className="spare-parts-view animate-fade-in">
              {/* Search and Filter Section */}
              <div className="glass-card" style={{ padding: '16px', marginBottom: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label">Search by Part Name or Machinery</label>
                  <input type="text" className="form-input" placeholder="Search spare parts..." value={searchPart} onChange={(e) => setSearchPart(e.target.value)} />
                </div>
                <div>
                  <label className="form-label">Filter by Status</label>
                  <select className="form-input" value={partStatusFilter} onChange={(e) => setPartStatusFilter(e.target.value)}>
                    <option value="">All Status</option>
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Purchased">Purchased</option>
                    <option value="Received">Received</option>
                    <option value="Installed">Installed</option>
                  </select>
                </div>
              </div>

              <div className="glass-card table-section">
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Request ID</th>
                        <th>Machinery</th>
                        <th>Part Requested</th>
                        <th>Serial No</th>
                        <th>Site Manager</th>
                        <th>Accountant</th>
                        <th>Current Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSpareParts.length === 0 ? (
                        <tr><td colSpan="7" className="text-center">No spare part requests found matching your filters.</td></tr>
                      ) : (
                        filteredSpareParts.map((r) => (
                          <tr key={r._id}>
                            <td><code>{r.requestNumber || r._id.slice(-6)}</code></td>
                            <td><strong>{r.car?.name}</strong></td>
                            <td>{r.sparePartName}</td>
                            <td><code>{r.serialNumber}</code></td>
                            <td>{r.assignedSiteManager?.fullName || r.assignedSiteManager?.username}</td>
                            <td>{r.assignedAccountant?.fullName || r.assignedAccountant?.username || 'N/A'}</td>
                            <td>
                              <span className={`status-badge ${r.status.toLowerCase()}`}>
                                {r.status}
                              </span>
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

          {/* HANDOVER CROSS-VALIDATION TAB */}
          {activeTab === 'handover-validation' && (
            <div className="handover-view animate-fade-in">
              {/* Search and Filter Section */}
              <div className="glass-card" style={{ padding: '16px', marginBottom: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label">Search by Part Name</label>
                  <input type="text" className="form-input" placeholder="Search handovers..." value={searchHandover} onChange={(e) => setSearchHandover(e.target.value)} />
                </div>
                <div>
                  <label className="form-label">Filter by Status</label>
                  <select className="form-input" value={handoverStatusFilter} onChange={(e) => setHandoverStatusFilter(e.target.value)}>
                    <option value="">All Status</option>
                    <option value="Pending">Pending</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Discrepancy">Discrepancy</option>
                  </select>
                </div>
              </div>

              <div className="cases-list">
                {filteredHandovers.length === 0 ? (
                  <div className="glass-card text-center" style={{ padding: '40px' }}>No active purchase handovers matching your filters.</div>
                ) : (
                  filteredHandovers.map((v) => (
                    <div key={v._id} className="case-item glass-card">
                      <div className="case-title-row">
                        <h4>Handover: {v.sparePartRequest?.sparePartName} ({v.sparePartRequest?.car?.name})</h4>
                        <span className={`status-badge ${v.matchStatus.toLowerCase()}`}>{v.matchStatus}</span>
                      </div>

                      <div className="case-reports-compare">
                        {/* Accountant Purchase */}
                        <div className="compare-pane">
                          <div className="pane-title">Accountant Purchase Log</div>
                          <div className="evidence-block">
                            <img src={`http://localhost:5000${v.purchaseRecord?.purchasePhoto || v.purchaseRecord?.photo}`} className="evidence-img" />
                            <div className="evidence-details" style={{ marginTop: '10px' }}>
                              <div><strong>Supplier:</strong> {v.purchaseRecord?.supplier || v.purchaseRecord?.supplierName || 'N/A'}</div>
                              <div><strong>Invoice No:</strong> {v.purchaseRecord?.invoiceNumber || 'N/A'}</div>
                              <div><strong>Price Paid:</strong> ${v.purchaseRecord?.totalPrice || v.purchaseRecord?.price}</div>
                              <p className="text-muted">"{v.purchaseRecord?.description}"</p>
                            </div>
                          </div>
                        </div>

                        {/* Site Manager Receipt */}
                        <div className="compare-pane">
                          <div className="pane-title">Site Manager Receipt Verification</div>
                          <div className="evidence-block">
                            <img src={`http://localhost:5000${v.receivedVerification?.photo}`} className="evidence-img" />
                            <div className="evidence-details" style={{ marginTop: '10px' }}>
                              <div><strong>Received Date:</strong> {new Date(v.receivedVerification?.dateReceived || v.receivedVerification?.date).toLocaleDateString()}</div>
                              <p className="text-muted">"{v.receivedVerification?.description || 'Confirmed receipt'}"</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {v.matchStatus === 'Pending' && (
                        <div className="validation-actions">
                          <input type="text" className="form-input" placeholder="Admin verification notes..." value={validationNotes} onChange={(e) => setValidationNotes(e.target.value)} />
                          <div className="btn-group">
                            <button className="btn btn-primary" onClick={() => handleValidateHandover(v._id, 'Confirmed')}>
                              Confirm Handover
                            </button>
                            <button className="btn btn-danger" onClick={() => handleValidateHandover(v._id, 'Discrepancy')}>
                              Flag Discrepancy
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* FINAL REPAIR APPROVAL TAB */}
          {activeTab === 'final-approval' && (
            <div className="final-approval-view animate-fade-in">
              {/* Search Section */}
              <div className="glass-card" style={{ padding: '16px', marginBottom: '20px' }}>
                <label className="form-label">Search by Machinery Name</label>
                <input type="text" className="form-input" placeholder="Search approvals..." value={searchApproval} onChange={(e) => setSearchApproval(e.target.value)} />
              </div>

              <div className="cases-list">
                {Object.keys(filteredApprovals).length === 0 ? (
                  <div className="glass-card text-center" style={{ padding: '40px' }}>No repairs found matching your search.</div>
                ) : (
                  Object.keys(filteredApprovals).map(caseId => {
                    const group = filteredApprovals[caseId];
                    const isReady = group.driverVer && group.siteManagerVer;
                    return (
                      <div key={caseId} className="case-item glass-card">
                        <div className="case-title-row">
                          <h4>Repair Case: {group.issueCase?.car?.name} ({group.issueCase?.car?.plateNumber})</h4>
                          <span className={`status-badge ${isReady ? 'active' : 'underrepair'}`}>
                            {isReady ? 'Ready for Final Sign-off' : 'Awaiting Both Verifications'}
                          </span>
                        </div>

                        <div className="case-reports-compare">
                          {/* Driver Final Verification */}
                          <div className="compare-pane">
                            <div className="pane-title">Driver Final Verification</div>
                            {group.driverVer ? (
                              <div className="evidence-block">
                                <img src={`http://localhost:5000${group.driverVer.photo}`} className="evidence-img" />
                                <div style={{ fontSize: '0.85rem', marginTop: '6px' }}>
                                  <strong>Date:</strong> {new Date(group.driverVer.date).toLocaleDateString()}
                                </div>
                                <p className="text-muted">"{group.driverVer.description}"</p>
                              </div>
                            ) : (
                              <div className="empty-evidence error">⚠️ DRIVER VERIFICATION PENDING</div>
                            )}
                          </div>

                          {/* Site Manager Final Verification */}
                          <div className="compare-pane">
                            <div className="pane-title">Site Manager Final Verification</div>
                            {group.siteManagerVer ? (
                              <div className="evidence-block">
                                <img src={`http://localhost:5000${group.siteManagerVer.photo}`} className="evidence-img" />
                                <div style={{ fontSize: '0.85rem', marginTop: '6px' }}>
                                  <strong>Date:</strong> {new Date(group.siteManagerVer.date).toLocaleDateString()}
                                </div>
                                <p className="text-muted">"{group.siteManagerVer.description}"</p>
                              </div>
                            ) : (
                              <div className="empty-evidence error">⚠️ SITE MANAGER VERIFICATION PENDING</div>
                            )}
                          </div>
                        </div>

                        {isReady && (
                          <div className="validation-actions" style={{ alignItems: 'flex-end' }}>
                            <button 
                              className="btn btn-primary" 
                              onClick={() => handleOpenApproveModal(caseId, group.sparePartRequest, group.driverVer?.purchaseRecord)}
                            >
                              Approve Final Repair & Archive
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Final Repair Approval Modal */}
              {showApprovalModal && (
                <div className="modal-overlay">
                  <form onSubmit={handleApproveSubmit} className="glass-card modal-content">
                    <div className="modal-header">
                      <h3>Final Repair Sign-Off</h3>
                      <button type="button" className="btn-close" onClick={() => setShowApprovalModal(false)}>×</button>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Old Part Serial Number</label>
                      <input type="text" className="form-input" required value={approveForm.oldPartSerialNumber} onChange={(e) => setApproveForm({ ...approveForm, oldPartSerialNumber: e.target.value })} placeholder="e.g. PN-99482-A" />
                    </div>

                    <div className="form-group">
                      <label className="form-label">New Part Serial Number</label>
                      <input type="text" className="form-input" required value={approveForm.newPartSerialNumber} onChange={(e) => setApproveForm({ ...approveForm, newPartSerialNumber: e.target.value })} placeholder="e.g. PN-99482-A-NEW" />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Installed By (Technician Name)</label>
                      <input type="text" className="form-input" required value={approveForm.installedBy} onChange={(e) => setApproveForm({ ...approveForm, installedBy: e.target.value })} />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Maintenance Cost ($)</label>
                      <input type="number" className="form-input" required value={approveForm.maintenanceCost} onChange={(e) => setApproveForm({ ...approveForm, maintenanceCost: parseFloat(e.target.value) || 0 })} />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Final Notes / Description</label>
                      <textarea className="form-input" required rows="3" value={approveForm.description} onChange={(e) => setApproveForm({ ...approveForm, description: e.target.value })}></textarea>
                    </div>

                    <button type="submit" className="btn btn-primary">Submit Final Approval</button>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* REPORTS & AUDIT TAB */}
          {activeTab === 'reports' && (() => {
            const filteredHistory = carHistory.filter(h => {
              if (filterMachine && h.car?._id !== filterMachine) return false;
              if (filterEventType && h.eventType !== filterEventType) return false;
              if (filterDriver) {
                const driverId = h.driverReport?.reportedBy || h.driverVerification?.submitter;
                if (driverId !== filterDriver) return false;
              }
              if (filterSiteManager) {
                const siteMgrId = h.siteManagerReport?.reportedBy || h.siteManagerVerification?.submitter;
                if (siteMgrId !== filterSiteManager) return false;
              }
              if (filterAccountant && h.purchaseReport?.accountant !== filterAccountant) return false;
              if (filterSupplier && h.purchaseReport?.supplier && !h.purchaseReport.supplier.toLowerCase().includes(filterSupplier.toLowerCase())) return false;
              if (filterStartDate && new Date(h.createdAt) < new Date(filterStartDate)) return false;
              if (filterEndDate) {
                const end = new Date(filterEndDate);
                end.setHours(23, 59, 59, 999);
                if (new Date(h.createdAt) > end) return false;
              }
              return true;
            });

            const totalCost = filteredHistory.reduce((sum, h) => sum + (h.maintenanceCost || 0), 0);
            const avgCost = filteredHistory.length > 0 ? (totalCost / filteredHistory.length) : 0;
            const partsReplaced = filteredHistory.filter(h => h.eventType === 'SparePartReplacement').length;

            return (
              <div className="reports-view animate-fade-in">
                {/* Metrics Cards */}
                <div className="stats-cards">
                  <div className="glass-card stat-card">
                    <div className="stat-info">
                      <span className="stat-label">Total Maintenance Cycles</span>
                      <h3 className="stat-value">{filteredHistory.length}</h3>
                    </div>
                    <div className="stat-sub">
                      <span>Completed and permanently archived</span>
                    </div>
                  </div>
                  <div className="glass-card stat-card">
                    <div className="stat-info">
                      <span className="stat-label">Total Expenditure (Birr)</span>
                      <h3 className="stat-value">{totalCost.toLocaleString()}</h3>
                    </div>
                    <div className="stat-sub">
                      <span>Across filtered maintenance records</span>
                    </div>
                  </div>
                  <div className="glass-card stat-card">
                    <div className="stat-info">
                      <span className="stat-label">Average Cycle Cost</span>
                      <h3 className="stat-value">{avgCost.toLocaleString(undefined, { maximumFractionDigits: 2 })}</h3>
                    </div>
                    <div className="stat-sub">
                      <span>Average cost per repair cycle</span>
                    </div>
                  </div>
                  <div className="glass-card stat-card">
                    <div className="stat-info">
                      <span className="stat-label">Spare Parts Replaced</span>
                      <h3 className="stat-value">{partsReplaced}</h3>
                    </div>
                    <div className="stat-sub">
                      <span>Total procurement items tracked</span>
                    </div>
                  </div>
                </div>

                {/* Filters Panel */}
                <div className="glass-card table-section" style={{ marginBottom: '24px' }}>
                  <div className="table-header">
                    <h3>Search & Audit Filters</h3>
                  </div>
                  <div className="filters-grid">
                    <div className="form-group">
                      <label className="form-label">Machinery</label>
                      <select className="form-input" value={filterMachine} onChange={(e) => setFilterMachine(e.target.value)}>
                        <option value="">-- All Machinery --</option>
                        {cars.map(c => <option key={c._id} value={c._id}>{c.name} ({c.plateNumber})</option>)}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Event Type</label>
                      <select className="form-input" value={filterEventType} onChange={(e) => setFilterEventType(e.target.value)}>
                        <option value="">-- All Events --</option>
                        <option value="SparePartReplacement">Spare Part Replacement</option>
                        <option value="StatusChange">Status Change</option>
                        <option value="DriverAssignment">Driver Assignment</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Driver</label>
                      <select className="form-input" value={filterDriver} onChange={(e) => setFilterDriver(e.target.value)}>
                        <option value="">-- All Drivers --</option>
                        {users.filter(u => u.role === 'Driver').map(u => <option key={u._id} value={u._id}>{u.fullName || u.username}</option>)}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Site Manager</label>
                      <select className="form-input" value={filterSiteManager} onChange={(e) => setFilterSiteManager(e.target.value)}>
                        <option value="">-- All Site Managers --</option>
                        {users.filter(u => u.role === 'SiteManager').map(u => <option key={u._id} value={u._id}>{u.fullName || u.username}</option>)}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Accountant</label>
                      <select className="form-input" value={filterAccountant} onChange={(e) => setFilterAccountant(e.target.value)}>
                        <option value="">-- All Accountants --</option>
                        {users.filter(u => u.role === 'Accountant').map(u => <option key={u._id} value={u._id}>{u.fullName || u.username}</option>)}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Supplier / Vendor</label>
                      <input type="text" className="form-input" placeholder="Search supplier..." value={filterSupplier} onChange={(e) => setFilterSupplier(e.target.value)} />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Start Date</label>
                      <input type="date" className="form-input" value={filterStartDate} onChange={(e) => setFilterStartDate(e.target.value)} />
                    </div>

                    <div className="form-group">
                      <label className="form-label">End Date</label>
                      <input type="date" className="form-input" value={filterEndDate} onChange={(e) => setFilterEndDate(e.target.value)} />
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => {
                      setFilterMachine('');
                      setFilterEventType('');
                      setFilterDriver('');
                      setFilterSiteManager('');
                      setFilterAccountant('');
                      setFilterSupplier('');
                      setFilterStartDate('');
                      setFilterEndDate('');
                    }}>
                      Reset Filters
                    </button>
                  </div>
                </div>

                {/* Logs Table */}
                <div className="glass-card table-section">
                  <div className="table-header">
                    <h3>Permanent Maintenance Ledger</h3>
                  </div>
                  <div className="table-wrapper">
                    <table>
                      <thead>
                        <tr>
                          <th>Completion Date</th>
                          <th>Machinery</th>
                          <th>Event Type</th>
                          <th>Part Replaced</th>
                          <th>Cost (Birr)</th>
                          <th>Operator / Driver</th>
                          <th>Sign-off Admin</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredHistory.length === 0 ? (
                          <tr><td colSpan="8" className="text-center">No audit records found matching the filters.</td></tr>
                        ) : (
                          filteredHistory.map((h) => (
                            <tr key={h._id}>
                              <td>{new Date(h.createdAt).toLocaleDateString()}</td>
                              <td><strong>{h.car?.name}</strong> ({h.car?.plateNumber})</td>
                              <td><span className="badge badge-success">{h.eventType}</span></td>
                              <td>{h.newPartName || 'N/A'}</td>
                              <td><strong>{h.maintenanceCost.toLocaleString()} Birr</strong></td>
                              <td>{h.driverReport?.reportedBy?.fullName || h.driverReport?.reportedBy?.username || 'N/A'}</td>
                              <td>{h.createdBy?.fullName || h.createdBy?.username}</td>
                              <td>
                                <button className="btn btn-secondary btn-sm" onClick={() => setSelectedHistoryDetail(h)}>
                                  View Audit File
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Audit detail Modal */}
                {selectedHistoryDetail && (
                  <div className="modal-overlay">
                    <div className="glass-card modal-content wide">
                      <div className="modal-header">
                        <h3>Maintenance Cycle Audit Ledger</h3>
                        <button type="button" className="btn-close" onClick={() => setSelectedHistoryDetail(null)}>×</button>
                      </div>

                      <div className="audit-summary-section">
                        <div className="audit-sum-grid">
                          <div>
                            <span className="sum-label">Machinery:</span>
                            <span className="sum-value">{selectedHistoryDetail.car?.name} ({selectedHistoryDetail.car?.plateNumber})</span>
                          </div>
                          <div>
                            <span className="sum-label">Audit Timestamp:</span>
                            <span className="sum-value">{new Date(selectedHistoryDetail.createdAt).toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="sum-label">Sign-off Admin:</span>
                            <span className="sum-value">{selectedHistoryDetail.createdBy?.fullName || selectedHistoryDetail.createdBy?.username}</span>
                          </div>
                          <div>
                            <span className="sum-label">Total expenditure:</span>
                            <span className="sum-value highlighted">{selectedHistoryDetail.maintenanceCost.toLocaleString()} Birr</span>
                          </div>
                        </div>
                      </div>

                      <div className="audit-flex-row">
                        {/* Column 1: Issue reports */}
                        <div className="audit-column">
                          <h4 className="column-title">1. Initial Issue Reports</h4>
                          <div className="glass-card inner-card">
                            <h5 className="inner-card-title">Driver Report</h5>
                            {selectedHistoryDetail.driverReport ? (
                              <div className="report-detail-item">
                                <p><strong>Category:</strong> {selectedHistoryDetail.driverReport.issueCategory || 'General'}</p>
                                <p className="notes-block">"{selectedHistoryDetail.driverReport.description}"</p>
                                {selectedHistoryDetail.driverReport.photo && (
                                  <img src={`http://localhost:5000${selectedHistoryDetail.driverReport.photo}`} className="evidence-thumb" alt="Driver reported photo" />
                                )}
                              </div>
                            ) : <p className="text-muted">No Driver report recorded.</p>}

                            <h5 className="inner-card-title" style={{ marginTop: '16px' }}>Site Manager Report</h5>
                            {selectedHistoryDetail.siteManagerReport ? (
                              <div className="report-detail-item">
                                <p><strong>Category:</strong> {selectedHistoryDetail.siteManagerReport.issueCategory || 'General'}</p>
                                <p className="notes-block">"{selectedHistoryDetail.siteManagerReport.description}"</p>
                                {selectedHistoryDetail.siteManagerReport.photo && (
                                  <img src={`http://localhost:5000${selectedHistoryDetail.siteManagerReport.photo}`} className="evidence-thumb" alt="Site Manager reported photo" />
                                )}
                              </div>
                            ) : <p className="text-muted">No Site Manager report recorded.</p>}
                          </div>
                        </div>

                        {/* Column 2: Procurement & installation */}
                        <div className="audit-column">
                          <h4 className="column-title">2. Procurement & Installation</h4>
                          <div className="glass-card inner-card">
                            <div className="report-detail-item">
                              <p><strong>Part Name:</strong> {selectedHistoryDetail.newPartName}</p>
                              <p><strong>Removed Serial No:</strong> <code>{selectedHistoryDetail.oldPartSerialNumber || 'N/A'}</code></p>
                              <p><strong>Installed Serial No:</strong> <code>{selectedHistoryDetail.newPartSerialNumber || 'N/A'}</code></p>
                              <p><strong>Installed By:</strong> {selectedHistoryDetail.installedBy}</p>
                              <p><strong>Supplier:</strong> {selectedHistoryDetail.purchaseReport?.supplier || selectedHistoryDetail.purchaseReport?.supplierName || 'N/A'}</p>
                              <p><strong>Invoice Number:</strong> <code>{selectedHistoryDetail.purchaseReport?.invoiceNumber || 'N/A'}</code></p>
                              
                              {selectedHistoryDetail.purchaseReport && (
                                <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                                  {selectedHistoryDetail.purchaseReport.purchasePhoto && (
                                    <div>
                                      <span className="evidence-lbl">Purchase Photo</span>
                                      <img src={`http://localhost:5000${selectedHistoryDetail.purchaseReport.purchasePhoto}`} className="evidence-thumb" alt="Purchase record invoice scan" />
                                    </div>
                                  )}
                                  {selectedHistoryDetail.purchaseReport.receiptPhoto && (
                                    <div>
                                      <span className="evidence-lbl">Receipt Photo</span>
                                      <img src={`http://localhost:5000${selectedHistoryDetail.purchaseReport.receiptPhoto}`} className="evidence-thumb" alt="Receipt photo" />
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Column 3: Final verifications */}
                        <div className="audit-column">
                          <h4 className="column-title">3. Post-Repair Verifications</h4>
                          <div className="glass-card inner-card">
                            <h5 className="inner-card-title">Driver Verification</h5>
                            {selectedHistoryDetail.driverVerification ? (
                              <div className="report-detail-item">
                                <p className="notes-block">"{selectedHistoryDetail.driverVerification.description}"</p>
                                {selectedHistoryDetail.driverVerification.photo && (
                                  <img src={`http://localhost:5000${selectedHistoryDetail.driverVerification.photo}`} className="evidence-thumb" alt="Driver final verification photo" />
                                )}
                              </div>
                            ) : <p className="text-muted">Awaiting Driver verification.</p>}

                            <h5 className="inner-card-title" style={{ marginTop: '16px' }}>Site Manager Verification</h5>
                            {selectedHistoryDetail.siteManagerVerification ? (
                              <div className="report-detail-item">
                                <p className="notes-block">"{selectedHistoryDetail.siteManagerVerification.description}"</p>
                                {selectedHistoryDetail.siteManagerVerification.photo && (
                                  <img src={`http://localhost:5000${selectedHistoryDetail.siteManagerVerification.photo}`} className="evidence-thumb" alt="Site Manager final verification photo" />
                                )}
                              </div>
                            ) : <p className="text-muted">Awaiting Site Manager verification.</p>}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* Styled JSX (Global overrides for modular dashboard views) */}
      <style jsx>{`
        .tab-viewport {
          width: 100%;
        }

        .stats-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
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

        .table-section {
          padding: 24px;
        }

        .table-header {
          margin-bottom: 20px;
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
        }

        td {
          padding: 16px;
          font-size: 0.9rem;
          border-bottom: 1px solid hsl(var(--border));
        }

        tr:hover td {
          background: rgba(255, 255, 255, 0.01);
        }

        .badge {
          display: inline-block;
          font-size: 0.75rem;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 20px;
          text-transform: uppercase;
        }

        .badge-success { background: rgba(16, 185, 129, 0.1); color: #10b981; }
        .badge.driver { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
        .badge.sitemanager { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
        .badge.accountant { background: rgba(139, 92, 246, 0.1); color: #8b5cf6; }

        .view-actions {
          margin-bottom: 30px;
          display: flex;
          justify-content: flex-end;
        }

        .cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 24px;
        }

        .resource-card {
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .resource-photo {
          height: 180px;
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

        .resource-body {
          padding: 20px;
          display: flex;
          flex-direction: column;
          flex-grow: 1;
        }

        .resource-body h3 {
          font-size: 1.1rem;
          font-weight: 600;
          margin-bottom: 12px;
        }

        .resource-meta {
          font-size: 0.85rem;
          color: hsl(var(--muted-foreground));
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 20px;
          flex-grow: 1;
        }

        .resource-footer {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 8px;
        }

        /* Modals styling */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.75);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: flex-start;
          justify-content: center;
          z-index: 10000;
          padding: 40px 20px;
          overflow-y: auto;
        }

        .modal-content {
          width: 100%;
          max-width: 500px;
          padding: 30px;
          margin-top: 20px;
          margin-bottom: 40px;
        }

        .modal-content.wide {
          max-width: 800px;
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
        }

        .btn-close {
          background: none;
          border: none;
          color: hsl(var(--muted-foreground));
          font-size: 1.5rem;
          cursor: pointer;
        }

        .grid-split-2 {
          display: grid;
          grid-template-columns: 1fr 1.2fr;
          gap: 24px;
        }

        .inbox-pane {
          padding: 24px;
          height: calc(100vh - 150px);
          display: flex;
          flex-direction: column;
        }

        .pane-header {
          margin-bottom: 20px;
        }

        .reports-list, .cases-list {
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 15px;
          flex-grow: 1;
        }

        .report-list-item {
          display: flex;
          gap: 15px;
          padding: 15px;
        }

        .item-photo {
          width: 100px;
          height: 100px;
          border-radius: 8px;
          background-size: cover;
          background-position: center;
          flex-shrink: 0;
        }

        .item-details {
          display: flex;
          flex-direction: column;
          flex-grow: 1;
          gap: 6px;
        }

        .item-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .case-item {
          padding: 24px;
        }

        .case-title-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid hsl(var(--border));
          padding-bottom: 12px;
          margin-bottom: 20px;
        }

        .case-reports-compare {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 20px;
        }

        .compare-pane {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .pane-title {
          font-size: 0.8rem;
          font-weight: 600;
          color: hsl(var(--muted-foreground));
          text-transform: uppercase;
        }

        .evidence-block {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid hsl(var(--border));
          padding: 12px;
          border-radius: 8px;
        }

        .evidence-img {
          width: 100%;
          height: 120px;
          object-fit: cover;
          border-radius: 6px;
          margin-bottom: 8px;
        }

        .empty-evidence {
          height: 120px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px dashed hsl(var(--border));
          border-radius: 8px;
          font-size: 0.8rem;
          font-weight: 500;
        }

        .empty-evidence.error {
          border-color: rgba(239, 68, 68, 0.3);
          background: rgba(239, 68, 68, 0.02);
          color: #f87171;
        }

        .validation-actions {
          display: flex;
          flex-direction: column;
          gap: 12px;
          border-top: 1px solid hsl(var(--border));
          padding-top: 16px;
        }

        .history-timeline {
          max-height: 60vh;
          overflow-y: auto;
          padding-right: 10px;
        }

        .timeline-item {
          display: flex;
          gap: 20px;
          margin-bottom: 20px;
        }

        .timeline-date {
          font-size: 0.85rem;
          color: hsl(var(--muted-foreground));
          min-width: 80px;
          padding-top: 12px;
        }

        .part-change {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 10px 0;
          font-size: 0.95rem;
        }

        .removed-part { color: #f87171; text-decoration: line-through; }
        .installed-part { color: #34d399; font-weight: 600; }

        .history-photos {
          display: flex;
          gap: 10px;
          margin-top: 10px;
        }

        .evidence-thumb {
          width: 80px;
          height: 80px;
          object-fit: cover;
          border-radius: 4px;
          border: 1px solid hsl(var(--border));
        }

        /* Reports and analytics styling */
        .filters-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 16px;
        }

        .audit-summary-section {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid hsl(var(--border));
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 24px;
        }

        .audit-sum-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 20px;
        }

        .sum-label {
          display: block;
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: hsl(var(--muted-foreground));
          margin-bottom: 4px;
        }

        .sum-value {
          font-size: 1.05rem;
          font-weight: 600;
          color: #fff;
        }

        .sum-value.highlighted {
          color: hsl(var(--primary));
          font-size: 1.2rem;
          font-weight: 700;
        }

        .audit-flex-row {
          display: flex;
          gap: 24px;
          margin-top: 24px;
          align-items: stretch;
          flex-wrap: wrap;
        }

        .audit-column {
          flex: 1;
          min-width: 250px;
          display: flex;
          flex-direction: column;
        }

        .column-title {
          font-size: 0.95rem;
          font-weight: 600;
          margin-bottom: 12px;
          color: #fff;
          border-bottom: 2px solid rgba(255, 255, 255, 0.05);
          padding-bottom: 6px;
        }

        .inner-card {
          padding: 16px;
          flex-grow: 1;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .inner-card-title {
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: hsl(var(--muted-foreground));
          margin-bottom: 6px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          padding-bottom: 4px;
        }

        .report-detail-item p {
          font-size: 0.85rem;
          margin: 4px 0;
        }

        .notes-block {
          background: rgba(255, 255, 255, 0.02);
          border-left: 3px solid hsl(var(--primary));
          padding: 8px 12px;
          border-radius: 4px;
          font-style: italic;
          margin: 8px 0 !important;
        }

        .evidence-lbl {
          font-size: 0.7rem;
          display: block;
          color: hsl(var(--muted-foreground));
          margin-bottom: 4px;
        }

        @media (max-width: 768px) {
          .stats-cards, .cards-grid, .grid-split-2, .case-reports-compare { grid-template-columns: 1fr; gap: 14px; }
          .stat-card, .table-section, .case-item, .inbox-pane { padding: 16px; }
          .view-actions { justify-content: stretch; margin-bottom: 16px; }
          .view-actions .btn { width: 100%; }
          .resource-footer { grid-template-columns: 1fr; }
          .inbox-pane { height: auto; min-height: 360px; }
          .report-list-item, .timeline-item { gap: 12px; }
          .case-title-row, .item-meta { align-items: flex-start; flex-direction: column; gap: 8px; }
          .timeline-item { flex-direction: column; }
          .timeline-date { min-width: 0; padding-top: 0; }
          .history-photos { flex-wrap: wrap; }
          .filters-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </PortalShell>
  );
}
