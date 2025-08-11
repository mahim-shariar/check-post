import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const Home = () => {
  const { isAuthenticated } = useContext(AuthContext);

  return (
    <div className="home-container">
      <h1>Welcome to the Admin Portal</h1>
      {!isAuthenticated ? (
        <Link to="/login">Login to continue</Link>
      ) : (
        <Link to="/profile">Go to your profile</Link>
      )}
    </div>
  );
};

export default Home;