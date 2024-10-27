import React, { useState, useEffect } from 'react';
import axios from 'axios';

function ViewRequests() {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    axios.get('/leave/requests')
      .then((res) => setRequests(res.data))
      .catch((err) => console.error(err));
  }, []);

  const handleApproval = async (id, status) => {
    try {
      await axios.patch(`/leave/status/${id}`, { status });
      alert(`Request ${status}!`);
    } catch (error) {
      console.error(error);
      alert('Error updating status.');
    }
  };

  return (
    <div>
      <h2>View Requests</h2>
      {requests.map((req) => (
        <div key={req._id}>
          <p>{req.reason}</p>
          <button onClick={() => handleApproval(req._id, 'Approved')}>Approve</button>
          <button onClick={() => handleApproval(req._id, 'Rejected')}>Reject</button>
        </div>
      ))}
    </div>
  );
}

export default ViewRequests;
