-- Create Database
CREATE DATABASE employee_payroll_system;
USE employee_payroll_system;

-- Department Table
CREATE TABLE departments (
    dept_id INT PRIMARY KEY AUTO_INCREMENT,
    dept_name VARCHAR(100) NOT NULL,
    dept_location VARCHAR(100)
);

-- Employee Table
CREATE TABLE employees (
    emp_id INT PRIMARY KEY AUTO_INCREMENT,
    emp_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(15),
    gender ENUM('Male','Female','Other'),
    dob DATE,
    hire_date DATE,
    job_title VARCHAR(100),
    basic_salary DECIMAL(10,2),
    dept_id INT,
    FOREIGN KEY (dept_id) REFERENCES departments(dept_id)
);

-- Attendance Table
CREATE TABLE attendance (
    attendance_id INT PRIMARY KEY AUTO_INCREMENT,
    emp_id INT,
    attendance_date DATE,
    status ENUM('Present','Absent','Leave'),
    FOREIGN KEY (emp_id) REFERENCES employees(emp_id)
);

-- Allowances Table
CREATE TABLE allowances (
    allowance_id INT PRIMARY KEY AUTO_INCREMENT,
    emp_id INT,
    hra DECIMAL(10,2),
    da DECIMAL(10,2),
    ta DECIMAL(10,2),
    bonus DECIMAL(10,2),
    FOREIGN KEY (emp_id) REFERENCES employees(emp_id)
);

-- Deductions Table
CREATE TABLE deductions (
    deduction_id INT PRIMARY KEY AUTO_INCREMENT,
    emp_id INT,
    pf DECIMAL(10,2),
    tax DECIMAL(10,2),
    insurance DECIMAL(10,2),
    FOREIGN KEY (emp_id) REFERENCES employees(emp_id)
);

-- Payroll Table
CREATE TABLE payroll (
    payroll_id INT PRIMARY KEY AUTO_INCREMENT,
    emp_id INT,
    month VARCHAR(20),
    year INT,
    gross_salary DECIMAL(10,2),
    total_deductions DECIMAL(10,2),
    net_salary DECIMAL(10,2),
    generated_date DATE,
    FOREIGN KEY (emp_id) REFERENCES employees(emp_id)
);

-- Users Table
CREATE TABLE users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE,
    password VARCHAR(100),
    role ENUM('Admin','HR')
);

-- Activity Log Table
CREATE TABLE activity_log (
    log_id INT PRIMARY KEY AUTO_INCREMENT,
    action TEXT NOT NULL,
    type VARCHAR(50),
    user_id VARCHAR(100),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert Departments
INSERT INTO departments (dept_name, dept_location)
VALUES 
('HR', 'Kolkata'),
('IT', 'Bangalore'),
('Sales', 'Delhi'),
('Finance', 'Mumbai');

-- Insert Employees
INSERT INTO employees 
(emp_name, email, phone, gender, dob, hire_date, job_title, basic_salary, dept_id)
VALUES
('Sudip Maity', 'sudip.hr@gmail.com', '9000000001', 'Male', '1999-02-15', '2023-01-10', 'HR Manager', 28000, 1),
('Surajit Pramanik', 'surajit.it@gmail.com', '9000000002', 'Male', '1998-06-20', '2023-02-05', 'Software Developer', 35000, 2),
('Kanchan Mathato', 'kanchan.sales@gmail.com', '9000000003', 'Male', '1997-11-10', '2023-03-12', 'Sales Executive', 25000, 3),
('Sankhadip Pari', 'sankhadip.it@gmail.com', '9000000004', 'Male', '1999-09-25', '2023-04-01', 'System Analyst', 33000, 2),
('Ayan Karmakar', 'ayan.finance@gmail.com', '9000000005', 'Male', '1998-01-18', '2023-05-15', 'Accountant', 30000, 4);

-- Insert Allowances
INSERT INTO allowances (emp_id, hra, da, ta, bonus)
VALUES
(1, 4000, 2500, 1500, 1000),
(2, 6000, 3000, 2000, 2000),
(3, 3500, 2000, 1500, 800),
(4, 5500, 2800, 1800, 1500),
(5, 4500, 2600, 1600, 1200);

-- Insert Deductions
INSERT INTO deductions (emp_id, pf, tax, insurance)
VALUES
(1, 1800, 1200, 500),
(2, 2200, 1800, 700),
(3, 1500, 1000, 400),
(4, 2100, 1600, 600),
(5, 2000, 1400, 500);

-- Admin User
INSERT INTO users (username, password, role)
VALUES ('admin', 'admin123', 'Admin');


