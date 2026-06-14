import React, { useState, useEffect, useMemo } from 'react'
import { adminApi } from '../../api/endpoints'
import toast from 'react-hot-toast'
import { Plus, Edit, Trash2, Shield, ShieldAlert, Check, X, Lock, Mail, User, ShieldCheck, LockKeyhole, CheckSquare, Square, AlertTriangle, Info } from 'lucide-react'
import './Admins.css'
import { useAuth } from '../../contexts/AuthContext'
import { useI18n } from '../../contexts/I18nContext'
import Pagination from '../../components/Pagination'

export default function Admins() {
  const { user: currentUser } = useAuth()
  const { t } = useI18n()
  const [activeTab, setActiveTab] = useState('admins') // 'admins' or 'roles'
  const [loading, setLoading] = useState(false)
  const [adminPage, setAdminPage] = useState(1)
  const PAGE_SIZE = 15

  // Data States
  const [admins, setAdmins] = useState([])
  const [roles, setRoles] = useState([])
  const [permissions, setPermissions] = useState({ flat: [], categorized: {} })

  // Modals States
  const [adminModalOpen, setAdminModalOpen] = useState(false)
  const [roleModalOpen, setRoleModalOpen] = useState(false)
  const [editingAdmin, setEditingAdmin] = useState(null)
  const [editingRole, setEditingRole] = useState(null)

  // Form States - Admin
  const [adminForm, setAdminForm] = useState({
    name: '',
    email: '',
    password: '',
    is_active: true,
    roles: [],
    permissions: []
  })

  // Form States - Role
  const [roleForm, setRoleForm] = useState({
    name: '',
    permissions: []
  })

  const systemRoles = [
    'Super Admin',
    'Finance Manager',
    'Ad Ops Manager',
    'Support Agent',
    'Content Manager'
  ]

  // Primary administrator details
  const primaryAdmin = useMemo(() => {
    if (admins.length === 0) return null
    // Earliest created admin user in list is primary
    return [...admins].sort((a, b) => new Date(a.created_at) - new Date(b.created_at))[0]
  }, [admins])

  // Fetch all initial data
  const fetchData = async () => {
    setLoading(true)
    try {
      const [adminsRes, rolesRes, permRes] = await Promise.all([
        adminApi.getAdmins(),
        adminApi.getRoles(),
        adminApi.getPermissions()
      ])
      setAdmins(adminsRes.data)
      setRoles(rolesRes.data)
      setPermissions(permRes.data)
    } catch (err) {
      toast.error(t('admin.admins.toast.load_failed', 'Failed to load administrator data.'))
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Calculate inherited permissions based on selected roles
  const inheritedPermissions = useMemo(() => {
    const inherited = new Set()
    adminForm.roles.forEach(roleName => {
      const roleObj = roles.find(r => r.name === roleName)
      if (roleObj && roleObj.permissions) {
        roleObj.permissions.forEach(p => inherited.add(p.name))
      }
    })
    return inherited
  }, [adminForm.roles, roles])

  // Reset Admin Form
  const openAddAdminModal = () => {
    setEditingAdmin(null)
    setAdminForm({
      name: '',
      email: '',
      password: '',
      is_active: true,
      roles: [],
      permissions: []
    })
    setAdminModalOpen(true)
  }

  // Edit Admin Form Initialization
  const openEditAdminModal = (admin) => {
    setEditingAdmin(admin)
    setAdminForm({
      name: admin.name,
      email: admin.email,
      password: '', // blank by default when editing
      is_active: admin.is_active,
      roles: admin.roles ? admin.roles.map(r => r.name) : [],
      permissions: admin.permissions ? admin.permissions.map(p => p.name) : []
    })
    setAdminModalOpen(true)
  }

  // Reset Role Form
  const openAddRoleModal = () => {
    setEditingRole(null)
    setRoleForm({
      name: '',
      permissions: []
    })
    setRoleModalOpen(true)
  }

  // Edit Role Form Initialization
  const openEditRoleModal = (role) => {
    setEditingRole(role)
    setRoleForm({
      name: role.name,
      permissions: role.permissions ? role.permissions.map(p => p.name) : []
    })
    setRoleModalOpen(true)
  }

  // Handle Admin Submit
  const handleAdminSubmit = async (e) => {
    e.preventDefault()
    
    // Validate password for new admins
    if (!editingAdmin && !adminForm.password) {
      toast.error(t('admin.admins.toast.password_required', 'Password is required for new administrators.'))
      return
    }

    try {
      const submitData = { ...adminForm }
      if (editingAdmin && !submitData.password) {
        delete submitData.password // don't send blank password
      }

      if (editingAdmin) {
        await adminApi.updateAdmin(editingAdmin.id, submitData)
        toast.success(t('admin.admins.toast.admin_updated', 'Administrator updated successfully.'))
      } else {
        await adminApi.createAdmin(submitData)
        toast.success(t('admin.admins.toast.admin_created', 'Administrator created successfully.'))
      }
      setAdminModalOpen(false)
      fetchData()
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'An error occurred.'
      toast.error(errorMsg)
    }
  }

  // Handle Role Submit
  const handleRoleSubmit = async (e) => {
    e.preventDefault()
    if (!roleForm.name.trim()) {
      toast.error(t('admin.admins.toast.role_name_required', 'Role name is required.'))
      return
    }

    try {
      if (editingRole) {
        await adminApi.updateRole(editingRole.id, roleForm)
        toast.success(t('admin.admins.toast.role_updated', 'Role updated successfully.'))
      } else {
        await adminApi.createRole(roleForm)
        toast.success(t('admin.admins.toast.role_created', 'Role created successfully.'))
      }
      setRoleModalOpen(false)
      fetchData()
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'An error occurred.'
      toast.error(errorMsg)
    }
  }

  // Handle Admin Delete
  const handleAdminDelete = async (admin) => {
    if (admin.id === currentUser.id) {
      toast.error(t('admin.admins.toast.delete_self_failed', 'You cannot delete your own account.'))
      return
    }
    if (primaryAdmin && admin.id === primaryAdmin.id) {
      toast.error(t('admin.admins.toast.delete_primary_failed', 'The primary administrator account cannot be deleted.'))
      return
    }

    if (window.confirm(t('admin.admins.confirm_delete_admin', 'Are you sure you want to delete administrator "{name}"?', { name: admin.name }))) {
      try {
        await adminApi.deleteAdmin(admin.id)
        toast.success(t('admin.admins.toast.admin_deleted', 'Administrator deleted successfully.'))
        fetchData()
      } catch (err) {
        toast.error(err.response?.data?.message || t('admin.admins.toast.delete_admin_failed', 'Failed to delete administrator.'))
      }
    }
  }

  // Handle Role Delete
  const handleRoleDelete = async (role) => {
    if (systemRoles.includes(role.name)) {
      toast.error(t('admin.admins.toast.delete_system_role_failed', 'System default roles cannot be deleted.'))
      return
    }

    if (window.confirm(t('admin.admins.confirm_delete_role', 'Are you sure you want to delete the role "{name}"?', { name: role.name }))) {
      try {
        await adminApi.deleteRole(role.id)
        toast.success(t('admin.admins.toast.role_deleted', 'Role deleted successfully.'))
        fetchData()
      } catch (err) {
        toast.error(err.response?.data?.message || t('admin.admins.toast.delete_role_failed', 'Failed to delete role.'))
      }
    }
  }

  // Toggle Role Assignment on Admin Form
  const toggleRoleSelection = (roleName) => {
    setAdminForm(prev => {
      const exists = prev.roles.includes(roleName)
      const roles = exists ? prev.roles.filter(r => r !== roleName) : [...prev.roles, roleName]
      return { ...prev, roles }
    })
  }

  // Toggle Permission Assignment on Admin Form (Direct Overrides)
  const togglePermissionSelection = (permName) => {
    setAdminForm(prev => {
      const exists = prev.permissions.includes(permName)
      const permissions = exists ? prev.permissions.filter(p => p !== permName) : [...prev.permissions, permName]
      return { ...prev, permissions }
    })
  }

  // Toggle Permission Assignment on Role Form
  const toggleRolePermissionSelection = (permName) => {
    setRoleForm(prev => {
      const exists = prev.permissions.includes(permName)
      const permissions = exists ? prev.permissions.filter(p => p !== permName) : [...prev.permissions, permName]
      return { ...prev, permissions }
    })
  }

  return (
    <div className="admins-page">
      <div className="page-header" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--br-text)' }}>{t('admin.admins.title', 'Admin Control Panel')}</h1>
          <p style={{ fontSize: '13px', color: 'var(--color-text-subtle)' }}>{t('admin.admins.subtitle', 'Manage system administrators, custom roles, and fine-grained permissions.')}</p>
        </div>
        <div>
          {activeTab === 'admins' ? (
            <button className="btn btn-primary" onClick={openAddAdminModal}>
              <Plus size={16} /> {t('admin.admins.btn.add_admin', 'Add Administrator')}
            </button>
          ) : (
            <button className="btn btn-primary" onClick={openAddRoleModal}>
              <Plus size={16} /> {t('admin.admins.btn.create_role', 'Create Custom Role')}
            </button>
          )}
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="tabs-bar" style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--color-border)', marginBottom: '24px', paddingBottom: '1px' }}>
        <button 
          className={`tab-btn ${activeTab === 'admins' ? 'active' : ''}`}
          onClick={() => setActiveTab('admins')}
        >
          <User size={16} /> {t('admin.admins.tab.admins', 'Administrators')}
        </button>
        <button 
          className={`tab-btn ${activeTab === 'roles' ? 'active' : ''}`}
          onClick={() => setActiveTab('roles')}
        >
          <ShieldCheck size={16} /> {t('admin.admins.tab.roles', 'Roles & Permissions')}
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '48px', color: 'var(--color-text-subtle)' }}>
          {t('admin.admins.loading', 'Loading admin controls...')}
        </div>
      ) : (
        <>
          {/* ADMINISTRATORS LIST */}
          {activeTab === 'admins' && (
            <div className="card" style={{ padding: '0px', overflow: 'hidden' }}>
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>{t('admin.admins.table.col_admin', 'Administrator')}</th>
                      <th>{t('admin.admins.table.col_email', 'Email Address')}</th>
                      <th>{t('admin.admins.table.col_roles', 'Assigned Roles')}</th>
                      <th>{t('admin.admins.table.col_status', 'Status')}</th>
                      <th>{t('admin.admins.table.col_joined', 'Joined Date')}</th>
                      <th style={{ textAlign: 'right' }}>{t('admin.admins.table.col_actions', 'Actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {admins.slice((adminPage - 1) * PAGE_SIZE, adminPage * PAGE_SIZE).map(admin => {
                      const isPrimary = primaryAdmin && admin.id === primaryAdmin.id
                      const isSelf = admin.id === currentUser.id

                      return (
                        <tr key={admin.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div className="avatar" style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                background: isPrimary ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                color: '#fff'
                              }}>
                                {admin.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  {admin.name}
                                  {isPrimary && <span className="badge badge-warning" style={{ fontSize: '10px' }}>{t('admin.admins.badge.primary', 'Primary')}</span>}
                                  {isSelf && <span className="badge badge-info" style={{ fontSize: '10px' }}>{t('admin.admins.badge.you', 'You')}</span>}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td>{admin.email}</td>
                          <td>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                              {admin.roles && admin.roles.length > 0 ? (
                                admin.roles.map(r => (
                                  <span key={r.name} className="role-pill">
                                    {r.name}
                                  </span>
                                ))
                              ) : (
                                <span style={{ color: 'var(--color-text-subtle)', fontSize: '12px' }}>{t('admin.admins.no_role', 'No Role')}</span>
                              )}
                              {admin.permissions && admin.permissions.length > 0 && (
                                <span className="override-pill" title={t('admin.admins.overrides_title', '{count} direct overrides', { count: admin.permissions.length })}>
                                  {t('admin.admins.overrides_count', '+{count} overrides', { count: admin.permissions.length })}
                                </span>
                              )}
                            </div>
                          </td>
                          <td>
                            <span className={`badge ${admin.is_active ? 'badge-success' : 'badge-danger'}`}>
                              {admin.is_active ? t('admin.admins.badge.active', 'Active') : t('admin.admins.badge.suspended', 'Suspended')}
                            </span>
                          </td>
                          <td>{new Date(admin.created_at).toLocaleDateString()}</td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '8px' }}>
                              <button 
                                className="action-btn"
                                onClick={() => openEditAdminModal(admin)}
                                title={t('admin.admins.btn.edit_admin', 'Edit Admin')}
                              >
                                <Edit size={14} />
                              </button>
                              {!isPrimary && !isSelf && (
                                <button 
                                  className="action-btn delete"
                                  onClick={() => handleAdminDelete(admin)}
                                  title={t('admin.admins.btn.delete_admin', 'Delete Admin')}
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                <Pagination
                  currentPage={adminPage}
                  totalItems={admins.length}
                  pageSize={PAGE_SIZE}
                  onPageChange={setAdminPage}
                />
              </div>
            </div>
          )}

          {/* ROLES & PERMISSIONS */}
          {activeTab === 'roles' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
              {roles.map(role => {
                const isSystem = systemRoles.includes(role.name)

                return (
                  <div key={role.id} className="role-card card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div>
                        <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--br-text)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Shield size={18} style={{ color: isSystem ? 'var(--color-primary-light)' : '#a855f7' }} />
                          {role.name}
                        </h3>
                        {isSystem && <span style={{ fontSize: '10px', color: 'var(--color-text-subtle)', fontWeight: 'bold', textTransform: 'uppercase' }}>{t('admin.admins.badge.system_role', 'System Role')}</span>}
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          className="action-btn"
                          onClick={() => openEditRoleModal(role)}
                          title={t('admin.admins.btn.edit_role', 'Edit Role Permissions')}
                        >
                          <Edit size={14} />
                        </button>
                        {!isSystem && (
                          <button 
                            className="action-btn delete"
                            onClick={() => handleRoleDelete(role)}
                            title={t('admin.admins.btn.delete_role', 'Delete Role')}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                    <div style={{ flex: 1, minHeight: '80px', marginBottom: '12px' }}>
                      <p style={{ fontSize: '12px', color: 'var(--color-text-subtle)', marginBottom: '8px', fontWeight: 600 }}>{t('admin.admins.granted_permissions', 'Granted Permissions ({count}):', { count: role.permissions?.length || 0 })}</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {role.permissions && role.permissions.length > 0 ? (
                          role.permissions.map(p => (
                            <span key={p.name} className="permission-tag">
                              {p.name.replace('manage_', '')}
                            </span>
                          ))
                        ) : (
                          <span style={{ color: 'var(--color-text-subtle)', fontSize: '11px', fontStyle: 'italic' }}>{t('admin.admins.no_permissions', 'No permissions granted.')}</span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* ADMIN ADD/EDIT MODAL */}
      {adminModalOpen && (
        <div className="modal-backdrop">
          <div className="modal admin-modal" style={{ maxWidth: '800px', width: '90%' }}>
            <div className="modal-header">
              <h3>{editingAdmin ? t('admin.admins.modal.edit_admin_title', 'Edit Administrator') : t('admin.admins.modal.add_admin_title', 'Add New Administrator')}</h3>
              <button className="modal-close" onClick={() => setAdminModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAdminSubmit}>
              <div className="modal-body" style={{ maxHeight: 'calc(100vh - 250px)', overflowY: 'auto', paddingRight: '8px' }}>
                
                {/* Primary Admin Notice */}
                {editingAdmin && primaryAdmin && editingAdmin.id === primaryAdmin.id && (
                  <div style={{ display: 'flex', gap: '10px', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
                    <Info size={18} style={{ color: '#f59e0b', flexShrink: 0 }} />
                    <p style={{ fontSize: '12px', color: '#f59e0b', margin: 0 }}>
                      <strong>{t('admin.admins.modal.primary_lock_title', 'Primary Administrator Lock:')}</strong> {t('admin.admins.modal.primary_lock_desc', 'This account is the platform setup account. Deactivation is disabled, and it will always retain the Super Admin role with all permissions.')}
                    </p>
                  </div>
                )}

                <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                  <div className="form-group">
                    <label className="form-label">{t('admin.admins.form.full_name', 'Full Name')}</label>
                    <div className="input-with-icon">
                      <User size={16} className="input-icon" />
                      <input 
                        type="text" 
                        className="form-input" 
                        value={adminForm.name} 
                        onChange={e => setAdminForm(prev => ({ ...prev, name: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">{t('admin.admins.form.email', 'Email Address')}</label>
                    <div className="input-with-icon">
                      <Mail size={16} className="input-icon" />
                      <input 
                        type="email" 
                        className="form-input" 
                        value={adminForm.email} 
                        onChange={e => setAdminForm(prev => ({ ...prev, email: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">{editingAdmin ? t('admin.admins.form.change_password', 'Change Password (Optional)') : t('admin.admins.form.password', 'Password')}</label>
                    <div className="input-with-icon">
                      <Lock size={16} className="input-icon" />
                      <input 
                        type="password" 
                        className="form-input" 
                        placeholder={editingAdmin ? t('admin.admins.form.password_placeholder_edit', 'Leave blank to keep current') : t('admin.admins.form.password_placeholder_add', 'Enter 8+ characters')}
                        value={adminForm.password} 
                        onChange={e => setAdminForm(prev => ({ ...prev, password: e.target.value }))}
                        required={!editingAdmin}
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ display: 'flex', alignItems: 'center', marginTop: '24px' }}>
                    <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '13px' }}>
                      <input 
                        type="checkbox" 
                        checked={adminForm.is_active} 
                        disabled={editingAdmin && primaryAdmin && editingAdmin.id === primaryAdmin.id}
                        onChange={e => setAdminForm(prev => ({ ...prev, is_active: e.target.checked }))}
                      />
                      <span>{t('admin.admins.form.active_account', 'Active Account (allow login)')}</span>
                    </label>
                  </div>
                </div>

                {/* ROLE SELECTION */}
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '8px', color: 'var(--br-text)' }}>{t('admin.admins.form.assign_roles', 'Assign Roles')}</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    {roles.map(role => {
                      const isSelected = adminForm.roles.includes(role.name)
                      const isPrimaryAdminSuper = editingAdmin && primaryAdmin && editingAdmin.id === primaryAdmin.id && role.name === 'Super Admin'

                      return (
                        <button
                          key={role.id}
                          type="button"
                          disabled={isPrimaryAdminSuper}
                          className={`role-select-btn ${isSelected ? 'selected' : ''}`}
                          onClick={() => toggleRoleSelection(role.name)}
                        >
                          <Shield size={14} />
                          {role.name}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* DIRECT PERMISSIONS OVERRIDE MATRIX */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h4 style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--br-text)', margin: 0 }}>{t('admin.admins.form.direct_overrides', 'Direct Permission Overrides')}</h4>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-subtle)' }}>{t('admin.admins.form.inherited_notice', '💡 Inherited permissions are checked & disabled')}</span>
                  </div>

                  <div className="permissions-matrix-container" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {Object.keys(permissions.categorized).map(catKey => {
                      const category = permissions.categorized[catKey]
                      return (
                        <div key={catKey} className="permission-category-block" style={{ border: '1px solid var(--color-border)', borderRadius: '8px', padding: '12px' }}>
                          <h5 style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--color-primary-light)', marginBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '4px' }}>
                            {category.display_name}
                          </h5>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '8px' }}>
                            {category.permissions.map(permName => {
                              const isInherited = inheritedPermissions.has(permName)
                              const isDirect = adminForm.permissions.includes(permName)
                              const isChecked = isInherited || isDirect
                              
                              // Super Admin has all by default
                              const isSuperAdminUser = adminForm.roles.includes('Super Admin')
                              const isPrimarySuperAdmin = editingAdmin && primaryAdmin && editingAdmin.id === primaryAdmin.id

                              return (
                                <label 
                                  key={permName} 
                                  className={`permission-label-item ${isChecked || isSuperAdminUser ? 'checked' : ''} ${isInherited || isSuperAdminUser ? 'inherited' : ''}`}
                                  style={{
                                    cursor: (isInherited || isSuperAdminUser || isPrimarySuperAdmin) ? 'not-allowed' : 'pointer'
                                  }}
                                >
                                  <input 
                                    type="checkbox"
                                    checked={isChecked || isSuperAdminUser}
                                    disabled={isInherited || isSuperAdminUser || isPrimarySuperAdmin}
                                    onChange={() => togglePermissionSelection(permName)}
                                  />
                                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontWeight: 500 }}>{permName.replace('manage_', '').replace('_', ' ')}</span>
                                    {isSuperAdminUser && <span style={{ fontSize: '9px', color: 'var(--color-primary-light)' }}>{t('admin.admins.form.granted_super_admin', 'Granted via Super Admin')}</span>}
                                    {!isSuperAdminUser && isInherited && <span style={{ fontSize: '9px', color: 'var(--color-warning)' }}>{t('admin.admins.form.inherited_from_role', 'Inherited from role')}</span>}
                                    {!isSuperAdminUser && !isInherited && isDirect && <span style={{ fontSize: '9px', color: 'var(--color-success)' }}>{t('admin.admins.form.direct_override', 'Direct override')}</span>}
                                  </div>
                                </label>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setAdminModalOpen(false)}>{t('admin.admins.btn.cancel', 'Cancel')}</button>
                <button type="submit" className="btn btn-primary">{t('admin.admins.btn.save_changes', 'Save changes')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ROLE CREATE/EDIT MODAL */}
      {roleModalOpen && (
        <div className="modal-backdrop">
          <div className="modal role-modal" style={{ maxWidth: '600px', width: '90%' }}>
            <div className="modal-header">
              <h3>{editingRole ? t('admin.admins.modal.edit_role_title', 'Edit Role Permissions') : t('admin.admins.modal.create_role_title', 'Create Custom Role')}</h3>
              <button className="modal-close" onClick={() => setRoleModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleRoleSubmit}>
              <div className="modal-body" style={{ maxHeight: 'calc(100vh - 250px)', overflowY: 'auto' }}>
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label className="form-label">{t('admin.admins.form.role_name', 'Role Name')}</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={roleForm.name}
                    disabled={editingRole && systemRoles.includes(editingRole.name)}
                    onChange={e => setRoleForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder={t('admin.admins.form.role_name_placeholder', 'e.g. Sales Moderator')}
                    required
                  />
                  {editingRole && systemRoles.includes(editingRole.name) && (
                    <span style={{ fontSize: '11px', color: 'var(--color-text-subtle)', marginTop: '4px', display: 'block' }}>
                      {t('admin.admins.form.system_role_notice', '⚠️ System role names cannot be modified.')}
                    </span>
                  )}
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--br-text)', marginBottom: '8px' }}>{t('admin.admins.form.granted_permissions_title', 'Granted Permissions')}</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {Object.keys(permissions.categorized).map(catKey => {
                      const category = permissions.categorized[catKey]
                      return (
                        <div key={catKey} style={{ border: '1px solid var(--color-border)', borderRadius: '6px', padding: '10px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--color-primary-light)', display: 'block', marginBottom: '6px' }}>{category.display_name}</span>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '6px' }}>
                            {category.permissions.map(permName => {
                              const isChecked = roleForm.permissions.includes(permName)
                              const isSuperAdminRole = editingRole && editingRole.name === 'Super Admin'

                              return (
                                <label 
                                  key={permName} 
                                  className="checkbox-label"
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    fontSize: '11px',
                                    cursor: isSuperAdminRole ? 'not-allowed' : 'pointer',
                                    color: isChecked ? 'var(--br-text)' : 'var(--color-text-subtle)'
                                  }}
                                >
                                  <input 
                                    type="checkbox"
                                    checked={isChecked || isSuperAdminRole}
                                    disabled={isSuperAdminRole}
                                    onChange={() => toggleRolePermissionSelection(permName)}
                                  />
                                  <span>{permName.replace('manage_', '').replace('_', ' ')}</span>
                                </label>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setRoleModalOpen(false)}>{t('admin.admins.btn.cancel', 'Cancel')}</button>
                <button type="submit" className="btn btn-primary">{t('admin.admins.btn.save_changes', 'Save changes')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
