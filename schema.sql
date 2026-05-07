PRAGMA foreign_keys = ON;

DROP TABLE IF EXISTS applications;
DROP TABLE IF EXISTS contacts;
DROP TABLE IF EXISTS opportunities;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fullname TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('student', 'graduate', 'employer', 'admin')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE opportunities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    company TEXT,
    contact_name TEXT,
    contact_email TEXT,
    contact_phone TEXT,
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
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
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

INSERT INTO opportunities
(title, company, contact_name, contact_email, contact_phone, location, category, description, status)
VALUES
('Business Analyst', 'Galilee Data Solutions', 'Maya Cohen', 'jobs1@galileedata.co.il', '04-601-1001', 'Haifa', 'job', 'Entry-to-junior role focused on analysis, reporting, and process improvement.', 'open'),
('Data Analyst', 'Carmel Insight Labs', 'Noam Levi', 'jobs2@carmelinsight.co.il', '04-601-1002', 'Yokneam', 'job', 'Support dashboards, KPI reporting, and SQL-based analytics for business teams.', 'open'),
('BI Analyst', 'NazTech Analytics', 'Rana Khoury', 'jobs3@naztech.co.il', '04-601-1003', 'Nazareth', 'job', 'Build reports and support decision-making processes for operations teams.', 'open'),
('ERP Support Specialist', 'Karmiel Systems Group', 'Lior Dayan', 'jobs4@karmielsystems.co.il', '04-601-1004', 'Karmiel', 'job', 'Support ERP workflows, user training, and operational data quality.', 'open'),
('Information Systems Coordinator', 'Acre Process Hub', 'Shira Azulay', 'jobs5@acreprocess.co.il', '04-601-1005', 'Acre', 'job', 'Coordinate systems users, documentation, and cross-team process updates.', 'open'),
('Project Coordinator', 'Tirat Digital Ops', 'Daniel Haddad', 'jobs6@tiratdigital.co.il', '04-601-1006', 'Tirat Carmel', 'job', 'Track project tasks, schedules, and stakeholder communication.', 'open'),
('Operations Analyst', 'Afula Metrics Center', 'Yarden Moyal', 'jobs7@afulametrics.co.il', '04-601-1007', 'Afula', 'job', 'Monitor operational KPIs and improve workflow efficiency.', 'open'),
('QA Analyst', 'Nof Quality Tech', 'Moran Peretz', 'jobs8@nofquality.co.il', '04-601-1008', 'Nof HaGalil', 'job', 'Run functional tests, document bugs, and support release quality.', 'open'),
('PMO Assistant', 'Safed PMO Partners', 'Tamar Biton', 'jobs9@safedpmo.co.il', '04-601-1009', 'Safed', 'job', 'Assist PMO reporting, status tracking, and project governance.', 'open'),
('SQL Reporting Analyst', 'Bialik Reporting House', 'Eran Malka', 'jobs10@bialikreporting.co.il', '04-601-1010', 'Kiryat Bialik', 'job', 'Create SQL reports and support analytics-driven decisions.', 'open'),

('Data Analyst Intern', 'Nazareth Student Analytics', 'Maya Yassin', 'intern1@nazstudent.co.il', '04-602-2001', 'Nazareth', 'internship', 'Hands-on analytics internship for students in information systems.', 'open'),
('BI Intern', 'Karmiel BI Lab', 'Niv Bar', 'intern2@karmielbi.co.il', '04-602-2002', 'Karmiel', 'internship', 'Support dashboarding and KPI analysis.', 'open'),
('ERP Intern', 'Acre ERP Academy', 'Roei Maman', 'intern3@acreerp.co.il', '04-602-2003', 'Acre', 'internship', 'Assist ERP process mapping and support activities.', 'open'),
('QA Intern', 'Tirat QA Center', 'Sivan Ohana', 'intern4@tiratqa.co.il', '04-602-2004', 'Tirat Carmel', 'internship', 'Participate in testing and documentation.', 'open'),
('Project Management Intern', 'Afula PM Track', 'Dean Tzuberi', 'intern5@afulapm.co.il', '04-602-2005', 'Afula', 'internship', 'Help track project timelines and action items.', 'open'),

