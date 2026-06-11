const express = require('express');
const cors = require('cors');
const db = require('./config/database');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// ✅ Login endpoint
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({
            success: false,
            error: 'Username and password are required'
        });
    }
    
    // Demo credentials - in production use database with hashed passwords
    const validCredentials = [
        { username: 'admin', password: 'admin123', role: 'admin' },
        { username: 'manager', password: 'manager123', role: 'manager' },
        { username: 'hr', password: 'hr123', role: 'hr' }
    ];
    
    const user = validCredentials.find(cred => 
        cred.username === username && cred.password === password
    );
    
    if (!user) {
        return res.status(401).json({
            success: false,
            error: 'Invalid username or password'
        });
    }
    
    res.json({
        success: true,
        message: 'Login successful',
        user: {
            username: user.username,
            role: user.role
        }
    });
});

// ✅ Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        message: 'Payroll System API is running!', 
        timestamp: new Date().toISOString() 
    });
});

// ✅ Test database connection
app.get('/api/test-db', async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT 1 + 1 AS result');
        res.json({ 
            success: true, 
            message: 'Database connection successful',
            data: rows[0]
        });
    } catch (error) {
        console.error('Database connection error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Database connection failed',
            details: error.message 
        });
    }
});

// ✅ Get all employees
app.get('/api/employees', async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT 
                e.emp_id AS id,
                e.emp_name AS name,
                e.email,
                e.phone,
                e.gender,
                e.dob,
                e.hire_date,
                e.job_title AS position,
                e.basic_salary AS salary,
                d.dept_name AS department
            FROM employees e
            LEFT JOIN departments d ON e.dept_id = d.dept_id
            ORDER BY e.emp_id DESC
        `);
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Error fetching employees:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch employees',
            details: error.message 
        });
    }
});

// ✅ Get employee by ID
app.get('/api/employees/:id', async (req, res) => {
    try {
        const [rows] = await db.execute(
            `SELECT 
                e.emp_id AS id,
                e.emp_name AS name,
                e.email,
                e.phone,
                e.gender,
                e.dob,
                e.hire_date,
                e.job_title AS position,
                e.basic_salary AS salary,
                d.dept_name AS department
            FROM employees e
            LEFT JOIN departments d ON e.dept_id = d.dept_id
            WHERE e.emp_id = ?`,
            [req.params.id]
        );
        
        if (rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Employee not found' 
            });
        }
        
        res.json({ success: true, data: rows[0] });
    } catch (error) {
        console.error('Error fetching employee:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch employee',
            details: error.message 
        });
    }
});

// ✅ Create new employee
app.post('/api/employees', async (req, res) => {
    try {
        const { name, position, dept_id, salary, email, phone, gender, dob, hire_date } = req.body;
        
        // Validation
        if (!name || !position || !salary) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: name, position, salary'
            });
        }
        
        const [result] = await db.execute(
            `INSERT INTO employees 
            (emp_name, job_title, dept_id, basic_salary, email, phone, gender, dob, hire_date) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                name, 
                position, 
                dept_id || null, 
                salary, 
                email || '', 
                phone || '',
                gender || null,
                dob || null,
                hire_date || null
            ]
        );
        
        // Log activity
        await db.execute(
            'INSERT INTO activity_log (action, type, user_id) VALUES (?, ?, ?)',
            [`Created employee: ${name}`, 'CREATE', 'admin']
        );
        
        // Get the created employee
        const [rows] = await db.execute(
            `SELECT 
                e.emp_id AS id,
                e.emp_name AS name,
                e.email,
                e.phone,
                e.gender,
                e.dob,
                e.hire_date,
                e.job_title AS position,
                e.basic_salary AS salary,
                d.dept_name AS department
            FROM employees e
            LEFT JOIN departments d ON e.dept_id = d.dept_id
            WHERE e.emp_id = ?`,
            [result.insertId]
        );
        
        res.status(201).json({ 
            success: true, 
            data: rows[0],
            message: 'Employee created successfully'
        });
    } catch (error) {
        console.error('Error creating employee:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to create employee',
            details: error.message 
        });
    }
});

