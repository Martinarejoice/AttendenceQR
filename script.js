// Application State
let currentUser = null;
let loginUserType = 'teacher'; // Tracks selected type on login form
let signupUserType = 'teacher'; // Tracks selected type on signup form
let currentQRCode = null;
let qrTimer = null;
let qrStartTime = null;
let attendanceData = []; // This will store all attendance records for demo
let currentStudentId = null;
let qrScanner = null; // Html5QrcodeScanner instance

// Demo credentials and user databases (in-memory for this demo)
const TEACHER_DATABASE = { 
    'teacher': { name: 'Teacher', password: 'admin123' } 
};
const STUDENT_DATABASE = {
    'ST001': { name: 'John Doe', password: 'student123' },
    'ST002': { name: 'Jane Smith', password: 'student123' },
    'ST003': { name: 'Mike Johnson', password: 'student123' },
    'ST004': { name: 'Sarah Wilson', password: 'student123' },
    'ST005': { name: 'David Brown', password: 'student123' }
};

// DOM Elements
const authContainer = document.getElementById('authContainer');
const loginSection = document.getElementById('loginSection');
const signupSection = document.getElementById('signupSection');
const teacherDashboard = document.getElementById('teacherDashboard');
const studentDashboard = document.getElementById('studentDashboard');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const loginMessageDiv = document.getElementById('loginMessage');
const signupMessageDiv = document.getElementById('signupMessage');
const teacherMessageDiv = document.getElementById('teacherMessage');
const studentScanMessageDiv = document.getElementById('studentScanMessage');

// Helper function to show messages
function showMessage(element, text, type) {
    element.textContent = text;
    element.className = `message ${type}`;
    element.style.display = 'block';
    setTimeout(() => {
        element.style.display = 'none';
        element.textContent = '';
        element.className = 'message';
    }, 5000); // Hide after 5 seconds
}

// --- Form Toggling Functions ---
function showLoginForm() {
    loginSection.style.display = 'block';
    signupSection.style.display = 'none';
    // Reset message divs
    loginMessageDiv.style.display = 'none';
    signupMessageDiv.style.display = 'none';
    // Ensure login user type is defaulted to teacher if switching from signup
    selectUserTypeLogin('teacher');
    document.getElementById('loginUsername').value = '';
    document.getElementById('loginPassword').value = '';
}

function showSignupForm() {
    loginSection.style.display = 'none';
    signupSection.style.display = 'block';
    // Reset message divs
    loginMessageDiv.style.display = 'none';
    signupMessageDiv.style.display = 'none';
    // Default signup user type to teacher
    selectUserTypeSignup('teacher');
    document.getElementById('signupUsername').value = '';
    document.getElementById('signupPassword').value = '';
    document.getElementById('confirmPassword').value = '';
}

// --- User Type Selection for Login Form ---
function selectUserTypeLogin(type) {
    loginUserType = type;
    const buttons = document.querySelectorAll('#loginSection .user-type-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    // Find the button that corresponds to the selected type
    const activeButton = Array.from(buttons).find(btn => btn.textContent.toLowerCase().includes(type));
    if (activeButton) {
        activeButton.classList.add('active');
    }
    
    const usernameLabel = document.getElementById('loginUsernameLabel');
    const loginBtn = document.getElementById('loginBtn');
    
    if (type === 'student') {
        usernameLabel.textContent = 'Student ID';
        loginBtn.textContent = 'STUDENT LOGIN';
    } else { // teacher
        usernameLabel.textContent = 'Username';
        loginBtn.textContent = 'TEACHER LOGIN';
    }
}

// --- User Type Selection for Signup Form ---
function selectUserTypeSignup(type) {
    signupUserType = type;
    const buttons = document.querySelectorAll('#signupSection .user-type-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    const activeButton = Array.from(buttons).find(btn => btn.textContent.toLowerCase().includes(type));
    if (activeButton) {
        activeButton.classList.add('active');
    }
    
    const usernameLabel = document.getElementById('signupUsernameLabel');
    if (type === 'student') {
        usernameLabel.textContent = 'Student ID';
    } else { // teacher
        usernameLabel.textContent = 'Username';
    }
}


// --- Login Handler ---
loginForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    let userFound = false;

    if (loginUserType === 'teacher') {
        if (TEACHER_DATABASE[username] && TEACHER_DATABASE[username].password === password) {
            currentUser = { id: username, name: TEACHER_DATABASE[username].name, type: 'teacher' };
            userFound = true;
        }
    } else { // student
        if (STUDENT_DATABASE[username] && STUDENT_DATABASE[username].password === password) {
            currentUser = { id: username, name: STUDENT_DATABASE[username].name, type: 'student' };
            currentStudentId = username; // Set current student ID for dashboard
            userFound = true;
        }
    }

    if (userFound) {
        showMessage(loginMessageDiv, `Login successful! Welcome, ${currentUser.name}.`, 'success');
        setTimeout(() => {
            if (currentUser.type === 'teacher') {
                showTeacherDashboard();
            } else {
                showStudentDashboard();
            }
        }, 1000);
    } else {
        showMessage(loginMessageDiv, 'Invalid username/ID or password. Please try again.', 'error');
    }
});

