// app/admin/layout.js
import AdminSideNav from '@/components/AdminSideNav';
import Navbar from '@/components/Navbar';
import './admin.css'

export default function AdminLayout({ children }) {
  return (
    <div className="admin-container">
      <AdminSideNav />

      <div className="admin-boards">
        <div className="admin-main">
          <div className='nav-bar'>
          </div>
          <main className="admin-content">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
