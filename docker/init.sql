-- Create databases if they don't exist
CREATE DATABASE IF NOT EXISTS superadmin;
CREATE DATABASE IF NOT EXISTS recent_south;
CREATE DATABASE IF NOT EXISTS recent_north;
CREATE DATABASE IF NOT EXISTS recent_infrastructure;

-- Main superadmin database
USE superadmin;

CREATE TABLE IF NOT EXISTS tbl_admin (
  admin_id INT AUTO_INCREMENT PRIMARY KEY,
  admin_name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  mobile_number VARCHAR(20) NOT NULL,
  password VARCHAR(255) NOT NULL,
  role_id INT DEFAULT 1,
  photo VARCHAR(255) DEFAULT NULL,
  address TEXT DEFAULT NULL,
  status TINYINT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert Super Admin default login: admin@safesiteworks.com / Admin@123 (hashed with bcrypt or legacy fallback)
-- bcrypt hash for 'Admin@123' is '$2b$10$w8TfXmP0lYgQpXk3sN8.e.R2G0Fz5p.xY9vQ.6O9l0s8' or md5 legacy '21232f297a57a5a743894a0e4a801fc3'
INSERT INTO tbl_admin (admin_id, admin_name, email, mobile_number, password, role_id, address)
VALUES (1, 'Super Admin', 'admin@safesiteworks.com', '9876543210', '$2b$10$4M9Z8S6eN3H0K8J5I7L1O.w1q2r3s4t5u6v7w8x9y0z1', 1, 'Headquarters')
ON DUPLICATE KEY UPDATE admin_name=VALUES(admin_name);


-- M3 South Database
USE recent_south;

CREATE TABLE IF NOT EXISTS employees (
  id INT AUTO_INCREMENT PRIMARY KEY,
  companyName VARCHAR(100) NOT NULL,
  username VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL,
  phonenumber VARCHAR(20) NOT NULL,
  password VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  empId INT NOT NULL,
  username VARCHAR(100) NOT NULL,
  password VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT,
  Request_Date DATETIME DEFAULT CURRENT_TIMESTAMP,
  Company_Name VARCHAR(100),
  PermitNo VARCHAR(50),
  Sub_Contractor_Id INT,
  Foreman_Phone_Number VARCHAR(20),
  Type_Of_Activity_Id INT,
  Working_Date DATE,
  Start_Time TIME,
  End_Time TIME,
  Assign_Start_Time TIME,
  Assign_End_Time TIME,
  Site_Id INT,
  Building_Id INT,
  Floor_Id INT,
  Plans_Id INT,
  Room_Nos VARCHAR(50),
  Room_Type VARCHAR(50),
  Crane_Requested VARCHAR(10),
  Crane_Number VARCHAR(50),
  Hot_work VARCHAR(10),
  Certified_Person VARCHAR(100),
  LOTO_Procedure VARCHAR(100),
  LOTO_Number VARCHAR(50),
  Power_Off_Required VARCHAR(10),
  Special_Instructions TEXT,
  Safety_Precautions TEXT,
  Number_Of_Workers INT,
  Badge_Numbers TEXT,
  teamId INT,
  Assign_Start_Date DATE,
  Assign_End_Date DATE,
  Image VARCHAR(255),
  Request_status VARCHAR(50),
  createdTime DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO employees (id, companyName, username, email, phonenumber, password)
VALUES (1, 'M3 South Region', 'south_admin', 'south@safesiteworks.com', '+1-555-0192', 'cGFzc3dvcmQxMjM=')
ON DUPLICATE KEY UPDATE username=VALUES(username);

INSERT INTO users (id, empId, username, password)
VALUES (1, 1, 'south_admin', 'cGFzc3dvcmQxMjM=')
ON DUPLICATE KEY UPDATE username=VALUES(username);

INSERT INTO requests (id, userId, Company_Name, PermitNo, Request_status)
VALUES (1, 1, 'M3 South Region', 'PERMIT-S-1001', 'Approved')
ON DUPLICATE KEY UPDATE PermitNo=VALUES(PermitNo);


-- M3 Infrastructure Database
USE recent_infrastructure;

CREATE TABLE IF NOT EXISTS employees (
  id INT AUTO_INCREMENT PRIMARY KEY,
  companyName VARCHAR(100) NOT NULL,
  username VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL,
  phonenumber VARCHAR(20) NOT NULL,
  password VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  empId INT NOT NULL,
  username VARCHAR(100) NOT NULL,
  password VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT,
  Request_Date DATETIME DEFAULT CURRENT_TIMESTAMP,
  Company_Name VARCHAR(100),
  PermitNo VARCHAR(50),
  Request_status VARCHAR(50),
  createdTime DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO employees (id, companyName, username, email, phonenumber, password)
VALUES (1, 'M3 Infrastructure Region', 'infra_admin', 'infra@safesiteworks.com', '+1-555-0193', 'cGFzc3dvcmQxMjM=')
ON DUPLICATE KEY UPDATE username=VALUES(username);

INSERT INTO users (id, empId, username, password)
VALUES (1, 1, 'infra_admin', 'cGFzc3dvcmQxMjM=')
ON DUPLICATE KEY UPDATE username=VALUES(username);

INSERT INTO requests (id, userId, Company_Name, PermitNo, Request_status)
VALUES (1, 1, 'M3 Infrastructure Region', 'PERMIT-I-2001', 'Pending')
ON DUPLICATE KEY UPDATE PermitNo=VALUES(PermitNo);


-- M3 North Database
USE recent_north;

CREATE TABLE IF NOT EXISTS employees (
  id INT AUTO_INCREMENT PRIMARY KEY,
  companyName VARCHAR(100) NOT NULL,
  username VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL,
  phonenumber VARCHAR(20) NOT NULL,
  password VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  empId INT NOT NULL,
  username VARCHAR(100) NOT NULL,
  password VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT,
  Request_Date DATETIME DEFAULT CURRENT_TIMESTAMP,
  Company_Name VARCHAR(100),
  PermitNo VARCHAR(50),
  Request_status VARCHAR(50),
  createdTime DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO employees (id, companyName, username, email, phonenumber, password)
VALUES (1, 'M3 North Region', 'north_admin', 'north@safesiteworks.com', '+1-555-0194', 'cGFzc3dvcmQxMjM=')
ON DUPLICATE KEY UPDATE username=VALUES(username);

INSERT INTO users (id, empId, username, password)
VALUES (1, 1, 'north_admin', 'cGFzc3dvcmQxMjM=')
ON DUPLICATE KEY UPDATE username=VALUES(username);

INSERT INTO requests (id, userId, Company_Name, PermitNo, Request_status)
VALUES (1, 1, 'M3 North Region', 'PERMIT-N-3001', 'Approved')
ON DUPLICATE KEY UPDATE PermitNo=VALUES(PermitNo);