// --- Signup Handler ---
signupForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const username = document.getElementById('signupUsername').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (password !== confirmPassword) {
        showMessage(signupMessageDiv, 'Passwords do not match.', 'error');
        return;
    }

    if (signupUserType === 'teacher') {
        if (TEACHER_DATABASE[username]) {
            showMessage(signupMessageDiv, 'Username already exists. Please choose another.', 'error');
        } else {
            TEACHER_DATABASE[username] = { name: username, password: password };
            showMessage(signupMessageDiv, 'Teacher account created successfully! Please log in.', 'success');
            setTimeout(showLoginForm, 1000);
        }
    } else { // student
        if (STUDENT_DATABASE[username]) {
            showMessage(signupMessageDiv, 'Student ID already exists. Please choose another.', 'error');
        } else {
            STUDENT_DATABASE[username] = { name: username, password: password };
            showMessage(signupMessageDiv, 'Student account created successfully! Please log in.', 'success');
            setTimeout(showLoginForm, 1000);
        }
    }
});

// --- Logout Function ---
function logout() {
    currentUser = null;
    currentQRCode = null;
    if (qrTimer) clearInterval(qrTimer);
    qrTimer = null;
    if (qrScanner) {
        qrScanner.stop().then(() => {
            console.log("QR scanner stopped.");
        }).catch(err => {
            console.error("Error stopping QR scanner:", err);
        });
    }

    // Reset dashboard specific states
    attendanceData = [];
    updateTeacherDashboardStats();
    updateTeacherAttendanceList();
    updateStudentDashboardStats();
    updateStudentAttendanceHistory();

    authContainer.style.display = 'flex';
    teacherDashboard.style.display = 'none';
    studentDashboard.style.display = 'none';
    showLoginForm(); // Go back to login form
    showMessage(loginMessageDiv, 'You have been logged out.', 'success');
}

// --- Dashboard Display Functions ---
function showTeacherDashboard() {
    authContainer.style.display = 'none';
    studentDashboard.style.display = 'none';
    teacherDashboard.style.display = 'block';
    document.getElementById('teacherName').textContent = `Welcome, ${currentUser.name}`;
    updateTeacherDashboardStats();
    updateTeacherAttendanceList();
}

function showStudentDashboard() {
    authContainer.style.display = 'none';
    teacherDashboard.style.display = 'none';
    studentDashboard.style.display = 'block';
    document.getElementById('studentName').textContent = `Welcome, ${currentUser.name}`;
    updateStudentDashboardStats();
    updateStudentAttendanceHistory();
    // Initialize scanner on student dashboard load
    initializeScanner();
}

// --- Teacher Dashboard Functions ---

// Generates a new QR code for attendance
function generateQR() {
    const qrCanvas = document.getElementById('qrCanvas');
    const timerDisplay = document.getElementById('timer');
    
    // Generate a unique QR code content (e.g., timestamp + random string)
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    currentQRCode = `ATTENDANCE_SESSION_${timestamp}_${randomString}`;

    // Use QRious to generate QR code
    new QRious({
        element: qrCanvas,
        value: currentQRCode,
        size: 256,
        padding: 10,
        foreground: '#8A2BE2' // Blue Violet
    });

    teacherMessageDiv.style.display = 'none'; // Hide previous messages

    qrStartTime = Date.now();
    let timeLeft = 60; // QR code valid for 60 seconds

    if (qrTimer) clearInterval(qrTimer); // Clear existing timer if any

    timerDisplay.textContent = `QR active for ${timeLeft} seconds`;
    timerDisplay.style.color = '#2ecc71'; // Green for active

    qrTimer = setInterval(() => {
        timeLeft--;
        if (timeLeft > 0) {
            timerDisplay.textContent = `QR active for ${timeLeft} seconds`;
            if (timeLeft <= 10) {
                timerDisplay.style.color = '#e74c3c'; // Red for last 10 seconds
            }
        } else {
            clearInterval(qrTimer);
            timerDisplay.textContent = 'QR expired! Generate new.';
            timerDisplay.style.color = '#e74c3c';
            currentQRCode = null; // Invalidate QR code
            showMessage(teacherMessageDiv, 'QR code has expired. Please generate a new one.', 'error');
            // Clear the canvas when QR expires
            const context = qrCanvas.getContext('2d');
            context.clearRect(0, 0, qrCanvas.width, qrCanvas.height);
            context.fillStyle = '#f8f9fa';
            context.fillRect(0, 0, qrCanvas.width, qrCanvas.height);
            context.font = '1rem Inter';
            context.fillStyle = '#333';
            context.textAlign = 'center';
            context.fillText('Generate QR', qrCanvas.width / 2, qrCanvas.height / 2);
        }
    }, 1000);
    showMessage(teacherMessageDiv, 'New QR code generated successfully!', 'success');
}

