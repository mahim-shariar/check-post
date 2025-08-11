export const redirectToLogin = (queryParams = "") => {
  // Clear any remaining auth state
  window.localStorage.clear(); // If you use any
  window.sessionStorage.clear(); // If you use any

  // Redirect to login with optional query params
  window.location.href = `/${queryParams}`;
};
