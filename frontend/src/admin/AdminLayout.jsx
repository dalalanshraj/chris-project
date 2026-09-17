import React from "react";
import Sidebar from "./components/Sidebar";

function AdminLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-100">

      {/* Fixed Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="ml-64 min-h-screen">
        <div className="p-6">
          {children}
        </div>
      </main>

    </div>
  );
}

export default AdminLayout;