// Updates the teacher's dashboard statistics
function updateTeacherDashboardStats() {
    const totalStudents = Object.keys(STUDENT_DATABASE).length;
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const presentStudents = attendanceData.filter(record => 
        record.date === today && record.status === 'Present'
    ).length;
    const attendanceRate = totalStudents > 0 ? ((presentStudents / totalStudents) * 100).toFixed(1) : 0;
    const lastUpdated = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    document.getElementById('totalStudents').textContent = totalStudents;
    document.getElementById('presentCount').textContent = presentStudents;
    document.getElementById('attendanceRate').textContent = `${attendanceRate}%`;
    document.getElementById('lastUpdated').textContent = lastUpdated;
}

// Updates the teacher's attendance list table
function updateTeacherAttendanceList() {
    const teacherAttendanceList = document.getElementById('teacherAttendanceList');
    teacherAttendanceList.innerHTML = ''; // Clear previous entries
    
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const todayAttendance = attendanceData.filter(record => record.date === today);

    if (todayAttendance.length === 0) {
        teacherAttendanceList.innerHTML = `<tr><td colspan="4" style="text-align: center; color: #666;">No attendance records yet</td></tr>`;
        return;
    }

    todayAttendance.forEach(record => {
        const row = teacherAttendanceList.insertRow();
        row.insertCell().textContent = record.studentId;
        row.insertCell().textContent = record.studentName;
        row.insertCell().textContent = record.scanTime;
        const statusCell = row.insertCell();
        statusCell.innerHTML = `<span class="status-present">${record.status}</span>`;
    });
}

// --- Student Dashboard Functions ---

// Initialize the QR code scanner for students
function initializeScanner() {
    if (qrScanner) {
        // If scanner exists, try to stop it first to prevent multiple instances
        qrScanner.stop().then(() => {
            console.log("Previous QR scanner stopped for reinitialization.");
            startNewScanner();
        }).catch(err => {
            console.warn("Could not stop previous QR scanner, initializing new one:", err);
            startNewScanner();
        });
    } else {
        startNewScanner();
    }
}

function startNewScanner() {
    const html5QrCode = new Html5Qrcode("qr-reader");
    const qrCodeSuccessCallback = (decodedText, decodedResult) => {
        // Do something when a code is scanned successfully
        console.log(`QR Code scanned: ${decodedText}`);
        document.getElementById('manualQrInput').value = decodedText; // Populate manual input
        showMessage(studentScanMessageDiv, `QR Code scanned: ${decodedText}`, 'success');
        // Automatically mark attendance after a successful scan
        markStudentAttendance();
        stopScanner(); // Stop scanner after successful scan
    };

    const config = { fps: 10, qrbox: { width: 250, height: 250 } };
    
    // Start scanning
    html5QrCode.start({ facingMode: "environment" }, config, qrCodeSuccessCallback)
    .catch(err => {
        console.error("Unable to start scanning, please grant camera access:", err);
        showMessage(studentScanMessageDiv, 'Failed to start camera. Please ensure camera access is granted.', 'error');
    });
    qrScanner = html5QrCode; // Store the instance
}

// Function to explicitly start scanner if it was stopped
function startScanner() {
    if (!qrScanner) {
        initializeScanner();
    } else {
        qrScanner.start({ facingMode: "environment" }, { fps: 10, qrbox: { width: 250, height: 250 } }, (decodedText, decodedResult) => {
            console.log(`QR Code scanned: ${decodedText}`);
            document.getElementById('manualQrInput').value = decodedText;
            showMessage(studentScanMessageDiv, `QR Code scanned: ${decodedText}`, 'success');
            markStudentAttendance();
            stopScanner();
        }).catch(err => {
            console.error("Error starting scanner:", err);
            showMessage(studentScanMessageDiv, 'Failed to start camera. Please ensure camera access is granted.', 'error');
        });
    }
    showMessage(studentScanMessageDiv, 'Scanner started. Please scan QR code.', 'success');
}

