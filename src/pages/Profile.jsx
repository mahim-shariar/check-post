import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const Profile = () => {
  const { user, logout } = useContext(AuthContext);

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="profile-container">
      <h2>Profile</h2>
      {user && (
        <div>
          <p>Welcome, {user.username}</p>
          <p>User ID: {user.id}</p>
          <p>Role: {user.role}</p>
          
          
            {/* <Link to="/admin" className="admin-link">
              Go to Admin Dashboard
            </Link> */}
          
        </div>
      )}
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
};

export default Profile;