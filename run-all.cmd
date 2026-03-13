@echo off
powershell -NoExit -ExecutionPolicy Bypass -File "%~dp0run-all.ps1" %*
