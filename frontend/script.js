class EmployeePayrollSystem {
    constructor() {
        this.employees = JSON.parse(localStorage.getItem('employees')) || [];

this.currentEmployeeId = null;

this.activityLog = JSON.parse(localStorage.getItem('activityLog')) || [];

this.isSidebarOpen = false;

this.isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

this.apiUrl = 'https://employ-payroll-1.onrender.com/api'; // Backend API URL

        this.initializeLogin();
        
        if (this.isLoggedIn) {
            this.showMainApp();
        } else {
            this.showLogin();
        }
    }

    initializeLogin() {
        // Check if user is already logged in
        const savedLogin = localStorage.getItem('isLoggedIn');
        const savedUsername = localStorage.getItem('username');
        
        if (savedLogin === 'true' && savedUsername) {
            this.isLoggedIn = true;
            this.showMainApp();
            return;
        }

        // Set up login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
            
            // Pre-fill remember me if exists
            const rememberMe = localStorage.getItem('rememberMe');
            const savedUsername = localStorage.getItem('savedUsername');
            if (rememberMe === 'true' && savedUsername) {
                document.getElementById('username').value = savedUsername;
                document.getElementById('rememberMe').checked = true;
            }
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const rememberMe = document.getElementById('rememberMe').checked;
        
        // Remove any existing error messages
        this.removeLoginMessages();
        
        // Authenticate with backend API
        try {
            const response = await fetch(`${this.apiUrl}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.loginSuccess(username, rememberMe);
            } else {
                this.loginError();
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showLoginMessage('Connection error. Check if backend is running on localhost:3000', 'error');
        }
    }

    loginSuccess(username, rememberMe) {
        this.isLoggedIn = true;
        
        // Save login state
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('username', username);
        
        if (rememberMe) {
            localStorage.setItem('rememberMe', 'true');
            localStorage.setItem('savedUsername', username);
        } else {
            localStorage.removeItem('rememberMe');
            localStorage.removeItem('savedUsername');
        }
        
        // Show success message
        this.showLoginMessage(`Welcome back, ${username}!`, 'success');
        
        // Transition to main app after a brief delay
        setTimeout(() => {
            this.showMainApp();
            this.logActivity(`User ${username} logged in`);
        }, 1000);
    }

    loginError() {
        this.showLoginMessage('Invalid username or password. Please try again.', 'error');
        
        // Shake animation for error
        const loginForm = document.getElementById('loginForm');
        loginForm.style.animation = 'shake 0.5s ease-in-out';
        setTimeout(() => {
            loginForm.style.animation = '';
        }, 500);
    }

    showLoginMessage(message, type) {
        this.removeLoginMessages();
        
        const messageDiv = document.createElement('div');
        messageDiv.className = type === 'error' ? 'login-error' : 'login-success';
        messageDiv.textContent = message;
        
        const loginForm = document.getElementById('loginForm');
        loginForm.appendChild(messageDiv);
    }

    removeLoginMessages() {
        const existingError = document.querySelector('.login-error');
        const existingSuccess = document.querySelector('.login-success');
        
        if (existingError) existingError.remove();
        if (existingSuccess) existingSuccess.remove();
    }

    showLogin() {
        document.getElementById('loginContainer').style.display = 'flex';
        document.getElementById('mainApp').style.display = 'none';
    }

    showMainApp() {
        document.getElementById('loginContainer').style.display = 'none';
        document.getElementById('mainApp').style.display = 'block';
        
        // Initialize the main application
        this.initializeMainApp();
    }

    initializeMainApp() {
        // Initialize all event listeners for the main app
        this.initializeEventListeners();
        this.renderEmployeeList();
        this.updatePayrollSummary();
        this.updateSidebar();
        
        // Add sample data if empty
        if (this.employees.length === 0) {
            this.addSampleData();
        }
    }

    logout() {
        this.isLoggedIn = false;
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('username');
        
        this.showLogin();
        this.logActivity('User logged out');
    }

    // Add logout button to your header
    addLogoutButton() {
        const headerActions = document.querySelector('.header-actions');
        
        // Remove existing logout button if any
        const existingLogout = document.querySelector('.logout-btn');
        if (existingLogout) {
            existingLogout.remove();
        }
        
        const logoutBtn = document.createElement('button');
        logoutBtn.className = 'header-btn logout-btn';
        logoutBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> Logout';
        logoutBtn.onclick = () => this.logout();
        headerActions.appendChild(logoutBtn);
    }

    initializeEventListeners() {
        console.log('Initializing event listeners...');
        
        // Remove any existing event listeners first
        this.removeEventListeners();
        
        // Form event listeners
        const employeeForm = document.getElementById('employeeForm');
        const resetBtn = document.getElementById('resetBtn');
        const searchInput = document.getElementById('searchInput');
        const menuToggle = document.getElementById('menuToggle');
        const closeSidebar = document.getElementById('closeSidebar');
        const sidebarBackdrop = document.getElementById('sidebarBackdrop');
        const dashboardBtn = document.getElementById('dashboardBtn');
        const exportDataBtn = document.getElementById('exportDataBtn');
        const generateReportBtn = document.getElementById('generateReportBtn');
        const clearDataBtn = document.getElementById('clearDataBtn');

        // Add event listeners with proper error handling
        if (employeeForm) {
            employeeForm.addEventListener('submit', (e) => this.saveEmployee(e));
        }
        
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.resetForm());
        }
        
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.searchEmployees(e.target.value));
        }
        
        if (menuToggle) {
            menuToggle.addEventListener('click', () => this.toggleSidebar());
        }
        
        if (closeSidebar) {
            closeSidebar.addEventListener('click', () => this.toggleSidebar());
        }
        
        if (sidebarBackdrop) {
            sidebarBackdrop.addEventListener('click', () => this.toggleSidebar());
        }
        
        if (dashboardBtn) {
            dashboardBtn.addEventListener('click', () => this.toggleSidebar());
        }
        
        if (exportDataBtn) {
            exportDataBtn.addEventListener('click', () => this.exportData());
        }
        
        if (generateReportBtn) {
            generateReportBtn.addEventListener('click', () => this.generateReport());
        }
        
        if (clearDataBtn) {
            clearDataBtn.addEventListener('click', () => this.clearAllData());
        }
        
        // Add logout button
        this.addLogoutButton();
        
        console.log('Event listeners initialized successfully');
    }

    removeEventListeners() {
        // This function helps prevent duplicate event listeners
        const elements = [
            'employeeForm', 'resetBtn', 'searchInput', 'menuToggle', 
            'closeSidebar', 'sidebarBackdrop', 'dashboardBtn',
            'exportDataBtn', 'generateReportBtn', 'clearDataBtn'
        ];
        
        elements.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                const newElement = element.cloneNode(true);
                element.parentNode.replaceChild(newElement, element);
            }
        });
    }

    toggleSidebar() {
        console.log('Toggle sidebar called');
        const sidebar = document.getElementById('sidebar');
        const mainContentWrapper = document.querySelector('.main-content-wrapper');
        const backdrop = document.getElementById('sidebarBackdrop');
        
        if (!sidebar || !mainContentWrapper || !backdrop) {
            console.error('Sidebar elements not found');
            return;
        }
        
        this.isSidebarOpen = !this.isSidebarOpen;
        
        if (this.isSidebarOpen) {
            sidebar.classList.add('active');
            mainContentWrapper.classList.add('blur-effect');
            backdrop.classList.add('active');
            document.body.style.overflow = 'hidden';
        } else {
            sidebar.classList.remove('active');
            mainContentWrapper.classList.remove('blur-effect');
            backdrop.classList.remove('active');
            document.body.style.overflow = '';
        }
        
        console.log('Sidebar state:', this.isSidebarOpen ? 'open' : 'closed');
    }

    addSampleData() {
        const sampleEmployees = [
            {
                id: '1',
                name: 'Surajit pramanik',
                position: 'Software Developer',
                department: 'IT',
                salary: 50000,
                hoursWorked: 160,
                overtime: 10,
                bonus: 5000,
                deductions: 3000,
                joinDate: new Date().toISOString()
            },
            {
                id: '2',
                name: 'Sudip Maity',
                position: 'HR Manager',
                department: 'HR',
                salary: 80000,
                hoursWorked: 160,
                overtime: 5,
                bonus: 10000,
                deductions: 4000,
                joinDate: new Date().toISOString()
            },
            {
                id: '3',
                name: 'kanchan Mahato',
                position: 'Sales Executive',
                department: 'Sales',
                salary: 45000,
                hoursWorked: 160,
                overtime: 15,
                bonus: 8000,
                deductions: 2500,
                joinDate: new Date().toISOString()
            },
            {
                id: '4',
                name: 'Sankhadip Pari',
                position: 'IT Support',
                department: 'IT',
                salary: 50000,
                hoursWorked: 170,
                overtime: 20,
                bonus: 9000,
                deductions: 2500,
                joinDate: new Date().toISOString()

            },
            {
                id: '5',
                name: 'Ayan karmakar',
                position: 'Finance Analyst',
                department: 'Finance',
                salary: 40000,
                hoursWorked: 150,
                overtime: 15,
                bonus: 7000,
                deductions: 2500,
                joinDate: new Date().toISOString()
            }
        ];
        
        this.employees = sampleEmployees;
        this.saveToLocalStorage();
        this.logActivity('Sample data loaded');
    }

    saveEmployee(e) {
        e.preventDefault();
        
        const employee = {
            id: this.currentEmployeeId || Date.now().toString(),
            name: document.getElementById('name').value,
            position: document.getElementById('position').value,
            department: document.getElementById('department').value,
            salary: parseFloat(document.getElementById('salary').value),
            hoursWorked: parseFloat(document.getElementById('hoursWorked').value),
            overtime: parseFloat(document.getElementById('overtime').value),
            bonus: parseFloat(document.getElementById('bonus').value),
            deductions: parseFloat(document.getElementById('deductions').value),
            joinDate: this.currentEmployeeId ? 
                this.employees.find(emp => emp.id === this.currentEmployeeId)?.joinDate || new Date().toISOString() : 
                new Date().toISOString()
        };

        const action = this.currentEmployeeId ? 'updated' : 'added';
        const employeeName = employee.name;

        if (this.currentEmployeeId) {
            const index = this.employees.findIndex(emp => emp.id === this.currentEmployeeId);
            this.employees[index] = employee;
            this.logActivity(`Updated employee: ${employeeName}`);
        } else {
            this.employees.push(employee);
            this.logActivity(`Added new employee: ${employeeName}`);
        }

        this.saveToLocalStorage();
        this.renderEmployeeList();
        this.updatePayrollSummary();
        this.updateSidebar();
        this.resetForm();

        this.showNotification(`Employee ${action} successfully!`, 'success');
    }

    calculatePayroll(employee) {
        const hourlyRate = employee.salary / 160;
        const regularPay = employee.hoursWorked * hourlyRate;
        const overtimePay = employee.overtime * hourlyRate * 1.5;
        const grossPay = regularPay + overtimePay + employee.bonus;
        const netPay = grossPay - employee.deductions;

        return {
            regularPay: regularPay.toFixed(2),
            overtimePay: overtimePay.toFixed(2),
            grossPay: grossPay.toFixed(2),
            netPay: netPay.toFixed(2),
            hourlyRate: hourlyRate.toFixed(2)
        };
    }

    editEmployee(id) {
        const employee = this.employees.find(emp => emp.id === id);
        if (employee) {
            this.currentEmployeeId = employee.id;
            document.getElementById('name').value = employee.name;
            document.getElementById('position').value = employee.position;
            document.getElementById('department').value = employee.department;
            document.getElementById('salary').value = employee.salary;
            document.getElementById('hoursWorked').value = employee.hoursWorked;
            document.getElementById('overtime').value = employee.overtime;
            document.getElementById('bonus').value = employee.bonus;
            document.getElementById('deductions').value = employee.deductions;
            
            document.getElementById('saveBtn').innerHTML = '<i class="fas fa-save"></i> Update Employee';
            
            this.logActivity(`Started editing employee: ${employee.name}`);
        }
    }

    deleteEmployee(id) {
        const employee = this.employees.find(emp => emp.id === id);
        if (employee && confirm('Are you sure you want to delete this employee?')) {
            this.employees = this.employees.filter(emp => emp.id !== id);
            this.saveToLocalStorage();
            this.renderEmployeeList();
            this.updatePayrollSummary();
            this.updateSidebar();
            this.logActivity(`Deleted employee: ${employee.name}`);
            this.showNotification('Employee deleted successfully!', 'success');
        }
    }

    resetForm() {
        document.getElementById('employeeForm').reset();
        this.currentEmployeeId = null;
        document.getElementById('saveBtn').innerHTML = '<i class="fas fa-save"></i> Save Employee';
    }

    searchEmployees(query) {
        const filteredEmployees = this.employees.filter(employee =>
            employee.name.toLowerCase().includes(query.toLowerCase()) ||
            employee.position.toLowerCase().includes(query.toLowerCase()) ||
            employee.department.toLowerCase().includes(query.toLowerCase())
        );
        this.renderEmployeeList(filteredEmployees);
    }

    renderEmployeeList(employeesToRender = null) {
        const employees = employeesToRender || this.employees;
        const employeeList = document.getElementById('employeeList');
        
        if (!employeeList) {
            console.error('Employee list element not found');
            return;
        }
        
        employeeList.innerHTML = '';

        if (employees.length === 0) {
            employeeList.innerHTML = `
                <div class="no-data">
                    <i class="fas fa-users"></i>
                    <p>No employees found.</p>
                </div>
            `;
            return;
        }

        employees.forEach(employee => {
            const payroll = this.calculatePayroll(employee);
            const joinDate = new Date(employee.joinDate).toLocaleDateString();
            
            const employeeItem = document.createElement('div');
            employeeItem.className = 'employee-item';
            employeeItem.innerHTML = `
                <div class="employee-header">
                    <div class="employee-basic-info">
                        <div class="employee-name">${employee.name}</div>
                        <div class="employee-position">${employee.position}</div>
                    </div>
                    <div class="employee-department">${employee.department}</div>
                </div>
                
                <div class="employee-details">
                    <div class="detail-item">
                        <span>Basic Salary:</span>
                        <span class="currency-symbol">${employee.salary}</span>
                    </div>
                    <div class="detail-item">
                        <span>Hours Worked:</span>
                        <span>${employee.hoursWorked}h</span>
                    </div>
                    <div class="detail-item">
                        <span>Overtime:</span>
                        <span>${employee.overtime}h</span>
                    </div>
                    <div class="detail-item">
                        <span>Join Date:</span>
                        <span>${joinDate}</span>
                    </div>
                    <div class="detail-item">
                        <span>Hourly Rate:</span>
                        <span class="currency-symbol">${payroll.hourlyRate}</span>
                    </div>
                    <div class="detail-item">
                        <span>Net Pay:</span>
                        <span class="net-pay currency-symbol">${payroll.netPay}</span>
                    </div>
                </div>
                
                <div class="employee-actions">
                    <button class="edit-btn" onclick="payrollSystem.editEmployee('${employee.id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="delete-btn" onclick="payrollSystem.deleteEmployee('${employee.id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                    <button class="calculate-btn" onclick="payrollSystem.showPayrollDetails('${employee.id}')">
                        <i class="fas fa-calculator"></i> Calculate
                    </button>
                    <button class="details-btn" onclick="payrollSystem.showEmployeeDetails('${employee.id}')">
                        <i class="fas fa-info-circle"></i> Details
                    </button>
                </div>
            `;
            employeeList.appendChild(employeeItem);
        });
    }

    showPayrollDetails(id) {
        const employee = this.employees.find(emp => emp.id === id);
        if (employee) {
            const payroll = this.calculatePayroll(employee);
            alert(`
Payroll Details for ${employee.name}:
-------------------------------
Position: ${employee.position}
Department: ${employee.department}
Basic Salary: ₹${employee.salary}
Hours Worked: ${employee.hoursWorked}
Overtime Hours: ${employee.overtime}
Bonus: ₹${employee.bonus}
Deductions: ₹${employee.deductions}
-------------------------------
Regular Pay: ₹${payroll.regularPay}
Overtime Pay: ₹${payroll.overtimePay}
Gross Pay: ₹${payroll.grossPay}
Net Pay: ₹${payroll.netPay}
            `);
        }
    }

    showEmployeeDetails(id) {
        const employee = this.employees.find(emp => emp.id === id);
        if (employee) {
            const payroll = this.calculatePayroll(employee);
            const joinDate = new Date(employee.joinDate).toLocaleDateString();
            
            alert(`
Employee Details - ${employee.name}
---------------------------------
Position: ${employee.position}
Department: ${employee.department}
Join Date: ${joinDate}
Basic Salary: ₹${employee.salary}
Hours Worked: ${employee.hoursWorked}h
Overtime: ${employee.overtime}h
Bonus: ₹${employee.bonus}
Deductions: ₹${employee.deductions}
---------------------------------
Payroll Calculation:
Hourly Rate: ₹${payroll.hourlyRate}
Regular Pay: ₹${payroll.regularPay}
Overtime Pay: ₹${payroll.overtimePay}
Gross Pay: ₹${payroll.grossPay}
Net Pay: ₹${payroll.netPay}
            `);
        }
    }

    updatePayrollSummary() {
        const summary = document.getElementById('payrollSummary');
        if (!summary) {
            console.error('Payroll summary element not found');
            return;
        }
        
        let totalNetPay = 0;
        let totalEmployees = this.employees.length;
        let totalHours = 0;
        let totalOvertime = 0;

        this.employees.forEach(employee => {
            const payroll = this.calculatePayroll(employee);
            totalNetPay += parseFloat(payroll.netPay);
            totalHours += employee.hoursWorked;
            totalOvertime += employee.overtime;
        });

        summary.innerHTML = `
            <div class="summary-item">
                <span>Total Employees:</span>
                <span>${totalEmployees}</span>
            </div>
            <div class="summary-item">
                <span>Total Hours Worked:</span>
                <span>${totalHours.toFixed(1)}h</span>
            </div>
            <div class="summary-item">
                <span>Total Overtime:</span>
                <span>${totalOvertime.toFixed(1)}h</span>
            </div>
            <div class="summary-item">
                <span>Total Monthly Payroll:</span>
                <span class="currency-symbol">${totalNetPay.toFixed(2)}</span>
            </div>
            <div class="summary-item summary-total">
                <span>Average Salary per Employee:</span>
                <span class="currency-symbol">${totalEmployees > 0 ? (totalNetPay / totalEmployees).toFixed(2) : '0.00'}</span>
            </div>
        `;
    }

    updateSidebar() {
        // Update statistics
        const totalEmployees = this.employees.length;
        let totalNetPay = 0;
        let totalHours = 0;
        
        this.employees.forEach(employee => {
            const payroll = this.calculatePayroll(employee);
            totalNetPay += parseFloat(payroll.netPay);
            totalHours += employee.hoursWorked;
        });

        const totalEmployeesEl = document.getElementById('totalEmployees');
        const totalPayrollEl = document.getElementById('totalPayroll');
        const avgSalaryEl = document.getElementById('avgSalary');
        const totalHoursEl = document.getElementById('totalHours');

        if (totalEmployeesEl) totalEmployeesEl.textContent = totalEmployees;
        if (totalPayrollEl) totalPayrollEl.textContent = `₹${totalNetPay.toFixed(2)}`;
        if (avgSalaryEl) avgSalaryEl.textContent = `₹${totalEmployees > 0 ? (totalNetPay / totalEmployees).toFixed(2) : '0.00'}`;
        if (totalHoursEl) totalHoursEl.textContent = totalHours.toFixed(1);

        // Update department summary
        this.updateDepartmentSummary();
        
        // Update recent activity
        this.updateRecentActivity();
    }

    updateDepartmentSummary() {
        const departmentSummary = document.getElementById('departmentSummary');
        if (!departmentSummary) return;
        
        const departments = {};
        
        this.employees.forEach(employee => {
            if (!departments[employee.department]) {
                departments[employee.department] = { count: 0, totalSalary: 0 };
            }
            departments[employee.department].count++;
            departments[employee.department].totalSalary += employee.salary;
        });

        let departmentHTML = '';
        for (const [dept, data] of Object.entries(departments)) {
            departmentHTML += `
                <div class="department-item">
                    <span>${dept}</span>
                    <span>${data.count} employees</span>
                </div>
            `;
        }
        
        departmentSummary.innerHTML = departmentHTML || '<div class="no-data">No departments</div>';
    }

    updateRecentActivity() {
        const recentActivity = document.getElementById('recentActivity');
        if (!recentActivity) return;
        
        const recentActivities = this.activityLog.slice(-5).reverse();
        
        let activityHTML = '';
        recentActivities.forEach(activity => {
            const time = new Date(activity.timestamp).toLocaleTimeString();
            activityHTML += `
                <div class="activity-item">
                    <div>${activity.action}</div>
                    <small>${time}</small>
                </div>
            `;
        });
        
        recentActivity.innerHTML = activityHTML || '<div class="no-data">No recent activity</div>';
    }

    logActivity(action) {
        const activity = {
            action,
            timestamp: new Date().toISOString()
        };
        this.activityLog.push(activity);
        
        if (this.activityLog.length > 50) {
            this.activityLog = this.activityLog.slice(-50);
        }
        
        localStorage.setItem('activityLog', JSON.stringify(this.activityLog));
        this.updateRecentActivity();
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'}"></i>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    exportData() {
        const data = {
            employees: this.employees,
            summary: {
                totalEmployees: this.employees.length,
                totalPayroll: this.calculateTotalPayroll(),
                exportDate: new Date().toISOString()
            }
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `payroll-data-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        this.logActivity('Exported all data');
        this.showNotification('Data exported successfully!', 'success');
    }

    generateReport() {
        let report = `PAYROLL REPORT\nGenerated on: ${new Date().toLocaleDateString()}\n\n`;
        report += `Total Employees: ${this.employees.length}\n`;
        report += `Total Monthly Payroll: ₹${this.calculateTotalPayroll().toFixed(2)}\n\n`;
        
        this.employees.forEach(employee => {
            const payroll = this.calculatePayroll(employee);
            report += `${employee.name} (${employee.department}): ₹${payroll.netPay}\n`;
        });
        
        alert(report);
        this.logActivity('Generated payroll report');
        this.showNotification('Report generated!', 'success');
    }

    clearAllData() {
        if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
            this.employees = [];
            this.activityLog = [];
            localStorage.removeItem('employees');
            localStorage.removeItem('activityLog');
            this.renderEmployeeList();
            this.updatePayrollSummary();
            this.updateSidebar();
            this.logActivity('Cleared all data');
            this.showNotification('All data cleared!', 'success');
        }
    }

    calculateTotalPayroll() {
        return this.employees.reduce((total, employee) => {
            const payroll = this.calculatePayroll(employee);
            return total + parseFloat(payroll.netPay);
        }, 0);
    }

    saveToLocalStorage() {
        localStorage.setItem('employees', JSON.stringify(this.employees));
    }
}

// Initialize the payroll system
const payrollSystem = new EmployeePayrollSystem();