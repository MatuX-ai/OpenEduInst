@echo off
echo Starting OpenMT Education Institution Management System...

echo Installing backend dependencies...
cd backend
pip install -r requirements.txt

echo Starting backend server...
start "" uvicorn main:app --reload --port 8000

echo Installing frontend dependencies...
cd ../frontend
call npm install

echo Starting frontend development server...
start "" ng serve --port 4200

echo.
echo Backend API: http://localhost:8000
echo Frontend App: http://localhost:4200
echo.
echo Press any key to exit...
pause > nul