// Function to stop the QR scanner
function stopScanner() {
    if (qrScanner && qrScanner.isScanning) { // Corrected: removed space between is and Scanning
        qrScanner.stop().then(() => {
            console.log("QR scanner stopped.");
            showMessage(studentScanMessageDiv, 'Scanner stopped.', 'success');
        }).catch(err => {
            console.error("Error stopping QR scanner:", err);
            showMessage(studentScanMessageDiv, 'Error stopping scanner.', 'error');
        });
    } else {
        showMessage(studentScanMessageDiv, 'Scanner is not active.', 'error');
    }
}


// Marks student attendance based on scanned/manual QR code
function markStudentAttendance() {
    const scannedQrValue = document.getElementById('manualQrInput').value;
    const now = new Date();
    const scanTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const today = now.toISOString().slice(0, 10); // YYYY-MM-DD

    if (!currentUser || currentUser.type !== 'student') {
        showMessage(studentScanMessageDiv, 'You must be logged in as a student to mark attendance.', 'error');
        return;
    }

    if (!scannedQrValue) {
        showMessage(studentScanMessageDiv, 'No QR code scanned or entered.', 'error');
        return;
    }

    // Check if the QR code is valid (matches the teacher's current active QR)
    // In a real system, this would involve server-side validation against a live session
    if (currentQRCode && scannedQrValue === currentQRCode) {
        // Check if attendance already marked for today's session
        const alreadyMarked = attendanceData.some(record =>
            record.studentId === currentStudentId && record.date === today && record.qrCode === currentQRCode
        );

        if (alreadyMarked) {
            showMessage(studentScanMessageDiv, 'You have already marked attendance for this session today.', 'error');
            return;
        }

        const studentName = STUDENT_DATABASE[currentStudentId] ? STUDENT_DATABASE[currentStudentId].name : 'Unknown Student';
        
        const newRecord = {
            qrCode: scannedQrValue,
            studentId: currentStudentId,
            studentName: studentName,
            date: today,
            scanTime: scanTime,
            status: 'Present'
        };
        attendanceData.push(newRecord);
        showMessage(studentScanMessageDiv, 'Attendance marked successfully!', 'success');
        document.getElementById('manualQrInput').value = ''; // Clear input field

        // Update dashboards
        updateTeacherDashboardStats();
        updateTeacherAttendanceList();
        updateStudentDashboardStats();
        updateStudentAttendanceHistory();
    } else {
        showMessage(studentScanMessageDiv, 'Invalid or expired QR code. Please scan a valid QR or check with your teacher.', 'error');
    }
}

// Updates student's attendance statistics
function updateStudentDashboardStats() {
    const totalClasses = attendanceData.filter(record => record.qrCode && record.qrCode.startsWith('ATTENDANCE_SESSION_')).length; // Count unique attendance sessions
    const attendedClasses = attendanceData.filter(record => 
        record.studentId === currentStudentId && record.status === 'Present'
    ).length;
    const attendanceRate = totalClasses > 0 ? ((attendedClasses / totalClasses) * 100).toFixed(1) : 0;

    document.getElementById('studentTotalClasses').textContent = totalClasses;
    document.getElementById('studentAttended').textContent = attendedClasses;
    document.getElementById('studentAttendanceRate').textContent = `${attendanceRate}%`;
}

// Updates student's attendance history table
function updateStudentAttendanceHistory() {
    const studentAttendanceList = document.getElementById('studentAttendanceList');
    studentAttendanceList.innerHTML = ''; // Clear previous entries

    const studentRecords = attendanceData.filter(record => record.studentId === currentStudentId);

    if (studentRecords.length === 0) {
        studentAttendanceList.innerHTML = `<tr><td colspan="4" style="text-align: center; color: #666;">No attendance records yet</td></tr>`;
        return;
    }

    studentRecords.forEach(record => {
        const row = studentAttendanceList.insertRow();
        row.insertCell().textContent = record.date;
        // For class time, we'll use the scan time for simplicity in this demo.
        // In a real app, this might come from a scheduled class object.
        row.insertCell().textContent = record.scanTime; 
        row.insertCell().textContent = record.scanTime;
        const statusCell = row.insertCell();
        statusCell.innerHTML = `<span class="status-present">${record.status}</span>`;
    });
}

function testScanner() {
    if (typeof Html5Qrcode === 'undefined') {
        console.error('Html5Qrcode library not loaded');
        return false;
    }
    console.log('Html5Qrcode library is available');
    return true;
}
// Initial load: show login form
document.addEventListener('DOMContentLoaded', showLoginForm);
