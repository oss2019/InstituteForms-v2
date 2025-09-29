#!/bin/bash
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
cd backend && cmd //c "npm start" &
sleep 3
cd frontend && cmd //c "npm run dev"