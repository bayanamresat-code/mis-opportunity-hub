PRAGMA foreign_keys = ON;

DROP TABLE IF EXISTS ai_messages;
DROP TABLE IF EXISTS applications;
DROP TABLE IF EXISTS contacts;
DROP TABLE IF EXISTS opportunities;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fullname TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('student','graduate','employer','admin')),
  preferred_language TEXT DEFAULT 'en',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE opportunities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  location TEXT NOT NULL,
  category TEXT NOT NULL CHECK(category IN ('job','internship','project')),
  description TEXT,
  status TEXT DEFAULT 'open' CHECK(status IN ('open','closed','draft')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  opportunity_id INTEGER NOT NULL,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending','accepted','rejected','in_progress','completed')),
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (opportunity_id) REFERENCES opportunities(id) ON DELETE CASCADE
);

CREATE TABLE contacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ai_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_role TEXT,
  prompt TEXT NOT NULL,
  response TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO opportunities (title, location, category, description) VALUES
('Business Analyst - North 1','Haifa','job','Entry-to-junior role focused on analysis, reporting, coordination, and information systems processes in Haifa. Requires Excel/SQL, communication skills, and process thinking.'),
('Data Analyst - North 2','Yokneam','job','Entry-to-junior role focused on analysis, reporting, coordination, and information systems processes in Yokneam. Requires Excel/SQL, communication skills, and process thinking.'),
('BI Analyst - North 3','Nazareth','job','Entry-to-junior role focused on analysis, reporting, coordination, and information systems processes in Nazareth. Requires Excel/SQL, communication skills, and process thinking.'),
('ERP Support Specialist - North 4','Karmiel','job','Entry-to-junior role focused on analysis, reporting, coordination, and information systems processes in Karmiel. Requires Excel/SQL, communication skills, and process thinking.'),
('Information Systems Coordinator - North 5','Acre','job','Entry-to-junior role focused on analysis, reporting, coordination, and information systems processes in Acre. Requires Excel/SQL, communication skills, and process thinking.'),
('Project Coordinator - North 6','Tirat Carmel','job','Entry-to-junior role focused on analysis, reporting, coordination, and information systems processes in Tirat Carmel. Requires Excel/SQL, communication skills, and process thinking.'),
('Operations Analyst - North 7','Afula','job','Entry-to-junior role focused on analysis, reporting, coordination, and information systems processes in Afula. Requires Excel/SQL, communication skills, and process thinking.'),
('QA Analyst - North 8','Nof HaGalil','job','Entry-to-junior role focused on analysis, reporting, coordination, and information systems processes in Nof HaGalil. Requires Excel/SQL, communication skills, and process thinking.'),
('PMO Assistant - North 9','Safed','job','Entry-to-junior role focused on analysis, reporting, coordination, and information systems processes in Safed. Requires Excel/SQL, communication skills, and process thinking.'),
('SQL Reporting Analyst - North 10','Kiryat Bialik','job','Entry-to-junior role focused on analysis, reporting, coordination, and information systems processes in Kiryat Bialik. Requires Excel/SQL, communication skills, and process thinking.'),
('CRM Administrator - North 11','Haifa','job','Entry-to-junior role focused on analysis, reporting, coordination, and information systems processes in Haifa. Requires Excel/SQL, communication skills, and process thinking.'),
('Systems Analyst - North 12','Yokneam','job','Entry-to-junior role focused on analysis, reporting, coordination, and information systems processes in Yokneam. Requires Excel/SQL, communication skills, and process thinking.'),
('Implementation Specialist - North 13','Nazareth','job','Entry-to-junior role focused on analysis, reporting, coordination, and information systems processes in Nazareth. Requires Excel/SQL, communication skills, and process thinking.'),
('Junior Product Analyst - North 14','Karmiel','job','Entry-to-junior role focused on analysis, reporting, coordination, and information systems processes in Karmiel. Requires Excel/SQL, communication skills, and process thinking.'),
('Customer Success Analyst - North 15','Acre','job','Entry-to-junior role focused on analysis, reporting, coordination, and information systems processes in Acre. Requires Excel/SQL, communication skills, and process thinking.'),
('Business Analyst - North 16','Tirat Carmel','job','Entry-to-junior role focused on analysis, reporting, coordination, and information systems processes in Tirat Carmel. Requires Excel/SQL, communication skills, and process thinking.'),
('Data Analyst - North 17','Afula','job','Entry-to-junior role focused on analysis, reporting, coordination, and information systems processes in Afula. Requires Excel/SQL, communication skills, and process thinking.'),
('BI Analyst - North 18','Nof HaGalil','job','Entry-to-junior role focused on analysis, reporting, coordination, and information systems processes in Nof HaGalil. Requires Excel/SQL, communication skills, and process thinking.'),
('ERP Support Specialist - North 19','Safed','job','Entry-to-junior role focused on analysis, reporting, coordination, and information systems processes in Safed. Requires Excel/SQL, communication skills, and process thinking.'),
('Information Systems Coordinator - North 20','Kiryat Bialik','job','Entry-to-junior role focused on analysis, reporting, coordination, and information systems processes in Kiryat Bialik. Requires Excel/SQL, communication skills, and process thinking.'),
('Data Analyst Intern - Cohort 1','Karmiel','internship','Hands-on internship for students in information systems, analytics, QA, ERP, or operations in Karmiel. Supports reporting, documentation, and process improvement.'),
('BI Intern - Cohort 2','Acre','internship','Hands-on internship for students in information systems, analytics, QA, ERP, or operations in Acre. Supports reporting, documentation, and process improvement.'),
('ERP Intern - Cohort 3','Tirat Carmel','internship','Hands-on internship for students in information systems, analytics, QA, ERP, or operations in Tirat Carmel. Supports reporting, documentation, and process improvement.'),
('QA Intern - Cohort 4','Afula','internship','Hands-on internship for students in information systems, analytics, QA, ERP, or operations in Afula. Supports reporting, documentation, and process improvement.'),
('Project Management Intern - Cohort 5','Nof HaGalil','internship','Hands-on internship for students in information systems, analytics, QA, ERP, or operations in Nof HaGalil. Supports reporting, documentation, and process improvement.'),
('Operations Intern - Cohort 6','Safed','internship','Hands-on internship for students in information systems, analytics, QA, ERP, or operations in Safed. Supports reporting, documentation, and process improvement.'),
('Systems Support Intern - Cohort 7','Kiryat Bialik','internship','Hands-on internship for students in information systems, analytics, QA, ERP, or operations in Kiryat Bialik. Supports reporting, documentation, and process improvement.'),
('CRM Intern - Cohort 8','Haifa','internship','Hands-on internship for students in information systems, analytics, QA, ERP, or operations in Haifa. Supports reporting, documentation, and process improvement.'),
('Business Analysis Intern - Cohort 9','Yokneam','internship','Hands-on internship for students in information systems, analytics, QA, ERP, or operations in Yokneam. Supports reporting, documentation, and process improvement.'),
('Product Intern - Cohort 10','Nazareth','internship','Hands-on internship for students in information systems, analytics, QA, ERP, or operations in Nazareth. Supports reporting, documentation, and process improvement.'),
('Data Analyst Intern - Cohort 11','Karmiel','internship','Hands-on internship for students in information systems, analytics, QA, ERP, or operations in Karmiel. Supports reporting, documentation, and process improvement.'),
('BI Intern - Cohort 12','Acre','internship','Hands-on internship for students in information systems, analytics, QA, ERP, or operations in Acre. Supports reporting, documentation, and process improvement.'),
('ERP Intern - Cohort 13','Tirat Carmel','internship','Hands-on internship for students in information systems, analytics, QA, ERP, or operations in Tirat Carmel. Supports reporting, documentation, and process improvement.'),
('QA Intern - Cohort 14','Afula','internship','Hands-on internship for students in information systems, analytics, QA, ERP, or operations in Afula. Supports reporting, documentation, and process improvement.'),
('Project Management Intern - Cohort 15','Nof HaGalil','internship','Hands-on internship for students in information systems, analytics, QA, ERP, or operations in Nof HaGalil. Supports reporting, documentation, and process improvement.'),
('CRM Optimization Project - Cycle 1','Tirat Carmel','project','Applied project in Tirat Carmel focused on workflow design, dashboarding, CRM/ERP improvement, or KPI tracking. Suitable for students and graduates.'),
('BI Dashboard Project - Cycle 2','Afula','project','Applied project in Afula focused on workflow design, dashboarding, CRM/ERP improvement, or KPI tracking. Suitable for students and graduates.'),
('ERP Process Mapping Project - Cycle 3','Nof HaGalil','project','Applied project in Nof HaGalil focused on workflow design, dashboarding, CRM/ERP improvement, or KPI tracking. Suitable for students and graduates.'),
('Inventory Analytics Project - Cycle 4','Safed','project','Applied project in Safed focused on workflow design, dashboarding, CRM/ERP improvement, or KPI tracking. Suitable for students and graduates.'),
('Student Placement Portal Project - Cycle 5','Kiryat Bialik','project','Applied project in Kiryat Bialik focused on workflow design, dashboarding, CRM/ERP improvement, or KPI tracking. Suitable for students and graduates.'),
('Recruitment Workflow Project - Cycle 6','Haifa','project','Applied project in Haifa focused on workflow design, dashboarding, CRM/ERP improvement, or KPI tracking. Suitable for students and graduates.'),
('Customer Service KPI Project - Cycle 7','Yokneam','project','Applied project in Yokneam focused on workflow design, dashboarding, CRM/ERP improvement, or KPI tracking. Suitable for students and graduates.'),
('Project Tracking Dashboard - Cycle 8','Nazareth','project','Applied project in Nazareth focused on workflow design, dashboarding, CRM/ERP improvement, or KPI tracking. Suitable for students and graduates.'),
('Admissions Reporting Project - Cycle 9','Karmiel','project','Applied project in Karmiel focused on workflow design, dashboarding, CRM/ERP improvement, or KPI tracking. Suitable for students and graduates.'),
('Operations Automation Project - Cycle 10','Acre','project','Applied project in Acre focused on workflow design, dashboarding, CRM/ERP improvement, or KPI tracking. Suitable for students and graduates.'),
('CRM Optimization Project - Cycle 11','Tirat Carmel','project','Applied project in Tirat Carmel focused on workflow design, dashboarding, CRM/ERP improvement, or KPI tracking. Suitable for students and graduates.'),
('BI Dashboard Project - Cycle 12','Afula','project','Applied project in Afula focused on workflow design, dashboarding, CRM/ERP improvement, or KPI tracking. Suitable for students and graduates.'),
('ERP Process Mapping Project - Cycle 13','Nof HaGalil','project','Applied project in Nof HaGalil focused on workflow design, dashboarding, CRM/ERP improvement, or KPI tracking. Suitable for students and graduates.'),
('Inventory Analytics Project - Cycle 14','Safed','project','Applied project in Safed focused on workflow design, dashboarding, CRM/ERP improvement, or KPI tracking. Suitable for students and graduates.'),
('Student Placement Portal Project - Cycle 15','Kiryat Bialik','project','Applied project in Kiryat Bialik focused on workflow design, dashboarding, CRM/ERP improvement, or KPI tracking. Suitable for students and graduates.');
