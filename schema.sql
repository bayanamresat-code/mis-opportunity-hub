PRAGMA foreign_keys = ON;

DROP TABLE IF EXISTS aimessages;
DROP TABLE IF EXISTS applications;
DROP TABLE IF EXISTS contacts;
DROP TABLE IF EXISTS opportunities;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fullname TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student', 'graduate', 'employer', 'admin')),
  preferred_language TEXT DEFAULT 'en',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE opportunities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  company_name TEXT,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  location TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('job', 'internship', 'project')),
  description TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed', 'draft')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  opportunity_id INTEGER NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'in-progress', 'completed')),
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

CREATE TABLE aimessages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_role TEXT,
  prompt TEXT NOT NULL,
  response TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users (fullname, email, password, role, preferred_language) VALUES
('Admin User', 'admin@example.com', '$2b$10$abcdefghijklmnopqrstuv123456789012345678901234567890', 'admin', 'en'),
('Student Demo', 'student@example.com', '$2b$10$abcdefghijklmnopqrstuv123456789012345678901234567890', 'student', 'en'),
('Graduate Demo', 'graduate@example.com', '$2b$10$abcdefghijklmnopqrstuv123456789012345678901234567890', 'graduate', 'en'),
('Employer Demo', 'employer@example.com', '$2b$10$abcdefghijklmnopqrstuv123456789012345678901234567890', 'employer', 'en');

