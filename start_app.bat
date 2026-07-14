@echo off
title Yerel RAG Sistemi Baslatici
echo ==============================================
echo        Yerel RAG Yapay Zeka Asistani
echo ==============================================
echo.

echo 1. Backend Sunucusu (FastAPI) yeni pencerede baslatiliyor...
start "RAG Backend - FastAPI" cmd /k "echo FastAPI Sunucusu Calisiyor... && .venv\Scripts\uvicorn backend.main:app --port 8000 --reload"

timeout /t 3 /nobreak >nul

echo 2. Tarayicida sohbet sayfasi aciliyor...
start http://localhost:5173

echo ==============================================
echo [BASARI] Yerel RAG Yapay Zeka Sistemi Baslatildi!
echo.
echo  * Backend Adresi: http://localhost:8000
echo  * Arayuz Adresi: http://localhost:5173
echo  * API Dokumantasyonu: http://localhost:8000/docs
echo.
echo  Uygulamayi kapatmak icin bu pencereyi
echo  ve acilan diger siyah pencereyi kapatabilirsiniz.
echo ==============================================
echo.

echo 3. Frontend (React) bu pencerede baslatiliyor...
cd frontend
npm run dev
