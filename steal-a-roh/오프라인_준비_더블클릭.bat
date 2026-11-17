@echo off
cd /d "%~dp0"
if not exist "js\vendor" mkdir "js\vendor"
echo Downloading game files... (need internet)
curl.exe -L -s -o "js\vendor\three.min.js" "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"
curl.exe -L -s -o "js\vendor\peerjs.min.js" "https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js"
for %%F in ("js\vendor\three.min.js") do if %%~zF GTR 100000 goto ok
powershell -NoProfile -Command "Invoke-WebRequest https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js -OutFile js\vendor\three.min.js"
for %%F in ("js\vendor\three.min.js") do if %%~zF GTR 100000 goto ok
echo.
echo FAILED. Check internet and try again.
pause
exit /b
:ok
echo.
echo OK! Now the game works without internet.
echo You can unplug the USB and use index.html in the lab.
pause
