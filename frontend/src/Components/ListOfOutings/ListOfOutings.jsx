import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ListOfOutings.css'; // Import styles for outings

const ListOfOutings = () => {
  const [outings, setOutings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOutings = async () => {
      try {
        const response = await axios.get('http://localhost:4001/out/all'); // Adjust your endpoint
        setOutings(response.data); // Assuming the data structure is an array of outings
      } catch (error) {
        console.error('Error fetching outings:', error);
        setError('Failed to fetch outings.');
      } finally {
        setLoading(false);
      }
    };

    fetchOutings();
  }, []);

  return (
    <div className="list-of-outings">
      <h2>List of Outings</h2>
      {loading ? (
        <p>Loading outings...</p>
      ) : error ? (
        <p className="error-message">{error}</p>
      ) : (
        <div className="cards-container">
          {outings.length > 0 ? (
            outings.map((outing) => (
              <div className="card" key={outing._id}>
                <h3>{outing.reason}</h3>
                <p>Place of Visit: {outing.placeOfVisit}</p>
                <p>Outing at: {new Date(outing.outTime).toLocaleDateString()}</p>
                {/* Add more fields as needed */}
              </div>
            ))
          ) : (
            <p>No outings found.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default ListOfOutings;
