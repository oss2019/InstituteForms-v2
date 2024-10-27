import React from 'react';
import { Bar } from 'react-chartjs-2';

function Graph({ data }) {
  const chartData = {
    labels: ['Outpasses', 'Leaves'],
    datasets: [
      {
        label: 'Requests',
        data: [data.outpasses, data.leaves],
        backgroundColor: ['#36A2EB', '#FF6384'],
      },
    ],
  };

  return <Bar data={chartData} />;
}

export default Graph;
