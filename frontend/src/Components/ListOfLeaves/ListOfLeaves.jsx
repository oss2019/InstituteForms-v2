import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ListOfLeaves.css'; // Import styles for leaves

const ListOfLeaves = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLeaves = async () => {
      try {
        const response = await axios.get('http://localhost:4001/leave/all'); // Adjust your endpoint
        setLeaves(response.data); // Assuming the data structure is an array of leaves
      } catch (error) {
        console.error('Error fetching leaves:', error);
        setError('Failed to fetch leaves.');
      } finally {
        setLoading(false);
      }
    };

    fetchLeaves();
  }, []);

  return (
    <div className="list-of-leaves">
      <h2>List of Leaves</h2>
      {loading ? (
        <p>Loading leaves...</p>
      ) : error ? (
        <p className="error-message">{error}</p>
      ) : (
        <div className="cards-container">
          {leaves.length > 0 ? (
            leaves.map((leave) => (
              <div className="card" key={leave._id}>
                <h3>{leave.reason}</h3>
                <p>Place of Visit: {leave.placeOfVisit}</p>
                <p>Leaving on: {new Date(leave.dateOfLeaving).toLocaleDateString()}</p>
                {/* Add more fields as needed */}
              </div>
            ))
          ) : (
            <p>No leaves found.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default ListOfLeaves;