// ✅ Update employee
app.put('/api/employees/:id', async (req, res) => {
    try {
        const { name, position, dept_id, salary, email, phone, gender, dob, hire_date } = req.body;
        
        // Check if employee exists
        const [checkRows] = await db.execute(
            'SELECT emp_id FROM employees WHERE emp_id = ?',
            [req.params.id]
        );
        
        if (checkRows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Employee not found' 
            });
        }
        
        const [result] = await db.execute(
            `UPDATE employees 
            SET emp_name = ?, job_title = ?, dept_id = ?, basic_salary = ?, 
                email = ?, phone = ?, gender = ?, dob = ?, hire_date = ?
            WHERE emp_id = ?`,
            [
                name || null, position || null, dept_id || null, salary || null, 
                email || '', phone || '', gender || null, dob || null, hire_date || null,
                req.params.id
            ]
        );
        
        // Log activity
        await db.execute(
            'INSERT INTO activity_log (action, type, user_id) VALUES (?, ?, ?)',
            [`Updated employee: ${name} (ID: ${req.params.id})`, 'UPDATE', 'admin']
        );
        
        // Get updated employee
        const [rows] = await db.execute(
            `SELECT 
                e.emp_id AS id,
                e.emp_name AS name,
                e.email,
                e.phone,
                e.gender,
                e.dob,
                e.hire_date,
                e.job_title AS position,
                e.basic_salary AS salary,
                d.dept_name AS department
            FROM employees e
            LEFT JOIN departments d ON e.dept_id = d.dept_id
            WHERE e.emp_id = ?`,
            [req.params.id]
        );
        
        res.json({ 
            success: true, 
            data: rows[0],
            message: 'Employee updated successfully'
        });
    } catch (error) {
        console.error('Error updating employee:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to update employee',
            details: error.message 
        });
    }
});

// ✅ Delete employee
app.delete('/api/employees/:id', async (req, res) => {
    try {
        // Get employee name before deletion for logging
        const [employeeRows] = await db.execute(
            'SELECT emp_name FROM employees WHERE emp_id = ?',
            [req.params.id]
        );
        
        if (employeeRows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Employee not found' 
            });
        }
        
        const employeeName = employeeRows[0].emp_name;
        
        // Delete employee
        const [result] = await db.execute(
            'DELETE FROM employees WHERE emp_id = ?',
            [req.params.id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Employee not found' 
            });
        }
        
        // Log activity
        await db.execute(
            'INSERT INTO activity_log (action, type, user_id) VALUES (?, ?, ?)',
            [`Deleted employee: ${employeeName} (ID: ${req.params.id})`, 'DELETE', 'admin']
        );
        
        res.json({ 
            success: true, 
            message: 'Employee deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting employee:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to delete employee',
            details: error.message 
        });
    }
});

// ✅ Get activity log
app.get('/api/activity', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const offset = parseInt(req.query.offset) || 0;
        
        const [rows] = await db.execute(`
            SELECT * FROM activity_log 
            ORDER BY timestamp DESC 
            LIMIT ? OFFSET ?
        `, [limit, offset]);
        
        // Get total count
        const [countRows] = await db.execute('SELECT COUNT(*) as total FROM activity_log');
        
        res.json({ 
            success: true, 
            data: rows,
            pagination: {
                total: countRows[0].total,
                limit,
                offset
            }
        });
    } catch (error) {
        console.error('Error fetching activity log:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch activity log',
            details: error.message 
        });
    }
});

