// Small utilities shared across auth-aware components.

const DASHBOARD_BY_ROLE = {
    admin: "/admin",
    faculty: "/faculty-dashboard",
    student: "/student-dashboard",
};

export function getDashboardPath(role) {
    return DASHBOARD_BY_ROLE[role] || "/";
}
