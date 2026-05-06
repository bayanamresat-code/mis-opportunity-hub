CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  fullname TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student','graduate','employer','admin')),
  preferred_language TEXT DEFAULT 'en',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS opportunities (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  company_name TEXT,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  location TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('job','internship','project')),
  description TEXT,
  status TEXT DEFAULT 'open',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS applications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  opportunity_id INTEGER NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS contacts (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ai_messages (
  id SERIAL PRIMARY KEY,
  user_role TEXT,
  prompt TEXT NOT NULL,
  response TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO opportunities (title, company_name, contact_name, contact_email, contact_phone, location, category, description, status)
SELECT * FROM (VALUES
  ('Business Analyst - North 1','Carmel Insights Ltd.','Noa Levi','noa.levi@carmel-insights.co.il','050-710-1001','Haifa','job','Entry-to-junior role focused on analysis, reporting, and process improvement.','open'),
  ('Data Analyst - North 2','Galilee DataWorks','Amit Ben David','amit@galileedata.co.il','050-710-1002','Yokneam','job','Support dashboards, KPI reporting, and SQL-based analytics for business teams.','open'),
  ('BI Analyst - North 3','Northern Metrics Group','Rana Khoury','rana.khoury@nmetrics.co.il','050-710-1003','Nazareth','job','Build reports and support decision-making processes for operations teams.','open'),
  ('ERP Support Specialist - North 4','Karmiel Systems House','Lior Azulay','lior.azulay@ksh.co.il','050-710-1004','Karmiel','job','Support ERP workflows, user training, and operational data quality.','open'),
  ('Information Systems Coordinator - North 5','Coastline Process Labs','Maya Hason','maya.hason@coastline-labs.co.il','050-710-1005','Acre','job','Coordinate systems users, documentation, and cross-team process updates.','open'),
  ('Project Coordinator - North 6','Harbor PMO Services','Shir Cohen','shir.cohen@harborpmo.co.il','050-710-1006','Tirat Carmel','job','Track project tasks, schedules, and stakeholder communication.','open'),
  ('Operations Analyst - North 7','Emek Operations Hub','Omer Mizrahi','omer.mizrahi@emekops.co.il','050-710-1007','Afula','job','Monitor operational KPIs and improve workflow efficiency.','open'),
  ('QA Analyst - North 8','Quality Arc Ltd.','Dana Zidan','dana.zidan@qualityarc.co.il','050-710-1008','Nof HaGalil','job','Run functional tests, document bugs, and support release quality.','open'),
  ('PMO Assistant - North 9','Safed Project Office','Yael Peretz','yael.peretz@safedpmo.co.il','050-710-1009','Safed','job','Assist PMO reporting, status tracking, and project governance.','open'),
  ('SQL Reporting Analyst - North 10','Bialik Reporting Center','Nir Vaknin','nir.vaknin@brc.co.il','050-710-1010','Kiryat Bialik','job','Create SQL reports and support analytics-driven decisions.','open'),
  ('CRM Administrator - North 11','BlueCRM Solutions','Tal Romano','tal.romano@bluecrm.co.il','050-710-1011','Haifa','job','Manage CRM data quality, pipelines, and user support.','open'),
  ('Systems Analyst - North 12','Yokneam Digital Systems','Keren Avni','keren.avni@yds.co.il','050-710-1012','Yokneam','job','Analyze system requirements and document business processes.','open'),
  ('Implementation Specialist - North 13','NazTech Deployments','Rami Awad','rami.awad@naztech.co.il','050-710-1013','Nazareth','job','Support onboarding and implementation of business systems.','open'),
  ('Junior Product Analyst - North 14','Product Pulse North','Adi Weiss','adi.weiss@productpulse.co.il','050-710-1014','Karmiel','job','Monitor product usage and build analytical summaries.','open'),
  ('Customer Success Analyst - North 15','Success Bridge Ltd.','Lena Saad','lena.saad@successbridge.co.il','050-710-1015','Acre','job','Track customer metrics and improve support workflows.','open'),
  ('Business Analyst - North 16','Tirat Strategy Works','Ofir Dayan','ofir.dayan@tsw.co.il','050-710-1016','Tirat Carmel','job','Support reporting and operational improvement initiatives.','open'),
  ('Data Analyst - North 17','Afula Insight Lab','Michal Biton','michal.biton@afulainsight.co.il','050-710-1017','Afula','job','Analyze trends and build business performance reports.','open'),
  ('BI Analyst - North 18','Galil BI Studio','Yousef Daher','yousef.daher@galilbi.co.il','050-710-1018','Nof HaGalil','job','Create visual dashboards and BI summaries.','open'),
  ('ERP Support Specialist - North 19','North ERP Care','Rivka Malka','rivka.malka@nerpcare.co.il','050-710-1019','Safed','job','Assist ERP users and operational documentation.','open'),
  ('Information Systems Coordinator - North 20','Bialik Workflow Hub','Eran Harel','eran.harel@workflowhub.co.il','050-710-1020','Kiryat Bialik','job','Coordinate system-related processes and reporting.','open'),
  ('Data Analyst Intern - Cohort 1','Nazareth Data Lab','Mira Haddad','mira.haddad@nazdatalab.co.il','050-710-1021','Nazareth','internship','Hands-on analytics internship for students in information systems.','open'),
  ('BI Intern - Cohort 2','Insight Apprentices','Noam Moyal','noam.moyal@insightapp.co.il','050-710-1022','Karmiel','internship','Support dashboarding and KPI analysis.','open'),
  ('ERP Intern - Cohort 3','Acre ERP Studio','Sivan Kadosh','sivan.kadosh@acreerp.co.il','050-710-1023','Acre','internship','Assist ERP process mapping and support activities.','open'),
  ('QA Intern - Cohort 4','BugTrack North','Rotem Segal','rotem.segal@bugtracknorth.co.il','050-710-1024','Tirat Carmel','internship','Participate in testing and documentation.','open'),
  ('Project Management Intern - Cohort 5','PM Launchpad','Eli Golan','eli.golan@pmlaunchpad.co.il','050-710-1025','Afula','internship','Help track project timelines and action items.','open'),
  ('Operations Intern - Cohort 6','Ops Forward','Hiba Salameh','hiba.salameh@opsforward.co.il','050-710-1026','Nof HaGalil','internship','Support business operations reporting and coordination.','open'),
  ('Systems Support Intern - Cohort 7','Support First North','Avigail Azulai','avigail.azulai@supportfirst.co.il','050-710-1027','Safed','internship','Assist users and document system support issues.','open'),
  ('CRM Intern - Cohort 8','CRM Growth Desk','Matan Shani','matan.shani@crmgrowth.co.il','050-710-1028','Kiryat Bialik','internship','Support CRM updates and data quality activities.','open'),
  ('Business Analysis Intern - Cohort 9','Haifa Process Partners','Shani Rosen','shani.rosen@hpp.co.il','050-710-1029','Haifa','internship','Analyze workflows and prepare business documentation.','open'),
  ('Product Intern - Cohort 10','Yokneam Product Lab','Dean Tzur','dean.tzur@yplab.co.il','050-710-1030','Yokneam','internship','Support product reporting and user feedback analysis.','open'),
  ('Data Analyst Intern - Cohort 11','Naz Insight Program','Aseel Khoury','aseel.khoury@nazinsight.co.il','050-710-1031','Nazareth','internship','Practice reporting and basic SQL analysis.','open'),
  ('BI Intern - Cohort 12','Karmiel Dashboards','Gal Malul','gal.malul@kdashboards.co.il','050-710-1032','Karmiel','internship','Prepare dashboards and summaries for teams.','open'),
  ('ERP Intern - Cohort 13','ERP Pathways','Tomer Ben Lulu','tomer.benlulu@erppathways.co.il','050-710-1033','Acre','internship','Support process improvement with ERP data.','open'),
  ('QA Intern - Cohort 14','North Release Lab','Lihi Sabag','lihi.sabag@nrlab.co.il','050-710-1034','Tirat Carmel','internship','Help validate system releases and fixes.','open'),
  ('Project Management Intern - Cohort 15','Execution Bridge','Yarden Bar','yarden.bar@executionbridge.co.il','050-710-1035','Afula','internship','Support coordination and reporting of project execution.','open'),
  ('CRM Optimization Project - Cycle 1','Galilee CRM Partners','Roei Sela','roei.sela@gcrm.co.il','050-710-1036','Nof HaGalil','project','Applied project for CRM workflow redesign and KPI tracking.','open'),
  ('BI Dashboard Project - Cycle 2','Safed Analytics Center','Hadas Elbaz','hadas.elbaz@sac.co.il','050-710-1037','Safed','project','Create a dashboard for operational and academic reporting.','open'),
  ('ERP Process Mapping Project - Cycle 3','FlowMap Systems','Shahar Friedman','shahar.friedman@flowmap.co.il','050-710-1038','Kiryat Bialik','project','Map ERP-related business processes and recommend improvements.','open'),
  ('Inventory Analytics Project - Cycle 4','Inventory IQ','Bar Katz','bar.katz@inventoryiq.co.il','050-710-1039','Haifa','project','Analyze stock and inventory data to improve planning.','open'),
  ('Student Placement Portal Project - Cycle 5','Placement Grid','Tamar Golan','tamar.golan@placementgrid.co.il','050-710-1040','Yokneam','project','Build workflows for opportunity matching and placement tracking.','open'),
  ('Recruitment Workflow Project - Cycle 6','Talent Route North','Samer Nassar','samer.nassar@talentroute.co.il','050-710-1041','Nazareth','project','Improve candidate pipeline visibility and CRM updates.','open'),
  ('Customer Service KPI Project - Cycle 7','Service Metrics House','Coral Ohana','coral.ohana@smh.co.il','050-710-1042','Karmiel','project','Track service metrics and analyze support quality.','open'),
  ('Project Tracking Dashboard - Cycle 8','Milestone Dash Ltd.','Gilad Peri','gilad.peri@milestonedash.co.il','050-710-1043','Acre','project','Build progress dashboards for active initiatives.','open'),
  ('Admissions Reporting Project - Cycle 9','Campus Reporting Works','Roni Nahum','roni.nahum@campusreporting.co.il','050-710-1044','Tirat Carmel','project','Improve admissions reporting and trend analysis.','open'),
  ('Operations Automation Project - Cycle 10','Automation Valley','Maor Dahan','maor.dahan@automationvalley.co.il','050-710-1045','Afula','project','Automate recurring reporting and approval tasks.','open'),
  ('CRM Optimization Project - Cycle 11','CRM North Scale','Nurit Aharon','nurit.aharon@crmnorthscale.co.il','050-710-1046','Nof HaGalil','project','Improve CRM data structure and status handling.','open'),
  ('BI Dashboard Project - Cycle 12','DashView Analytics','Neta Ben Ami','neta.benami@dashview.co.il','050-710-1047','Safed','project','Extend analytical reporting and chart coverage.','open'),
  ('ERP Process Mapping Project - Cycle 13','Process Canvas','Eyal Madmon','eyal.madmon@processcanvas.co.il','050-710-1048','Kiryat Bialik','project','Document ERP flow and support redesign.','open'),
  ('Inventory Analytics Project - Cycle 14','Forecast Harbor','Adva Ben Hamo','adva.benh@forecastharbor.co.il','050-710-1049','Haifa','project','Build inventory summaries and forecasting sheets.','open'),
  ('Student Placement Portal Project - Cycle 15','Bialik Portal Systems','Tamar Golan','tamar.golan@bialikportal.co.il','050-710-1050','Yokneam','project','Enhance portal matching flows and reporting.','open')
) AS seed(title, company_name, contact_name, contact_email, contact_phone, location, category, description, status)
WHERE NOT EXISTS (SELECT 1 FROM opportunities);