// ✅ Get department statistics
app.get('/api/departments/stats', async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT 
                COALESCE(d.dept_name, 'Unassigned') as department,
                COUNT(e.emp_id) as employee_count,
                COALESCE(SUM(e.basic_salary),0) as total_salary,
                COALESCE(AVG(e.basic_salary),0) as average_salary,
                COALESCE(MIN(e.basic_salary),0) as min_salary,
                COALESCE(MAX(e.basic_salary),0) as max_salary
            FROM departments d
            LEFT JOIN employees e ON e.dept_id = d.dept_id
            GROUP BY d.dept_name
            ORDER BY employee_count DESC
        `);
        
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Error fetching department stats:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch department statistics',
            details: error.message 
        });
    }
});

// ✅ Get payroll summary
app.get('/api/payroll/summary', async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT 
                COUNT(*) as total_employees,
                COALESCE(SUM(basic_salary),0) as total_salary,
                COALESCE(AVG(basic_salary),0) as average_salary
            FROM employees
        `);
        
        const summary = rows[0];
        
        // Calculate payroll details (gross/net totals)
        const payrollDetails = await calculatePayrollSummary();
        
        res.json({ 
            success: true, 
            data: {
                ...summary,
                ...payrollDetails
            }
        });
    } catch (error) {
        console.error('Error fetching payroll summary:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch payroll summary',
            details: error.message 
        });
    }
});

// ✅ Get payroll details for all employees
app.get('/api/payroll/details', async (req, res) => {
    try {
        const [employees] = await db.execute(`
            SELECT 
                e.emp_id AS id,
                e.emp_name AS name,
                e.job_title AS position,
                d.dept_name AS department,
                e.basic_salary AS base_salary,
                COALESCE(a.hra,0) AS hra,
                COALESCE(a.da,0) AS da,
                COALESCE(a.ta,0) AS ta,
                COALESCE(a.bonus,0) AS bonus,
                COALESCE(dd.pf,0) AS pf,
                COALESCE(dd.tax,0) AS tax,
                COALESCE(dd.insurance,0) AS insurance,
                e.email, e.phone
            FROM employees e
            LEFT JOIN allowances a ON e.emp_id = a.emp_id
            LEFT JOIN deductions dd ON e.emp_id = dd.emp_id
            LEFT JOIN departments d ON e.dept_id = d.dept_id
            ORDER BY e.emp_name
        `);
        
        const payrollDetails = employees.map(employee => {
            const base = parseFloat(employee.base_salary || 0);
            const allowances = parseFloat(employee.hra || 0) + parseFloat(employee.da || 0) + parseFloat(employee.ta || 0) + parseFloat(employee.bonus || 0);
            const deductions = parseFloat(employee.pf || 0) + parseFloat(employee.tax || 0) + parseFloat(employee.insurance || 0);
            const grossPay = base + allowances;
            const netPay = grossPay - deductions;
            
            return {
                ...employee,
                gross_pay: grossPay.toFixed(2),
                net_pay: netPay.toFixed(2)
            };
        });
        
        res.json({ 
            success: true, 
            data: payrollDetails 
        });
    } catch (error) {
        console.error('Error fetching payroll details:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch payroll details',
            details: error.message 
        });
    }
});

// ✅ Search employees
app.get('/api/employees/search/:query', async (req, res) => {
    try {
        const q = `%${req.params.query}%`;
        const [rows] = await db.execute(`
            SELECT 
                e.emp_id AS id,
                e.emp_name AS name,
                e.email,
                e.phone,
                e.job_title AS position,
                d.dept_name AS department
            FROM employees e
            LEFT JOIN departments d ON e.dept_id = d.dept_id
            WHERE e.emp_name LIKE ? 
               OR e.email LIKE ? 
               OR e.phone LIKE ? 
               OR e.job_title LIKE ? 
               OR d.dept_name LIKE ?
            ORDER BY e.emp_name
        `, [q, q, q, q, q]);
        
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Error searching employees:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to search employees',
            details: error.message 
        });
    }
});