('CRM Optimization Project', 'Nof CRM Projects', 'Alaa Khateeb', 'project1@nofcrm.co.il', '04-603-3001', 'Nof HaGalil', 'project', 'Applied project for CRM workflow redesign and KPI tracking.', 'open'),
('BI Dashboard Project', 'Safed Dashboard Works', 'Lihi Vaknin', 'project2@safeddash.co.il', '04-603-3002', 'Safed', 'project', 'Create a dashboard for operational and academic reporting.', 'open'),
('ERP Process Mapping Project', 'Bialik ERP Studio', 'Elad Harari', 'project3@bialikerp.co.il', '04-603-3003', 'Kiryat Bialik', 'project', 'Map ERP-related business processes and recommend improvements.', 'open'),
('Inventory Analytics Project', 'Haifa Inventory Lab', 'Neta Ben Nun', 'project4@haifainventory.co.il', '04-603-3004', 'Haifa', 'project', 'Analyze stock and inventory data to improve planning.', 'open'),
('Student Placement Portal Project', 'Yokneam Placement Systems', 'Tal Ronen', 'project5@yokneamplacement.co.il', '04-603-3005', 'Yokneam', 'project', 'Build workflows for opportunity matching and placement tracking.', 'open'),

('Junior Business Analyst', 'Kiryat Ata Business Solutions', 'Yael Mor', 'jobs11@katabs.co.il', '04-601-1011', 'Kiryat Ata', 'job', 'Support business requirements gathering, process documentation, and reporting tasks.', 'open'),
('Business Systems Analyst', 'Tiberias Systems Lab', 'Omer Shalev', 'jobs12@tiberiassystems.co.il', '04-601-1012', 'Tiberias', 'job', 'Bridge business needs and technical teams through analysis, documentation, and testing support.', 'open'),
('Process Analyst', 'Migdal Process Works', 'Hila Rahamim', 'jobs13@migdalprocess.co.il', '04-601-1013', 'Migdal HaEmek', 'job', 'Analyze workflows and identify improvement opportunities across internal operations.', 'open'),
('Reporting Analyst', 'Kiryat Motzkin Reporting Hub', 'Itai Ben David', 'jobs14@motzkinreporting.co.il', '04-601-1014', 'Kiryat Motzkin', 'job', 'Prepare recurring reports, validate data, and support KPI monitoring for management teams.', 'open'),
('Implementation Analyst', 'Kiryat Yam Tech Delivery', 'Roni Golan', 'jobs15@kyamdelivery.co.il', '04-601-1015', 'Kiryat Yam', 'job', 'Assist in system implementation, user onboarding, and process stabilization after rollout.', 'open'),
('Systems Coordinator', 'Tiberias Digital Operations', 'Adva Barak', 'jobs16@tiberiasdigital.co.il', '04-601-1016', 'Tiberias', 'job', 'Coordinate system users, troubleshoot operational issues, and maintain process documentation.', 'open'),
('Data Quality Analyst', 'Beit Shean Data Control', 'Neta Mizrahi', 'jobs17@beitsheandata.co.il', '04-601-1017', 'Beit Shean', 'job', 'Review data consistency, detect anomalies, and improve reporting accuracy across teams.', 'open'),
('CRM Analyst', 'Kiryat Shmona CRM Center', 'Sahar Amar', 'jobs18@kscrm.co.il', '04-601-1018', 'Kiryat Shmona', 'job', 'Monitor CRM records, improve lead handling workflows, and support sales reporting.', 'open'),
('MIS Analyst', 'Nesher MIS Group', 'Galit Saadon', 'jobs19@neshermis.co.il', '04-601-1019', 'Nesher', 'job', 'Maintain management information reports and support operational analysis for decision makers.', 'open'),
('Requirements Analyst', 'Tamra Requirements Studio', 'Kareem Nassar', 'jobs20@tamrareq.co.il', '04-601-1020', 'Tamra', 'job', 'Document functional requirements, user stories, and process gaps for system projects.', 'open'),

