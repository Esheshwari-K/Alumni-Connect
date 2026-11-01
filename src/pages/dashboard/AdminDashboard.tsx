import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useToast } from '../../context/ToastContext.tsx';
import { api } from '../../services/api.ts';
import { Modal } from '../../components/common/Modal.tsx';
import {
  Users,
  ShieldCheck,
  Briefcase,
  Calendar,
  CheckCircle2,
  XCircle,
  Database,
  Search,
  Check,
  X,
  AlertTriangle,
  Plus
} from 'lucide-react';

export function AdminDashboard() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [pendingVerifications, setPendingVerifications] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'verifications' | 'users'>('verifications');
  const [searchUser, setSearchUser] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Review modal state
  const [selectedAlumni, setSelectedAlumni] = useState<any>(null);
  const [reviewReason, setReviewReason] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Add Alumni modal state
  const [isAddAlumniOpen, setIsAddAlumniOpen] = useState(false);
  const [isCreatingAlumni, setIsCreatingAlumni] = useState(false);
  const [newAlumni, setNewAlumni] = useState({
    full_name: '',
    email: '',
    password: 'Alumni@123',
    graduation_year: '2022',
    department: 'School of Computer Science & Engineering',
    company: '',
    job_title: '',
    skills: '',
    bio: '',
    linkedin_url: ''
  });

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    setIsLoading(true);
    try {
      const [dashRes, usersRes, verRes] = await Promise.all([
        api.getAdminDashboard(),
        api.getAdminUsers(),
        api.getPendingAlumniVerifications()
      ]);
      setStats(dashRes);
      setUsers(usersRes.users || []);
      setPendingVerifications(verRes.pending_verifications || []);
    } catch (err: any) {
      showToast(err.message || 'Failed to load admin data', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReviewDecision = async (decision: 'verified' | 'rejected') => {
    if (!selectedAlumni) return;
    setIsSubmittingReview(true);
    try {
      await api.reviewAlumniVerification(selectedAlumni.user_id, decision, reviewReason);
      showToast(`Alumni verification ${decision} successfully`, 'success');
      setSelectedAlumni(null);
      setReviewReason('');
      loadAdminData();
    } catch (err: any) {
      showToast(err.message || 'Error updating verification status', 'error');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleToggleUserStatus = async (userId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      await api.updateUserStatus(userId, nextStatus);
      showToast(`User account status updated to ${nextStatus}`, 'success');
      loadAdminData();
    } catch (err: any) {
      showToast(err.message || 'Failed to update user', 'error');
    }
  };

  const handleCreateAlumni = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAlumni.full_name || !newAlumni.email || !newAlumni.company || !newAlumni.job_title) {
      showToast('Please fill all required fields', 'error');
      return;
    }
    setIsCreatingAlumni(true);
    try {
      await api.createAlumniByAdmin(newAlumni);
      showToast(`Alumni profile for ${newAlumni.full_name} created & verified! They can now log in with ${newAlumni.email}`, 'success');
      setIsAddAlumniOpen(false);
      setNewAlumni({
        full_name: '',
        email: '',
        password: 'Alumni@123',
        graduation_year: '2022',
        department: 'School of Computer Science & Engineering',
        company: '',
        job_title: '',
        skills: '',
        bio: '',
        linkedin_url: ''
      });
      loadAdminData();
    } catch (err: any) {
      showToast(err.message || 'Failed to create alumni account', 'error');
    } finally {
      setIsCreatingAlumni(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const s = searchUser.toLowerCase();
    return (
      u.full_name?.toLowerCase().includes(s) ||
      u.email?.toLowerCase().includes(s) ||
      u.role?.toLowerCase().includes(s) ||
      u.company?.toLowerCase().includes(s)
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Admin Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#D6AA61] uppercase tracking-wider mb-1">
            <span>Administration Console</span>
            <span>·</span>
            <span>RV University Bengaluru</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#172338] tracking-tight">
            Alumni Relations Governance
          </h1>
          <p className="text-sm text-[#718096] mt-1">
            Supervise alumni verification credentials, student accounts, and university opportunities.
          </p>
        </div>

        {/* Database Engine Tag */}
        <div className="bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl flex items-center gap-3">
          <Database className="w-5 h-5 text-[#D6AA61] shrink-0" />
          <div>
            <p className="text-[11px] font-semibold text-[#172338]">Storage Backend</p>
            <p className="text-xs text-[#718096] font-medium">
              {stats?.database_type || 'PostgreSQL Integration'}
            </p>
          </div>
        </div>
      </div>

      {/* Real Statistics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-xs text-[#718096] font-medium">Total Users</p>
          <p className="text-xl font-bold text-[#172338] mt-1 tabular-nums">{stats?.total_users ?? 0}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-xs text-[#718096] font-medium">Students</p>
          <p className="text-xl font-bold text-[#172338] mt-1 tabular-nums">{stats?.students ?? 0}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-xs text-[#718096] font-medium">Total Alumni</p>
          <p className="text-xl font-bold text-[#172338] mt-1 tabular-nums">{stats?.alumni ?? 0}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-xs text-[#718096] font-medium">Verified Alumni</p>
          <p className="text-xl font-bold text-emerald-700 mt-1 tabular-nums">{stats?.verified_alumni ?? 0}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-xs text-[#718096] font-medium">Pending Verifications</p>
          <p className="text-xl font-bold text-amber-600 mt-1 tabular-nums">{stats?.pending_verifications ?? 0}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-xs text-[#718096] font-medium">Active Opportunities</p>
          <p className="text-xl font-bold text-[#D6AA61] mt-1 tabular-nums">{stats?.active_opportunities ?? 0}</p>
        </div>
      </div>

      {/* Main Tabs: Verification Queue vs User Management */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 px-6 pt-4 gap-4">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab('verifications')}
              className={`pb-3 text-sm font-semibold transition-colors flex items-center gap-2 ${
                activeTab === 'verifications'
                  ? 'border-b-2 border-[#D6AA61] text-[#172338]'
                  : 'text-[#718096] hover:text-[#172338]'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              Verification Queue
              {pendingVerifications.length > 0 && (
                <span className="bg-amber-100 text-amber-800 text-[11px] font-bold px-2 py-0.5 rounded-full tabular-nums">
                  {pendingVerifications.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('users')}
              className={`pb-3 text-sm font-semibold transition-colors flex items-center gap-2 ${
                activeTab === 'users'
                  ? 'border-b-2 border-[#D6AA61] text-[#172338]'
                  : 'text-[#718096] hover:text-[#172338]'
              }`}
            >
              <Users className="w-4 h-4" />
              User Management ({users.length})
            </button>
          </div>

          <button
            onClick={() => setIsAddAlumniOpen(true)}
            className="mb-2 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#D6AA61] hover:bg-[#C19349] rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Alumni Profile
          </button>
        </div>

        {/* Tab 1: Verification Queue */}
        {activeTab === 'verifications' && (
          <div className="p-6">
            <div className="mb-4">
              <h3 className="text-base font-bold text-[#172338]">Pending Alumni Verifications</h3>
              <p className="text-xs text-[#718096]">
                Validate university graduation credentials before awarding the official verified alumni status
              </p>
            </div>

            {pendingVerifications.length > 0 ? (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                {pendingVerifications.map((alumni) => (
                  <div key={alumni.id} className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-[#172338]">{alumni.full_name}</h4>
                        <span className="text-xs text-slate-400">({alumni.email})</span>
                      </div>
                      <p className="text-xs text-[#718096] mt-0.5">
                        {alumni.job_title} at <span className="font-semibold text-slate-800">{alumni.company}</span>
                        {' · '}Graduation: <span className="tabular-nums font-semibold">{alumni.graduation_year || 'N/A'}</span>
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Department: {alumni.department || 'School of Computer Science & Engineering'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => {
                          setSelectedAlumni(alumni);
                          setReviewReason('Verified against RV University Alumni Registry.');
                        }}
                        className="px-3.5 py-1.5 text-xs font-semibold bg-[#D6AA61] hover:bg-[#C19349] text-white rounded-lg transition-colors flex items-center gap-1 shadow-2xs"
                      >
                        <Check className="w-3.5 h-3.5" /> Review / Verify
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="font-semibold text-slate-700">Verification Queue Clear</p>
                <p className="text-slate-500 mt-0.5">All registered alumni mentors have been processed.</p>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: User Management */}
        {activeTab === 'users' && (
          <div className="p-6 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-[#172338]">Platform Accounts</h3>
                <p className="text-xs text-[#718096]">Search and manage permissions for all students, alumni, and administrators</p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter users..."
                  value={searchUser}
                  onChange={(e) => setSearchUser(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#D6AA61]"
                />
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs text-[#172338]">
                <thead className="bg-slate-50 border-b border-slate-200 text-[#718096] uppercase text-[10px] tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Details</th>
                    <th className="py-3 px-4">Account Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-semibold">
                        <div>{u.full_name}</div>
                        <div className="text-[11px] text-[#718096] font-normal">{u.email}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold capitalize ${
                          u.role === 'admin'
                            ? 'bg-purple-50 text-purple-700'
                            : u.role === 'alumni'
                            ? 'bg-amber-50 text-amber-800'
                            : 'bg-blue-50 text-blue-700'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[#718096]">
                        {u.role === 'alumni' && (
                          <span>{u.job_title} at {u.company}</span>
                        )}
                        {u.role === 'student' && (
                          <span>{u.programme} · USN: {u.usn || 'N/A'}</span>
                        )}
                        {u.role === 'admin' && (
                          <span>Alumni Relations Officer</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
                          u.account_status === 'active' ? 'text-emerald-700' : 'text-rose-700'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${u.account_status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          <span className="capitalize">{u.account_status}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {u.id !== user?.id && (
                          <button
                            onClick={() => handleToggleUserStatus(u.id, u.account_status)}
                            className={`text-[11px] font-semibold px-2.5 py-1 rounded border transition-colors ${
                              u.account_status === 'active'
                                ? 'text-rose-600 border-rose-200 hover:bg-rose-50'
                                : 'text-emerald-700 border-emerald-200 hover:bg-emerald-50'
                            }`}
                          >
                            {u.account_status === 'active' ? 'Suspend' : 'Activate'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {selectedAlumni && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedAlumni(null)}
          title={`Review Alumni: ${selectedAlumni.full_name}`}
          subtitle={`RV University Graduation: ${selectedAlumni.graduation_year || 'N/A'}`}
        >
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1.5">
              <p><strong>Company & Role:</strong> {selectedAlumni.job_title} at {selectedAlumni.company}</p>
              <p><strong>Department:</strong> {selectedAlumni.department}</p>
              <p><strong>Email:</strong> {selectedAlumni.email}</p>
              {selectedAlumni.bio && <p className="text-slate-600 mt-1"><strong>Bio:</strong> {selectedAlumni.bio}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#172338] mb-1">
                Verification Notes / Audit Reason
              </label>
              <textarea
                rows={3}
                value={reviewReason}
                onChange={(e) => setReviewReason(e.target.value)}
                placeholder="e.g. Verified with RVU Registrar degree ledger"
                className="w-full p-2.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#D6AA61]"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleReviewDecision('rejected')}
                disabled={isSubmittingReview}
                className="px-4 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors"
              >
                Reject Verification
              </button>
              <button
                type="button"
                onClick={() => handleReviewDecision('verified')}
                disabled={isSubmittingReview}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#D6AA61] hover:bg-[#C19349] rounded-lg transition-colors shadow-2xs"
              >
                Approve & Verify Alumni
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add Alumni Profile Modal (Admin Creation & Direct Verification) */}
      {isAddAlumniOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsAddAlumniOpen(false)}
          title="Add Verified Alumni Profile"
          subtitle="Directly provision an alumni mentor account with pre-verified status"
          maxWidth="max-w-2xl"
        >
          <form onSubmit={handleCreateAlumni} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#172338] mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Varun Hegde"
                  value={newAlumni.full_name}
                  onChange={(e) => setNewAlumni({ ...newAlumni, full_name: e.target.value })}
                  className="w-full p-2.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#D6AA61]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#172338] mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. varun@alumni.rvu.edu.in"
                  value={newAlumni.email}
                  onChange={(e) => setNewAlumni({ ...newAlumni, email: e.target.value })}
                  className="w-full p-2.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#D6AA61]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#172338] mb-1">
                  Initial Password
                </label>
                <input
                  type="text"
                  required
                  value={newAlumni.password}
                  onChange={(e) => setNewAlumni({ ...newAlumni, password: e.target.value })}
                  className="w-full p-2.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#D6AA61]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#172338] mb-1">
                  Graduation Year *
                </label>
                <select
                  value={newAlumni.graduation_year}
                  onChange={(e) => setNewAlumni({ ...newAlumni, graduation_year: e.target.value })}
                  className="w-full p-2.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#D6AA61] bg-white"
                >
                  {Array.from({ length: 15 }, (_, i) => 2026 - i).map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#172338] mb-1">
                  Current Company / Org *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Amazon, Oracle, Razorpay"
                  value={newAlumni.company}
                  onChange={(e) => setNewAlumni({ ...newAlumni, company: e.target.value })}
                  className="w-full p-2.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#D6AA61]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#172338] mb-1">
                  Current Job Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Senior Software Engineer"
                  value={newAlumni.job_title}
                  onChange={(e) => setNewAlumni({ ...newAlumni, job_title: e.target.value })}
                  className="w-full p-2.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#D6AA61]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#172338] mb-1">
                School / Department *
              </label>
              <select
                value={newAlumni.department}
                onChange={(e) => setNewAlumni({ ...newAlumni, department: e.target.value })}
                className="w-full p-2.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#D6AA61] bg-white"
              >
                <option value="School of Computer Science & Engineering">School of Computer Science & Engineering</option>
                <option value="School of Business">School of Business</option>
                <option value="School of Economics and Finance">School of Economics and Finance</option>
                <option value="School of Liberal Arts & Sciences">School of Liberal Arts & Sciences</option>
                <option value="School of Design & Innovation">School of Design & Innovation</option>
                <option value="School of Law">School of Law</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#172338] mb-1">
                Professional Skills (comma separated)
              </label>
              <input
                type="text"
                placeholder="e.g. Cloud Architecture, Distributed Systems, Python"
                value={newAlumni.skills}
                onChange={(e) => setNewAlumni({ ...newAlumni, skills: e.target.value })}
                className="w-full p-2.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#D6AA61]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#172338] mb-1">
                Mentorship Biography
              </label>
              <textarea
                rows={3}
                placeholder="Background, achievements, and mentoring guidance focus..."
                value={newAlumni.bio}
                onChange={(e) => setNewAlumni({ ...newAlumni, bio: e.target.value })}
                className="w-full p-2.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#D6AA61]"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsAddAlumniOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isCreatingAlumni}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#D6AA61] hover:bg-[#C19349] rounded-lg transition-colors shadow-2xs disabled:opacity-60 cursor-pointer"
              >
                {isCreatingAlumni ? 'Creating...' : 'Create & Verify Alumni Profile'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
