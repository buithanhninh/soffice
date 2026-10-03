@echo off
rem genoffice launcher for the packaged Windows app: <install>\resources\cli\genoffice.cmd
setlocal
set ELECTRON_RUN_AS_NODE=1
if exist "%~dp0..\..\sOffice.exe" (
  "%~dp0..\..\sOffice.exe" "%~dp0genoffice.cjs" %*
) else (
  "%~dp0..\..\GenOffice.exe" "%~dp0genoffice.cjs" %*
)
endlocal
