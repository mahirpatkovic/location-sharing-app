import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:8080'); // Initialize the socket connection

function App() {
  const [username, setUsername] = useState('');
  const [users, setUsers] = useState([]);
  const [location, setLocation] = useState({ lat: null, lng: null });

  const [searchValue, setSearchValue] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [favoriteUsers, setFavoriteUsers] = useState([]);

  const userId = localStorage.getItem('user');
  useEffect(() => {
    socket.emit('connectUser', userId); // Notify the server to add this client to the user's room

    // return () => {
    //   socket.off('connectUser');
    // };
  }, [userId]);
  // Fetch list of users (using REST endpoint)
  useEffect(() => {
    // Listen for location updates from the server
    socket.on('favoriteLocationUpdate', (data) => {
      console.log('share location data', data);
      // Find the favorite user whose location has been updated
      setFavoriteUsers((prevFavorites) =>
        prevFavorites.map((user) =>
          user._id === data.userId
            ? { ...user, longitude: data.latitude, latitude: data.longitude }
            : user,
        ),
      );
    });

    // Clean up the listener when the component unmounts
    return () => {
      socket.off('favoriteLocationUpdate');
    };
  }, []);

  // Function to create a new user
  const createUser = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });
      if (response.ok) {
        alert('User created successfully');
        const newUser = await response.json();
        setUsers((prevUsers) => [...prevUsers, newUser]);
      } else {
        console.error('Error creating user');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // Function to handle location sharing via Socket.IO
  const shareLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ lat: latitude, lng: longitude });

        // Emit location to the server via Socket.IO
        socket.emit('shareLocation', {
          userId,
          latitude: latitude,
          longitude: longitude,
        });
      });
    } else {
      alert('Geolocation is not supported by this browser.');
    }
  };

  const handleSearch = async () => {
    const response = await fetch(
      `http://localhost:8080/api/users/search?username=${searchValue}`,
    );
    const results = await response.json();
    setSearchResults(results);
  };

  const addFavorite = async (favoriteUserId) => {
    await fetch(`http://localhost:8080/api/users/favorites/requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ senderId: userId, targetId: favoriteUserId }),
    });
    alert('User added to favorites');
  };

  const getFavoriteUsers = async () => {
    try {
      const response = await fetch(
        `http://localhost:8080/api/users/favorites/${userId}`,
      );

      if (!response.ok) {
        throw new Error('Failed to fetch favorite users');
      }

      const favoriteUsers = await response.json();
      console.log(favoriteUsers); // Check the data structure of the favorite users
      return favoriteUsers;
    } catch (error) {
      console.error('Error fetching favorite users:', error);
    }
  };

  const handleFetchFavorites = async () => {
    const users = await getFavoriteUsers();
    if (users) {
      setFavoriteUsers(users); // Update the state with the fetched users
    }
  };

  return (
    <div className="App">
      <h1>Location Sharing App</h1>

      <div>
        <h2>Create User</h2>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter username"
        />
        <button onClick={createUser}>Create User</button>
      </div>

      <h1>Search and Add to Favorites</h1>

      <input
        type="text"
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
        placeholder="Search for a user by username"
      />
      <button onClick={handleSearch}>Search</button>

      <h2>Search Results</h2>
      <ul>
        {searchResults.map((user) => (
          <li key={user._id}>
            {user.username}
            <button onClick={() => addFavorite(user._id)}>
              Add to Favorites
            </button>
          </li>
        ))}
      </ul>

      <button onClick={handleFetchFavorites}>Get Favorite Users</button>
      <div>
        <h3>Your Favorite Users:</h3>
        <ul>
          {favoriteUsers.map((user) => (
            <li key={user._id}>
              {user.username}

              {user.latitude && user.longitude ? (
                <span>
                  {' '}
                  - Location: {user.latitude.toFixed(4)},{' '}
                  {user.longitude.toFixed(4)}
                </span>
              ) : (
                <span> - Location not shared</span>
              )}
            </li> // Assuming each user object has _id and username
          ))}
        </ul>
      </div>

      <div>
        <h2>Share Location</h2>
        <button onClick={shareLocation}>Share My Location</button>
        {location.lat && location.lng && (
          <p>
            Your location: {location.lat}, {location.lng}
          </p>
        )}
      </div>
    </div>
  );
}

export default App;