INSERT INTO opportunities (title, company_name, contact_name, contact_email, contact_phone, location, category, description, status) VALUES
('Business Analyst - North 1', 'Galilee Insights Ltd.', 'Noa Levi', 'noa.levi@galileeinsights.co.il', '050-700-1001', 'Haifa', 'job', 'Entry-to-junior role focused on analysis, reporting, coordination, and information systems processes in Haifa. Requires Excel, SQL, communication skills, and process thinking.', 'open'),
('Data Analyst - North 2', 'Carmel DataWorks', 'Omer Cohen', 'omer.cohen@carmeldataworks.co.il', '050-700-1002', 'Yokneam', 'job', 'Entry-to-junior role focused on analysis, reporting, coordination, and information systems processes in Yokneam. Requires Excel, SQL, communication skills, and process thinking.', 'open'),
('BI Analyst - North 3', 'Nazareth BI Solutions', 'Rana Khoury', 'rana.khoury@nazbi.co.il', '050-700-1003', 'Nazareth', 'job', 'Entry-to-junior role focused on analysis, reporting, coordination, and information systems processes in Nazareth. Requires Excel, SQL, communication skills, and process thinking.', 'open'),
('ERP Support Specialist - North 4', 'Karmiel Process Tech', 'Daniel Mizrahi', 'daniel.mizrahi@kpt.co.il', '050-700-1004', 'Karmiel', 'job', 'Entry-to-junior role focused on analysis, reporting, coordination, and information systems processes in Karmiel. Requires Excel, SQL, communication skills, and process thinking.', 'open'),
('Information Systems Coordinator - North 5', 'Acre Systems Hub', 'Maya Haddad', 'maya.haddad@acresystems.co.il', '050-700-1005', 'Acre', 'job', 'Entry-to-junior role focused on analysis, reporting, coordination, and information systems processes in Acre. Requires Excel, SQL, communication skills, and process thinking.', 'open'),
('Project Coordinator - North 6', 'Tirat Projects Group', 'Eitan Bar', 'eitan.bar@tiratprojects.co.il', '050-700-1006', 'Tirat Carmel', 'job', 'Entry-to-junior role focused on analysis, reporting, coordination, and information systems processes in Tirat Carmel. Requires Excel, SQL, communication skills, and process thinking.', 'open'),
('Operations Analyst - North 7', 'Afula Operations Lab', 'Shir Azulay', 'shir.azulay@afulaops.co.il', '050-700-1007', 'Afula', 'job', 'Entry-to-junior role focused on analysis, reporting, coordination, and information systems processes in Afula. Requires Excel, SQL, communication skills, and process thinking.', 'open'),
('QA Analyst - North 8', 'Nof QA Dynamics', 'Karim Nassar', 'karim.nassar@nofqa.co.il', '050-700-1008', 'Nof HaGalil', 'job', 'Entry-to-junior role focused on analysis, reporting, coordination, and information systems processes in Nof HaGalil. Requires Excel, SQL, communication skills, and process thinking.', 'open'),
('PMO Assistant - North 9', 'Safed PMO Center', 'Lior Ben Ami', 'lior.benami@safedpmo.co.il', '050-700-1009', 'Safed', 'job', 'Entry-to-junior role focused on analysis, reporting, coordination, and information systems processes in Safed. Requires Excel, SQL, communication skills, and process thinking.', 'open'),
('SQL Reporting Analyst - North 10', 'Kiryat Reports Ltd.', 'Tamar Golan', 'tamar.golan@kiryatreports.co.il', '050-700-1010', 'Kiryat Bialik', 'job', 'Entry-to-junior role focused on analysis, reporting, coordination, and information systems processes in Kiryat Bialik. Requires Excel, SQL, communication skills, and process thinking.', 'open'),
('CRM Administrator - North 11', 'Haifa CRM Experts', 'Ariel Dahan', 'ariel.dahan@haifacrm.co.il', '050-700-1011', 'Haifa', 'job', 'Entry-to-junior role focused on analysis, reporting, coordination, and information systems processes in Haifa. Requires Excel, SQL, communication skills, and process thinking.', 'open'),
('Systems Analyst - North 12', 'Yokneam Systems House', 'Yasmin Abu Saleh', 'yasmin.abusaleh@yoksystems.co.il', '050-700-1012', 'Yokneam', 'job', 'Entry-to-junior role focused on analysis, reporting, coordination, and information systems processes in Yokneam. Requires Excel, SQL, communication skills, and process thinking.', 'open'),
('Implementation Specialist - North 13', 'Nazareth Implementers', 'Aviad Peretz', 'aviad.peretz@nazimplement.co.il', '050-700-1013', 'Nazareth', 'job', 'Entry-to-junior role focused on analysis, reporting, coordination, and information systems processes in Nazareth. Requires Excel, SQL, communication skills, and process thinking.', 'open'),
('Junior Product Analyst - North 14', 'Karmiel Product Metrics', 'Sivan Mor', 'sivan.mor@kpmetrics.co.il', '050-700-1014', 'Karmiel', 'job', 'Entry-to-junior role focused on analysis, reporting, coordination, and information systems processes in Karmiel. Requires Excel, SQL, communication skills, and process thinking.', 'open'),
('Customer Success Analyst - North 15', 'Acre Service Analytics', 'Rami Saad', 'rami.saad@acreservice.co.il', '050-700-1015', 'Acre', 'job', 'Entry-to-junior role focused on analysis, reporting, coordination, and information systems processes in Acre. Requires Excel, SQL, communication skills, and process thinking.', 'open'),
('Business Analyst - North 16', 'Carmel Business Flow', 'Hila Yosef', 'hila.yosef@carmelflow.co.il', '050-700-1016', 'Tirat Carmel', 'job', 'Entry-to-junior role focused on analysis, reporting, coordination, and information systems processes in Tirat Carmel. Requires Excel, SQL, communication skills, and process thinking.', 'open'),
('Data Analyst - North 17', 'Afula Insight Systems', 'Muhammad Jabareen', 'muhammad.jabareen@afulainsight.co.il', '050-700-1017', 'Afula', 'job', 'Entry-to-junior role focused on analysis, reporting, coordination, and information systems processes in Afula. Requires Excel, SQL, communication skills, and process thinking.', 'open'),
('BI Analyst - North 18', 'Galil Dashboards', 'Adi Malka', 'adi.malka@galildash.co.il', '050-700-1018', 'Nof HaGalil', 'job', 'Entry-to-junior role focused on analysis, reporting, coordination, and information systems processes in Nof HaGalil. Requires Excel, SQL, communication skills, and process thinking.', 'open'),
('ERP Support Specialist - North 19', 'Safed ERP Link', 'Nour Zaher', 'nour.zaher@saferplink.co.il', '050-700-1019', 'Safed', 'job', 'Entry-to-junior role focused on analysis, reporting, coordination, and information systems processes in Safed. Requires Excel, SQL, communication skills, and process thinking.', 'open'),
('Information Systems Coordinator - North 20', 'Bialik InfoCore', 'Guy Rahamim', 'guy.rahamim@infocore.co.il', '050-700-1020', 'Kiryat Bialik', 'job', 'Entry-to-junior role focused on analysis, reporting, coordination, and information systems processes in Kiryat Bialik. Requires Excel, SQL, communication skills, and process thinking.', 'open'),
('Data Analyst Intern - Cohort 1', 'Karmiel Student Labs', 'Noa Levi', 'interns1@kstudentlabs.co.il', '050-710-2001', 'Karmiel', 'internship', 'Hands-on internship for students in information systems, analytics, QA, ERP, or operations in Karmiel. Supports reporting, documentation, and process improvement.', 'open'),
('BI Intern - Cohort 2', 'Acre BI Studio', 'Omer Cohen', 'interns2@acrebi.co.il', '050-710-2002', 'Acre', 'internship', 'Hands-on internship for students in information systems, analytics, QA, ERP, or operations in Acre. Supports reporting, documentation, and process improvement.', 'open'),
('ERP Intern - Cohort 3', 'Tirat ERP Academy', 'Rana Khoury', 'interns3@tiraterp.co.il', '050-710-2003', 'Tirat Carmel', 'internship', 'Hands-on internship for students in information systems, analytics, QA, ERP, or operations in Tirat Carmel. Supports reporting, documentation, and process improvement.', 'open'),
('QA Intern - Cohort 4', 'Afula QA Works', 'Daniel Mizrahi', 'interns4@afulaqa.co.il', '050-710-2004', 'Afula', 'internship', 'Hands-on internship for students in information systems, analytics, QA, ERP, or operations in Afula. Supports reporting, documentation, and process improvement.', 'open'),
('Project Management Intern - Cohort 5', 'Nof Projects School', 'Maya Haddad', 'interns5@nofprojects.co.il', '050-710-2005', 'Nof HaGalil', 'internship', 'Hands-on internship for students in information systems, analytics, QA, ERP, or operations in Nof HaGalil. Supports reporting, documentation, and process improvement.', 'open'),
('Operations Intern - Cohort 6', 'Safed Operations Lab', 'Eitan Bar', 'interns6@safedops.co.il', '050-710-2006', 'Safed', 'internship', 'Hands-on internship for students in information systems, analytics, QA, ERP, or operations in Safed. Supports reporting, documentation, and process improvement.', 'open'),
('Systems Support Intern - Cohort 7', 'Bialik Support Center', 'Shir Azulay', 'interns7@bialiksupport.co.il', '050-710-2007', 'Kiryat Bialik', 'internship', 'Hands-on internship for students in information systems, analytics, QA, ERP, or operations in Kiryat Bialik. Supports reporting, documentation, and process improvement.', 'open'),
('CRM Intern - Cohort 8', 'Haifa CRM Campus', 'Karim Nassar', 'interns8@haifacrmcampus.co.il', '050-710-2008', 'Haifa', 'internship', 'Hands-on internship for students in information systems, analytics, QA, ERP, or operations in Haifa. Supports reporting, documentation, and process improvement.', 'open'),
('Business Analysis Intern - Cohort 9', 'Yokneam Analysts Hub', 'Lior Ben Ami', 'interns9@yokhub.co.il', '050-710-2009', 'Yokneam', 'internship', 'Hands-on internship for students in information systems, analytics, QA, ERP, or operations in Yokneam. Supports reporting, documentation, and process improvement.', 'open'),
('Product Intern - Cohort 10', 'Nazareth Product House', 'Tamar Golan', 'interns10@nazproduct.co.il', '050-710-2010', 'Nazareth', 'internship', 'Hands-on internship for students in information systems, analytics, QA, ERP, or operations in Nazareth. Supports reporting, documentation, and process improvement.', 'open'),
('Data Analyst Intern - Cohort 11', 'Karmiel Student Labs', 'Ariel Dahan', 'interns11@kstudentlabs.co.il', '050-710-2011', 'Karmiel', 'internship', 'Hands-on internship for students in information systems, analytics, QA, ERP, or operations in Karmiel. Supports reporting, documentation, and process improvement.', 'open'),
('BI Intern - Cohort 12', 'Acre BI Studio', 'Yasmin Abu Saleh', 'interns12@acrebi.co.il', '050-710-2012', 'Acre', 'internship', 'Hands-on internship for students in information systems, analytics, QA, ERP, or operations in Acre. Supports reporting, documentation, and process improvement.', 'open'),
('ERP Intern - Cohort 13', 'Tirat ERP Academy', 'Aviad Peretz', 'interns13@tiraterp.co.il', '050-710-2013', 'Tirat Carmel', 'internship', 'Hands-on internship for students in information systems, analytics, QA, ERP, or operations in Tirat Carmel. Supports reporting, documentation, and process improvement.', 'open'),
('QA Intern - Cohort 14', 'Afula QA Works', 'Sivan Mor', 'interns14@afulaqa.co.il', '050-710-2014', 'Afula', 'internship', 'Hands-on internship for students in information systems, analytics, QA, ERP, or operations in Afula. Supports reporting, documentation, and process improvement.', 'open'),
('Project Management Intern - Cohort 15', 'Nof Projects School', 'Rami Saad', 'interns15@nofprojects.co.il', '050-710-2015', 'Nof HaGalil', 'internship', 'Hands-on internship for students in information systems, analytics, QA, ERP, or operations in Nof HaGalil. Supports reporting, documentation, and process improvement.', 'open'),
('CRM Optimization Project - Cycle 1', 'Tirat Project Studio', 'Hila Yosef', 'projects1@tiratstudio.co.il', '050-720-3001', 'Tirat Carmel', 'project', 'Applied project in Tirat Carmel focused on workflow design, dashboarding, CRM/ERP improvement, or KPI tracking. Suitable for students and graduates.', 'open'),
('BI Dashboard Project - Cycle 2', 'Afula Data Projects', 'Muhammad Jabareen', 'projects2@afuladata.co.il', '050-720-3002', 'Afula', 'project', 'Applied project in Afula focused on workflow design, dashboarding, CRM/ERP improvement, or KPI tracking. Suitable for students and graduates.', 'open'),
('ERP Process Mapping Project - Cycle 3', 'Nof Process Design', 'Adi Malka', 'projects3@nofprocess.co.il', '050-720-3003', 'Nof HaGalil', 'project', 'Applied project in Nof HaGalil focused on workflow design, dashboarding, CRM/ERP improvement, or KPI tracking. Suitable for students and graduates.', 'open'),
('Inventory Analytics Project - Cycle 4', 'Safed Inventory Labs', 'Nour Zaher', 'projects4@safedinventory.co.il', '050-720-3004', 'Safed', 'project', 'Applied project in Safed focused on workflow design, dashboarding, CRM/ERP improvement, or KPI tracking. Suitable for students and graduates.', 'open'),
('Student Placement Portal Project - Cycle 5', 'Bialik Portal Systems', 'Guy Rahamim', 'projects5@bialikportal.co.il', '050-720-3005', 'Kiryat Bialik', 'project', 'Applied project in Kiryat Bialik focused on workflow design, dashboarding, CRM/ERP improvement, or KPI tracking. Suitable for students and graduates.', 'open'),
('Recruitment Workflow Project - Cycle 6', 'Haifa Recruitment Tech', 'Noa Levi', 'projects6@haifarecruit.co.il', '050-720-3006', 'Haifa', 'project', 'Applied project in Haifa focused on workflow design, dashboarding, CRM/ERP improvement, or KPI tracking. Suitable for students and graduates.', 'open'),
('Customer Service KPI Project - Cycle 7', 'Yokneam KPI Works', 'Omer Cohen', 'projects7@yokkpi.co.il', '050-720-3007', 'Yokneam', 'project', 'Applied project in Yokneam focused on workflow design, dashboarding, CRM/ERP improvement, or KPI tracking. Suitable for students and graduates.', 'open'),
('Project Tracking Dashboard - Cycle 8', 'Nazareth PM Studio', 'Rana Khoury', 'projects8@nazpm.co.il', '050-720-3008', 'Nazareth', 'project', 'Applied project in Nazareth focused on workflow design, dashboarding, CRM/ERP improvement, or KPI tracking. Suitable for students and graduates.', 'open'),
('Admissions Reporting Project - Cycle 9', 'Karmiel Academic BI', 'Daniel Mizrahi', 'projects9@kacademicbi.co.il', '050-720-3009', 'Karmiel', 'project', 'Applied project in Karmiel focused on workflow design, dashboarding, CRM/ERP improvement, or KPI tracking. Suitable for students and graduates.', 'open'),
('Operations Automation Project - Cycle 10', 'Acre Automation Hub', 'Maya Haddad', 'projects10@acreautomation.co.il', '050-720-3010', 'Acre', 'project', 'Applied project in Acre focused on workflow design, dashboarding, CRM/ERP improvement, or KPI tracking. Suitable for students and graduates.', 'open'),
('CRM Optimization Project - Cycle 11', 'Tirat Project Studio', 'Eitan Bar', 'projects11@tiratstudio.co.il', '050-720-3011', 'Tirat Carmel', 'project', 'Applied project in Tirat Carmel focused on workflow design, dashboarding, CRM/ERP improvement, or KPI tracking. Suitable for students and graduates.', 'open'),
('BI Dashboard Project - Cycle 12', 'Afula Data Projects', 'Shir Azulay', 'projects12@afuladata.co.il', '050-720-3012', 'Afula', 'project', 'Applied project in Afula focused on workflow design, dashboarding, CRM/ERP improvement, or KPI tracking. Suitable for students and graduates.', 'open'),
('ERP Process Mapping Project - Cycle 13', 'Nof Process Design', 'Karim Nassar', 'projects13@nofprocess.co.il', '050-720-3013', 'Nof HaGalil', 'project', 'Applied project in Nof HaGalil focused on workflow design, dashboarding, CRM/ERP improvement, or KPI tracking. Suitable for students and graduates.', 'open'),
('Inventory Analytics Project - Cycle 14', 'Safed Inventory Labs', 'Lior Ben Ami', 'projects14@safedinventory.co.il', '050-720-3014', 'Safed', 'project', 'Applied project in Safed focused on workflow design, dashboarding, CRM/ERP improvement, or KPI tracking. Suitable for students and graduates.', 'open'),
('Student Placement Portal Project - Cycle 15', 'Bialik Portal Systems', 'Tamar Golan', 'projects15@bialikportal.co.il', '050-720-3015', 'Kiryat Bialik', 'project', 'Applied project in Kiryat Bialik focused on workflow design, dashboarding, CRM/ERP improvement, or KPI tracking. Suitable for students and graduates.', 'open');
