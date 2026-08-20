export function AdminDashboardPage() {
  return <Page title="Admin Dashboard" />;
}

export function AdminBookingsPage() {
  return <Page title="Admin Bookings" />;
}

export function AdminUsersPage() {
  return <Page title="Admin Users" />;
}

export function AdminHotelsPage() {
  return <Page title="Admin Hotels" />;
}

export function StaffDashboardPage() {
  return <Page title="Staff Dashboard" />;
}

export function StaffBookingsPage() {
  return <Page title="Staff Bookings" />;
}

export function StaffHotelsPage() {
  return <Page title="Staff Hotels" />;
}

export function CustomerHomePage() {
  return <Page title="Customer Home" />;
}

export function CustomerBookingsPage() {
  return <Page title="My Bookings" />;
}

function Page({ title }: { title: string }) {
  return (
    <section className="page">
      <h2>{title}</h2>
      <p>This page is ready for the next feature commit.</p>
    </section>
  );
}