// Helper function to calculate payroll summary
async function calculatePayrollSummary() {
    try {
        const [rows] = await db.execute(`
            SELECT 
                e.emp_id,
                e.basic_salary AS base,
                COALESCE(a.hra,0) AS hra,
                COALESCE(a.da,0) AS da,
                COALESCE(a.ta,0) AS ta,
                COALESCE(a.bonus,0) AS bonus,
                COALESCE(d.pf,0) AS pf,
                COALESCE(d.tax,0) AS tax,
                COALESCE(d.insurance,0) AS insurance
            FROM employees e
            LEFT JOIN allowances a ON e.emp_id = a.emp_id
            LEFT JOIN deductions d ON e.emp_id = d.emp_id
        `);

        let totalGrossPay = 0;
        let totalNetPay = 0;

        rows.forEach(r => {
            const base = parseFloat(r.base || 0);
            const allowances = parseFloat(r.hra) + parseFloat(r.da) + parseFloat(r.ta) + parseFloat(r.bonus);
            const deductions = parseFloat(r.pf) + parseFloat(r.tax) + parseFloat(r.insurance);
            const gross = base + allowances;
            const net = gross - deductions;
            totalGrossPay += gross;
            totalNetPay += net;
        });

        return {
            total_gross_pay: totalGrossPay.toFixed(2),
            total_net_pay: totalNetPay.toFixed(2)
        };
    } catch (error) {
        console.error('Error calculating payroll summary:', error);
        return {
            total_gross_pay: '0.00',
            total_net_pay: '0.00'
        };
    }
}

// ✅ Get system statistics
app.get('/api/stats', async (req, res) => {
    try {
        const [
            employeeCount,
            departmentStats,
            todaysActivity
        ] = await Promise.all([
            db.execute('SELECT COUNT(*) as count FROM employees'),
            db.execute('SELECT COUNT(*) as count FROM departments'),
            db.execute('SELECT COUNT(*) as count FROM activity_log WHERE DATE(timestamp) = CURDATE()')
        ]);
        
        res.json({
            success: true,
            data: {
                total_employees: employeeCount[0][0].count,
                total_departments: departmentStats[0][0].count,
                todays_activities: todaysActivity[0][0].count,
                server_time: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Error fetching system stats:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch system statistics',
            details: error.message
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        available_endpoints: [
            'GET  /api/health',
            'GET  /api/test-db',
            'GET  /api/employees',
            'GET  /api/employees/:id',
            'POST /api/employees',
            'PUT  /api/employees/:id',
            'DELETE /api/employees/:id',
            'GET  /api/activity',
            'GET  /api/departments/stats',
            'GET  /api/payroll/summary',
            'GET  /api/payroll/details',
            'GET  /api/employees/search/:query',
            'GET  /api/stats'
        ]
    });
});

// Start server
const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 Payroll System API ready!`);
    console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🔗 Test DB connection: http://localhost:${PORT}/api/test-db`);
    console.log(`📝 Available endpoints:`);
    console.log(`   GET  /api/employees`);
    console.log(`   GET  /api/employees/:id`);
    console.log(`   POST /api/employees`);
    console.log(`   PUT  /api/employees/:id`);
    console.log(`   DELETE /api/employees/:id`);
});

// Graceful error handling for server startup
server.on('error', err => {
    if (err && err.code === 'EADDRINUSE') {
        console.error(`✖ Port ${PORT} is already in use (EADDRINUSE).`);
        console.error('  → To free the port on Windows:');
        console.error('      1) Run:  netstat -ano | findstr :' + PORT);
        console.error('      2) Note the PID and run: taskkill /PID <pid> /F');
        console.error('  → Or start with a different port: set PORT=3001 && npm start   (CMD)');
        console.error("    Or in PowerShell: $env:PORT=3001; npm start");
        process.exit(1);
    }
    console.error('Server error:', err);
});

// Handle shutdown signals
process.on('SIGINT', () => {
    console.log('\nGracefully shutting down...');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});