('BI Support Intern', 'Kiryat Ata BI School', 'Noa Tahan', 'intern6@katabi.co.il', '04-602-2006', 'Kiryat Ata', 'internship', 'Support dashboard updates, report preparation, and business data validation tasks.', 'open'),
('Systems Analysis Intern', 'Tiberias Insight Academy', 'Amit Gabbay', 'intern7@tiberiasinsight.co.il', '04-602-2007', 'Tiberias', 'internship', 'Participate in requirements analysis and document current-state and future-state processes.', 'open'),
('Data Operations Intern', 'Migdal Metrics Lab', 'Sama Hamed', 'intern8@migdalmetrics.co.il', '04-602-2008', 'Migdal HaEmek', 'internship', 'Help clean datasets, validate records, and support business operations reporting.', 'open'),
('ERP Support Intern', 'Kiryat Motzkin ERP Center', 'Yotam Vaknin', 'intern9@motzkinerp.co.il', '04-602-2009', 'Kiryat Motzkin', 'internship', 'Assist with ERP user support, ticket tracking, and workflow documentation.', 'open'),
('Reporting Intern', 'Kiryat Yam Reports Lab', 'Shani Cohen', 'intern10@kyamreports.co.il', '04-602-2010', 'Kiryat Yam', 'internship', 'Prepare operational reports and support KPI follow-up with business units.', 'open'),
('QA Testing Intern', 'Beit Shean QA Works', 'Liel Buskila', 'intern11@beitshanqa.co.il', '04-602-2011', 'Beit Shean', 'internship', 'Execute test scenarios, log defects, and assist in release readiness checks.', 'open'),
('PMO Intern', 'Kiryat Shmona Project Office', 'Nadav Azulai', 'intern12@kspmo.co.il', '04-602-2012', 'Kiryat Shmona', 'internship', 'Help maintain project plans, status logs, and milestone tracking sheets.', 'open'),
('CRM Operations Intern', 'Nesher CRM Academy', 'Raneen Suleiman', 'intern13@neshercrm.co.il', '04-602-2013', 'Nesher', 'internship', 'Support CRM data entry standards, campaign tracking, and pipeline updates.', 'open'),
('Business Analyst Intern', 'Tamra Business Lab', 'Yasmin Kabha', 'intern14@tamraba.co.il', '04-602-2014', 'Tamra', 'internship', 'Shadow analysts in requirements collection, process mapping, and stakeholder notes.', 'open'),
('SQL Analytics Intern', 'Carmel SQL Hub', 'Ido Peri', '04-602-2015', 'Haifa', 'internship', 'Assist with SQL queries, simple reporting tasks, and data validation assignments.', 'open'),

('Supply Chain Analytics Project', 'Kiryat Ata Operations Studio', 'Matan Shemesh', 'project6@kaops.co.il', '04-603-3006', 'Kiryat Ata', 'project', 'Analyze supply chain metrics and propose dashboard views for inventory and fulfillment.', 'open'),
('Student CRM Migration Project', 'Tiberias CRM Works', 'Rivka Malul', 'project7@tiberiascrm.co.il', '04-603-3007', 'Tiberias', 'project', 'Document CRM migration needs and build a structured opportunity and contact workflow.', 'open'),
('Help Desk KPI Project', 'Migdal Service Analytics', 'Aviad Koren', 'project8@migdalservice.co.il', '04-603-3008', 'Migdal HaEmek', 'project', 'Measure ticket response times and create KPI dashboards for support operations.', 'open'),
('ERP Usage Monitoring Project', 'Motzkin ERP Insights', 'Sarit Harel', 'project9@motzkinerpinsights.co.il', '04-603-3009', 'Kiryat Motzkin', 'project', 'Track ERP usage patterns and identify gaps in adoption across departments.', 'open'),
('Quality Metrics Dashboard Project', 'Kiryat Yam QA Analytics', 'Tomer Dahan', 'project10@kyamqa.co.il', '04-603-3010', 'Kiryat Yam', 'project', 'Create a dashboard for defect trends, test coverage, and release quality metrics.', 'open'),
('Admissions Data Project', 'Beit Shean Academic Systems', 'Hodaya Ezra', 'project11@beitshanacademic.co.il', '04-603-3011', 'Beit Shean', 'project', 'Analyze applicant data and design a dashboard for admissions tracking.', 'open'),
('Municipal Service BI Project', 'Kiryat Shmona Civic Tech', 'Nir Avrahami', 'project12@kscivictech.co.il', '04-603-3012', 'Kiryat Shmona', 'project', 'Build BI views for municipal requests, service levels, and response trends.', 'open'),
('Sales Funnel Reporting Project', 'Nesher Growth Systems', 'Sapir Alfasi', 'project13@neshergrowth.co.il', '04-603-3013', 'Nesher', 'project', 'Create structured reporting for lead stages, conversions, and sales pipeline health.', 'open'),
('Process Documentation Project', 'Tamra Process Design', 'Rami Asad', 'project14@tamraprocess.co.il', '04-603-3014', 'Tamra', 'project', 'Map end-to-end workflows and produce clear process documentation for internal teams.', 'open'),
('Intern Placement Analytics Project', 'Akko Opportunity Systems', 'Michal Ben Lulu', 'project15@akkoplacement.co.il', '04-603-3015', 'Akko', 'project', 'Analyze student placement outcomes and design a reporting view for internship matching.', 'open');