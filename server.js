const express = require('express');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 3000;

const storageDir = process.env.RENDER
  ? '/opt/render/project/src/storage'
  : __dirname;

if (!fs.existsSync(storageDir)) {
  fs.mkdirSync(storageDir, { recursive: true });
}

const DATABASE = path.join(storageDir, 'database.db');

const db = new sqlite3.Database(DATABASE, err => {
  if (err) console.error('Failed to connect to database:', err.message);
  else console.log('Connected to SQLite database');
});

const defaultOpportunities = [
  ['מנהל/ת מערכות מידע (CIO)', 'ישומים לבכירים / חברת השמה', NULL, NULL, NULL, 'עכו', 'job',
    'CIO לחברה תעשייתית גלובלית: אסטרטגיית IT, תשתיות, ERP (Infor M3), סייבר, דיגיטציה, ניהול צוות בארץ ובחברות בנות.',
    'open', 'AllJobs', '8639251', 'משרה מלאה'],

  ['מנהל/ת מערכות מידע (CIO) לארגון חברתי', 'IT Solutions LTD', NULL, NULL, NULL, 'תל אביב יפו', 'job',
    'CIO לארגון חברתי בפריסה ארצית: הובלת אסטרטגיית מערכות מידע ודיגיטל, טרנספורמציה דיגיטלית, ניהול תשתיות, ERP/CRM, BI ו-AI.',
    'open', 'AllJobs', '8623397', 'משרה מלאה'],

  ['מנהל/ת מערכות מידע לחברה יצרנית וקמעונאית', 'אורגנייז השמת עובדים בע"מ', NULL, NULL, NULL, 'קדימה צורן', 'job',
    'ניהול מלא של מערך ERP Priority, קופות ו-BI, ניהול פרויקטים וניהול 5 עובדים ועולמות אאוטסורסינג.',
    'open', 'AllJobs', '8639903', 'משרה מלאה'],

  ['מנהל/ת מערכות מידע - צפון', 'חברה חסויה', NULL, NULL, NULL, 'כרמיאל, עכו', 'job',
    'מנהל/ת מערכות מידע לחברה בינלאומית, ניסיון בחברה תעשייתית גלובלית, ניהול צוות, פיתוח והטמעת מערכות מידע.',
    'open', 'AllJobs', '8640368', 'משרה מלאה'],

  ['מנהל/ת מערכות מידע ראשי/ת', 'נת"ע - נתיבי תחבורה עירוניים', NULL, NULL, NULL, 'חולון', 'job',
    'ניהול כולל, תכנון ויישום מערכות מידע, דגש על BI, ERP, SharePoint, ניהול לו"ז, תקציב והפעלת ספקים וצוותים.',
    'open', 'AllJobs', '8629525', 'משרה מלאה'],

  ['מנהל/ת אגף מערכות מידע (CIO) לויצו העולמית', 'ויצו', NULL, NULL, NULL, 'מספר מקומות', 'job',
    'הובלה אסטרטגית של מערכות מידע, תשתיות ודיגיטל, חדשנות, BI ו-AI, ניהול צוות של כ-20 עובדים, חברות בהנהלת הארגון.',
    'open', 'AllJobs', '8629891', 'משרה מלאה'],

  ['מנהל/ת מערכות מידע Priority + O365', 'דנאל (רמלה)', NULL, NULL, NULL, 'רמלה (אזור צריפין)', 'job',
    'אחזקה, תמיכה ופיתוח של Priority ו-O365, תמיכת משתמשים, ניהול ספקים, פרויקטים, הדרכות וטיפול בתקלות.',
    'open', 'AllJobs', '8542127', 'משרה מלאה'],

  ['מנהל/ת מערכות מידע לחברה תעשייתית מובילה', 'חברה חסויה', NULL, NULL, NULL, 'אזור עכו', 'job',
    'אחריות מלאה על אסטרטגיית IT, תשתיות, ERP, סייבר ודאטה, ניהול צוות, פרויקטים חוצי ארגון ופעילות IT גלובלית.',
    'open', 'AllJobs', '8639043', 'משרה מלאה'],

  ['מנמ"ר/ית לחברת נדל"ן', 'השמה גרופ גיוס ויעוץ בע"מ', NULL, NULL, NULL, 'מספר מקומות', 'job',
    'אפיון, פיתוח, יישום והטמעה של מערכות מידע, BI, Priority, תשתיות ואבטחת מידע, אחריות תקציב ותוכניות עבודה.',
    'open', 'AllJobs', '8460664', 'משרה מלאה'],

  ['CIO - Strategic Technological Leadership Opportunity', 'שמרית אילן - גיוס והשמה', NULL, NULL, NULL, 'Petah Tikva', 'job',
    'CIO אחראי על אסטרטגיית IT ואבטחת מידע, רשתות מסווגות/לא מסווגות, ניהול סיכוני סייבר, משברים וצוותי IT ואבטחה.',
    'open', 'AllJobs', '8632153', 'Full Time'],

  ['מנהל מערכות מידע ואחזקה (IT CNC Maintenance)', 'אהרון יוסף ובניו תעשיות זיווד', NULL, NULL, NULL, 'גן יבנה (אזור אשדוד)', 'job',
    'ניהול מערכות מחשוב ושרתי הארגון (Priority, SQL, SolidWorks), תחזוקת מכונות CNC, רשתות, אבטחת מידע ותקלות ייצור.',
    'open', 'AllJobs', '8052500', 'משרה מלאה'],

  ['מנהל/ת מחלקת יישומים ארגוניים', 'תדיראן גרופ', NULL, NULL, NULL, 'פתח תקווה', 'job',
    'ניהול מקצועי של מחלקת יישומים: SAP, Priority, CRM, BI, דאטה, אוטומציות ואינטגרציות, פרויקטים חוצי ארגון וניהול צוותים.',
    'open', 'AllJobs', '8610856', 'משרה מלאה'],

  ['מטמיע/ת מערכות מידע למרכז רפואי', 'לין ביכלר', NULL, NULL, NULL, 'תל אביב יפו', 'job',
    'הטמעה והדרכה על מערכת קמיליון, ידע בסיסי באבטחת מידע, תקשורת וטלפוניה, ניסיון של מעל שנה בהטמעה.',
    'open', 'AllJobs', '8641089', 'משרה מלאה'],

  ['Senior Information Systems Developer (Priority)', 'Risco Group', NULL, NULL, NULL, 'Rishon Letsiyon', 'job',
    'פיתוח ותחזוקה של Priority ERP ו-CRM, אינטגרציות REST, ETL ואוטומציה, SQL, סביבה תעשייתית.',
    'open', 'AllJobs', '8616274', 'More than one'],

  ['מנהל/ת פיתוח CRM ארגוני', 'G-NESS', NULL, NULL, NULL, 'ירושלים (היברידי)', 'job',
    'ניהול והובלת צוותי פיתוח CRM (Salesforce, Microsoft Dynamics), תכנון וביצוע משימות פיתוח, שיפור תהליכים ומערכות.',
    'open', 'AllJobs', '8510956', 'משרה מלאה ועבודה היברידית'], 
  ['Data Analyst Intern', 'Nazareth Student Analytics', 'Maya Yassin', 'intern1@nazstudent.co.il', '04-602-2001', 'Nazareth', 'internship', 'Hands-on analytics internship for students in information systems.', 'open'],
  ['BI Intern', 'Karmiel BI Lab', 'Niv Bar', 'intern2@karmielbi.co.il', '04-602-2002', 'Karmiel', 'internship', 'Support dashboarding and KPI analysis.', 'open'],
  ['ERP Intern', 'Acre ERP Academy', 'Roei Maman', 'intern3@acreerp.co.il', '04-602-2003', 'Acre', 'internship', 'Assist ERP process mapping and support activities.', 'open'],
  ['QA Intern', 'Tirat QA Center', 'Sivan Ohana', 'intern4@tiratqa.co.il', '04-602-2004', 'Tirat Carmel', 'internship', 'Participate in testing and documentation.', 'open'],
  ['Project Management Intern', 'Afula PM Track', 'Dean Tzuberi', 'intern5@afulapm.co.il', '04-602-2005', 'Afula', 'internship', 'Help track project timelines and action items.', 'open'],
  ['CRM Optimization Project', 'Nof CRM Projects', 'Alaa Khateeb', 'project1@nofcrm.co.il', '04-603-3001', 'Nof HaGalil', 'project', 'Applied project for CRM workflow redesign and KPI tracking.', 'open'],
  ['BI Dashboard Project', 'Safed Dashboard Works', 'Lihi Vaknin', 'project2@safeddash.co.il', '04-603-3002', 'Safed', 'project', 'Create a dashboard for operational and academic reporting.', 'open'],
  ['ERP Process Mapping Project', 'Bialik ERP Studio', 'Elad Harari', 'project3@bialikerp.co.il', '04-603-3003', 'Kiryat Bialik', 'project', 'Map ERP-related business processes and recommend improvements.', 'open'],
  ['Inventory Analytics Project', 'Haifa Inventory Lab', 'Neta Ben Nun', 'project4@haifainventory.co.il', '04-603-3004', 'Haifa', 'project', 'Analyze stock and inventory data to improve planning.', 'open'],
  ['Student Placement Portal Project', 'Yokneam Placement Systems', 'Tal Ronen', 'project5@yokneamplacement.co.il', '04-603-3005', 'Yokneam', 'project', 'Build workflows for opportunity matching and placement tracking.', 'open'],
  ['Junior Business Analyst', 'Kiryat Ata Business Solutions', 'Yael Mor', 'jobs11@katabs.co.il', '04-601-1011', 'Kiryat Ata', 'job', 'Support business requirements gathering, process documentation, and reporting tasks.', 'open'],
  ['Business Systems Analyst', 'Tiberias Systems Lab', 'Omer Shalev', 'jobs12@tiberiassystems.co.il', '04-601-1012', 'Tiberias', 'job', 'Bridge business needs and technical teams through analysis, documentation, and testing support.', 'open'],
  ['Process Analyst', 'Migdal Process Works', 'Hila Rahamim', 'jobs13@migdalprocess.co.il', '04-601-1013', 'Migdal HaEmek', 'job', 'Analyze workflows and identify improvement opportunities across internal operations.', 'open'],
  ['Reporting Analyst', 'Kiryat Motzkin Reporting Hub', 'Itai Ben David', 'jobs14@motzkinreporting.co.il', '04-601-1014', 'Kiryat Motzkin', 'job', 'Prepare recurring reports, validate data, and support KPI monitoring for management teams.', 'open'],
  ['Implementation Analyst', 'Kiryat Yam Tech Delivery', 'Roni Golan', 'jobs15@kyamdelivery.co.il', '04-601-1015', 'Kiryat Yam', 'job', 'Assist in system implementation, user onboarding, and process stabilization after rollout.', 'open'],
  ['Systems Coordinator', 'Tiberias Digital Operations', 'Adva Barak', 'jobs16@tiberiasdigital.co.il', '04-601-1016', 'Tiberias', 'job', 'Coordinate system users, troubleshoot operational issues, and maintain process documentation.', 'open'],
  ['Data Quality Analyst', 'Beit Shean Data Control', 'Neta Mizrahi', 'jobs17@beitsheandata.co.il', '04-601-1017', 'Beit Shean', 'job', 'Review data consistency, detect anomalies, and improve reporting accuracy across teams.', 'open'],
  ['CRM Analyst', 'Kiryat Shmona CRM Center', 'Sahar Amar', 'jobs18@kscrm.co.il', '04-601-1018', 'Kiryat Shmona', 'job', 'Monitor CRM records, improve lead handling workflows, and support sales reporting.', 'open'],
  ['MIS Analyst', 'Nesher MIS Group', 'Galit Saadon', 'jobs19@neshermis.co.il', '04-601-1019', 'Nesher', 'job', 'Maintain management information reports and support operational analysis for decision makers.', 'open'],
  ['Requirements Analyst', 'Tamra Requirements Studio', 'Kareem Nassar', 'jobs20@tamrareq.co.il', '04-601-1020', 'Tamra', 'job', 'Document functional requirements, user stories, and process gaps for system projects.', 'open'],
  ['BI Support Intern', 'Kiryat Ata BI School', 'Noa Tahan', 'intern6@katabi.co.il', '04-602-2006', 'Kiryat Ata', 'internship', 'Support dashboard updates, report preparation, and business data validation tasks.', 'open'],
  ['Systems Analysis Intern', 'Tiberias Insight Academy', 'Amit Gabbay', 'intern7@tiberiasinsight.co.il', '04-602-2007', 'Tiberias', 'internship', 'Participate in requirements analysis and document current-state and future-state processes.', 'open'],
  ['Data Operations Intern', 'Migdal Metrics Lab', 'Sama Hamed', 'intern8@migdalmetrics.co.il', '04-602-2008', 'Migdal HaEmek', 'internship', 'Help clean datasets, validate records, and support business operations reporting.', 'open'],
  ['ERP Support Intern', 'Kiryat Motzkin ERP Center', 'Yotam Vaknin', 'intern9@motzkinerp.co.il', '04-602-2009', 'Kiryat Motzkin', 'internship', 'Assist with ERP user support, ticket tracking, and workflow documentation.', 'open'],
  ['Reporting Intern', 'Kiryat Yam Reports Lab', 'Shani Cohen', 'intern10@kyamreports.co.il', '04-602-2010', 'Kiryat Yam', 'internship', 'Prepare operational reports and support KPI follow-up with business units.', 'open'],
  ['QA Testing Intern', 'Beit Shean QA Works', 'Liel Buskila', 'intern11@beitshanqa.co.il', '04-602-2011', 'Beit Shean', 'internship', 'Execute test scenarios, log defects, and assist in release readiness checks.', 'open'],
  ['PMO Intern', 'Kiryat Shmona Project Office', 'Nadav Azulai', 'intern12@kspmo.co.il', '04-602-2012', 'Kiryat Shmona', 'internship', 'Help maintain project plans, status logs, and milestone tracking sheets.', 'open'],
  ['CRM Operations Intern', 'Nesher CRM Academy', 'Raneen Suleiman', 'intern13@neshercrm.co.il', '04-602-2013', 'Nesher', 'internship', 'Support CRM data entry standards, campaign tracking, and pipeline updates.', 'open'],
  ['Business Analyst Intern', 'Tamra Business Lab', 'Yasmin Kabha', 'intern14@tamraba.co.il', '04-602-2014', 'Tamra', 'internship', 'Shadow analysts in requirements collection, process mapping, and stakeholder notes.', 'open'],
  ['SQL Analytics Intern', 'Carmel SQL Hub', 'Ido Peri', 'intern15@carmelsql.co.il', '04-602-2015', 'Haifa', 'internship', 'Assist with SQL queries, simple reporting tasks, and data validation assignments.', 'open'],
  ['Supply Chain Analytics Project', 'Kiryat Ata Operations Studio', 'Matan Shemesh', 'project6@kaops.co.il', '04-603-3006', 'Kiryat Ata', 'project', 'Analyze supply chain metrics and propose dashboard views for inventory and fulfillment.', 'open'],
  ['Student CRM Migration Project', 'Tiberias CRM Works', 'Rivka Malul', 'project7@tiberiascrm.co.il', '04-603-3007', 'Tiberias', 'project', 'Document CRM migration needs and build a structured opportunity and contact workflow.', 'open'],
  ['Help Desk KPI Project', 'Migdal Service Analytics', 'Aviad Koren', 'project8@migdalservice.co.il', '04-603-3008', 'Migdal HaEmek', 'project', 'Measure ticket response times and create KPI dashboards for support operations.', 'open'],
  ['ERP Usage Monitoring Project', 'Motzkin ERP Insights', 'Sarit Harel', 'project9@motzkinerpinsights.co.il', '04-603-3009', 'Kiryat Motzkin', 'project', 'Track ERP usage patterns and identify gaps in adoption across departments.', 'open'],
  ['Quality Metrics Dashboard Project', 'Kiryat Yam QA Analytics', 'Tomer Dahan', 'project10@kyamqa.co.il', '04-603-3010', 'Kiryat Yam', 'project', 'Create a dashboard for defect trends, test coverage, and release quality metrics.', 'open'],
  ['Admissions Data Project', 'Beit Shean Academic Systems', 'Hodaya Ezra', 'project11@beitshanacademic.co.il', '04-603-3011', 'Beit Shean', 'project', 'Analyze applicant data and design a dashboard for admissions tracking.', 'open'],
  ['Municipal Service BI Project', 'Kiryat Shmona Civic Tech', 'Nir Avrahami', 'project12@kscivictech.co.il', '04-603-3012', 'Kiryat Shmona', 'project', 'Build BI views for municipal requests, service levels, and response trends.', 'open'],
  ['Sales Funnel Reporting Project', 'Nesher Growth Systems', 'Sapir Alfasi', 'project13@neshergrowth.co.il', '04-603-3013', 'Nesher', 'project', 'Create structured reporting for lead stages, conversions, and sales pipeline health.', 'open'],
  ['Process Documentation Project', 'Tamra Process Design', 'Rami Asad', 'project14@tamraprocess.co.il', '04-603-3014', 'Tamra', 'project', 'Map end-to-end workflows and produce clear process documentation for internal teams.', 'open'],
  ['Intern Placement Analytics Project', 'Akko Opportunity Systems', 'Michal Ben Lulu', 'project15@akkoplacement.co.il', '04-603-3015', 'Akko', 'project', 'Analyze student placement outcomes and design a reporting view for internship matching.', 'open']
];

const defaultEmployers = [
  ['מנהלת בר לב בע"מ', 'שירות למפעלים', 'מנכ"ל', 'אבנר סבן', '04-9550301', 'barlev@barlev.org'],
  ['בית תוכנה (Keysoft?)', 'בית תוכנה', 'מנכ"ל ובעלים', 'אלי סמדר', '04-9510533', 'info@keysoft.co.il'],
  ['אבן קיסר בע"מ', 'משטחי אבן מקוריים', 'מנכ"ל', 'עידן רון', '04-6109800', 'officebl@caesarstone.com'],
  ['אסטרון – מנעולי ירדני בע"מ', 'עבודות פרזול ובניין', 'מנכ"ל', 'גדעון שמי', '04-8761112', 'yafa@astron.co.il'],
  ['בז מכלולים תעופתיים בע"מ', 'מוצרי תעופה', 'מנכ"ל', 'איתן כהן', '04-9569000', 'honi@bazaircraft.com'],
  ['י.ש.ר אריזה בע"מ', 'אריזה', 'מנכ"ל', 'סיוון כפרי', '04-9558004', 'sivan@ysr.co.il'],
  ['נירוסטה צפון בע"מ', 'ייצור מוצרי נירוסטה', 'מנכ"ל', 'שלום לוי', '04-9555533', 'mazal@n-zafon.com'],
  ['ספירל סולושנס בע"מ', 'בית תוכנה', 'מנכ"ל', 'מתי זינדר', '04-9554020', 'jobs@spiralsolutions.com'],
  ['מוקד מכשירים מדויקים', 'עיבוד שבבי מדויק', 'מנכ"לים', 'דני אילון, אהוד גופר', '04-8161700', 'iris@mokedltd.com'],
  ['אלום קוסטיקה בע"מ', 'פתרונות מוצרי אלומיניום', 'מנכ"ל', 'שלומי קוסטיקה', '04-9913074', 'office@alumk.co.il'],
  ['שמרת הזורע', 'ייצור ושיווק רהיטים', 'מנכ"ל', 'קובי בן סימון', '073-2221800', 'koby@shw.co.il'],
  ['אדוה ביוטכנולוגיה', 'ביוטכנולוגיה', 'אשת קשר', 'עפרה טולדו', '050-4203998', 'info@advabio.com'],
  ['החברה למשק וכלכלה של השלטון המקומי בע"מ', 'הכנת מכרזי מסגרת לשלטון המקומי', 'יועצת כלכלית ומנהלת תפעול', 'הדסה אלמוג', '03-6235286', 'hadasaa@mashcal.co.il'],
  ['PM פרטנר מנופקטורינג בע"מ', 'חברת EMS בענף האלקטרוניקה', 'מנכ"ל', 'אליאב בן דריהן', '04-6801125', 'yuvalh@mypm.co.il'],
  ['שמר מושן בע"מ', 'Contract manufacturing', 'מנכ"ל', 'ירון איתי', '04-9911196', 'Ayelet_Nissim@jabil.com'],
  ['גולדן ריסייקלינג בע"מ', 'מיחזור בגדים וייצור סמרטוטים', 'מנכ"ל', 'אמיר גולדשטיין', '04-8468591', 'info@gold-a.co.il'],
  ['ויזואל', 'מיתוג, שיווק וקריאייטיב', 'מנכ"ל', 'אביב סמדר', '054-2468139', 'aviv@vzual.co.il'],
  ['איי או לוג\'יק בע"מ', 'פתרונות פיתוח וייצור לתעשיית האלקטרוניקה', 'אשת קשר', 'ריקי', '052-4745880', 'riki@io-logic.com'],
  ['שילובים מטאנס ברזל וצבע בע"מ', 'ייצור צבעים אקריליים לקירות', 'איש קשר', 'מרואן מטאנס', '04-9965420', 'marwanmtanes@gmail.com'],
  ['אורית רוב בע"מ', 'הנדסת בניין', 'מנכ"ל', 'אורית רוב', '04-9990350', 'office@oritrov.co.il'],
  ['פרדוקס שיווק והפצה בע"מ', 'יבוא, שיווק והפצה', 'מנכ"ל', 'לב קורשונוב', '073-3753000', 'info@wraps.co.il'],
  ['נטפון סחר בע"מ', 'יבואנית איזיפון – טלפונים למבוגרים', 'מנכ"ל', 'ערן גרטלר', '04-9919001', 'office@ths.co.il'],
  ['י.ש.ר תעשיות פלסטיק בע"מ', 'תעשיית פלסטיק', 'מנכ"ל', 'יניב שולמן', '04-9558822', 'SALES@YSR.CO.IL'],
  ['אלביט מערכות סאיקלון בע"מ', 'מוצרי תעופה', 'מנכ"ל', 'דודו וידן', '077-2940405', 'Galit.Roth@elbitsystems.com'],
  ['אמ איי פי – מוטוראד אוטומוטיב פארטס', 'חלקי חילוף לרכב', 'מנכ"ל', 'עופר שחר', '04-9914008', 'shosh@motorad.com'],
  ['א. בליצבלאו בע"מ', 'מסגרות אלומיניום ועבודות מתכת', 'מנכ"ל', 'עדי בליצבלאו', '04-8721811', 'keren@gmt-tech.com'],
  ['פלס-פיט בע"מ', 'ייצור, שיווק והתקנת מוצרי צנרת פלסטיק', 'אשת קשר', 'ליאת סבג', '052-5616155 / 04-6445585', 'L.SABAG@PLAS-FIT.COM'],
  ['גרינשפון הנדסה בע"מ', 'ממסרות, גלגלי שיניים, מנועים ומשאבות', 'מנכ"ל', 'נופר מזור', '04-9913181', 'sales@greenshpon.biz'],
  ['תומר יבוא ושיווק מוצרי מזון (1983) בע"מ', 'יבוא, שיווק והפצת מוצרי מזון', 'איש קשר', 'תומר קימלוב', '04-8455707', 'tomer@tomerltd.co.il'],
  ['ב.ל. לב חשמל בע"מ', 'ייצור לוחות חשמל', 'מנכ"ל', 'ליאור יהודה', '04-8204422', 'levhashmal@012.net.il'],
  ['אדר מזגנים (1995) בע"מ', 'מערכות קירור לתקשורת, שרתים ותעשייה', 'מנכ"ל', 'דרור ברק', '04-9022111', 'dror@adarac.co.il'],
  ['תבל ומלואה – אירועים והסעדה בע"מ', 'קייטרינג למפעלים ואירועים', 'מנכ"ל', 'טארק טאפש', '050-6610663', 'tevelmerav@gmail.com'],
  ['סטיקלר גרף בע"מ', 'ייצור מדבקות, שרוולים, תוויות ותגי קרטון', 'מנהל מכירות', 'כפיר זוהר', '04-8745444', 'kfir@stickler.co.il'],
  ['קארל צייס סמס בע"מ', 'ציוד מטרולוגיה וציוד יצור לתעשיית השבבים', 'מנכ"ל', 'ד"ר תומס שרובל', '04-9088600', 'adi.sapan@zeiss.com'],
  ['מ.י. מאכלי הצפון בע"מ', 'מזון', 'אשת קשר', 'עינת משאלי', '04-6160251', 'service@north-food.com'],
  ['עטיפית', 'ייצור יריעות ושקיות מפלסטיק ואריזות גמישות', 'מנכ"ל', 'מיכה אוברמן', '04-9852860', 'orly@rop-ltd.com'],
  ['ניו אנרג\'י ישראל', 'חימום תת-רצפתי', 'מנכ"ל', 'יוסף זיאדה', '054-6189989', 'info@newisrael.co'],
  ['מנדלסון מתכות איכות בע"מ', 'ייבוא, חיתוך ושיווק מתכות ופלדות', 'איש קשר', 'כפיר ניסים', '073-2206111', 'info@mqm.co.il'],
  ['MIS שתלים דנטליים בע"מ', 'ייצור שתלים דנטליים', 'מנכ"ל', 'אלון סדן', '04-9016800', 'servicex@mis-implants.com'],
  ['אילה פלסט בע"מ', 'מוצרי פלסטיק לחשמל', 'מנכ"ל', 'ציוני מרדכי', '04-9916091', 'ayalaplast1@gmail.com'],
  ['איי.ג\'י סולושנס בע"מ', 'פתרונות אריזה לרכיבים אלקטרוניים ורפואיים', 'מנכ"ל', 'איתמר מטליס', '073-7265308', 'itamar@igsolutions.co.il'],
  ['ח. יודשקין בע"מ', 'שירותי ביקורת והבטחת איכות בתעשיית המתכת', 'מנכ"ל', 'דניס ניימן', '04-8255925', 'dea@hy-ltd.com'],
  ['נאג\'י מח\'ול ובניו בע"מ', 'עיבוד גרעיני מאכל, תבלינים וקטניות', 'מנכ"ל', 'אליאס מח\'ול', '04-9914876', 'emakhoul@zahav.net.il'],
  ['קופרויז\'ן ישראל בע"מ', 'ייצור עדשות מגע', 'מנכ"לית', 'גלי ניר', '04-9955600', 'DRosenfeld@coopervision.co.il'],
  ['שטראוס בריאות בע"מ', 'מחלבה', 'מנכ"ל', 'חיליק כרמלי', '04-9018888', 'jobs@strauss-group.com'],
  ['GMT – גולדברגר טכנולוגיות מכניות בע"מ', 'עיבוד שבבי מדויק והרכבת מכלולים', 'מנכ"ל', 'רעות גולדברגר', '04-8307903', 'reut@gmt-tech.com'],
  ['פייטק הנדסה – פרוג\'יפ בע"מ', 'הפקת תוכן הנדסי, ייצור וזיווד מערכות', 'מנכ"ל', 'מיקי רפאל', '04-8877797', 'office@fightech.co.il'],
  ['חברה לקוסמטיקה (אלפה?)', 'קוסמטיקה, תכשיטים ואקססוריז', 'משנה למנכ"ל', 'אלי רביבו', '073-2695500', 'rotem@alpa-cosmetics.co.il'],
  ['שילת ליווי עסקי ופיננסי בע"מ', 'ליווי וייעוץ עסקי, גיוס אשראי', 'מנכ"ל', 'יעקב רוזוליו', '054-3933933', 'rotem@shilatfinancial.org'],
  ['בלורן ליין בע"מ', 'ייצור חזיתות לארונות מטבח', 'אשת קשר', 'אורטל פרנסיס', '073-2044422 / 054-2690487', 'ortal.f@bluran.co.il'],
  ['גולדשטיין אהרון בע"מ', 'שיווק ומכירת סמרטוטים ונייר', 'מנכ"ל', 'אמיר גולדשטיין', '04-8468591', 'info@gold-a.co.il'],
  ['מוחמד אבו זייד בע"מ – מאטין אלומיניום', 'פתרונות אלומיניום מתקדמים', 'מנכ"ל', 'שאהר אבו זייד', '04-9500900', 'orli@mateen.co.il']
];

function migrateOpportunitiesTable(callback) {
  db.all(`PRAGMA table_info(opportunities)`, [], (err, rows) => {
    if (err) {
      console.error('Error reading opportunities schema:', err.message);
      return callback?.(err);
    }

    const existingColumns = rows.map(r => r.name);
    const migrations = [];

    if (!existingColumns.includes('company')) migrations.push(`ALTER TABLE opportunities ADD COLUMN company TEXT`);
    if (!existingColumns.includes('contact_name')) migrations.push(`ALTER TABLE opportunities ADD COLUMN contact_name TEXT`);
    if (!existingColumns.includes('contact_email')) migrations.push(`ALTER TABLE opportunities ADD COLUMN contact_email TEXT`);
    if (!existingColumns.includes('contact_phone')) migrations.push(`ALTER TABLE opportunities ADD COLUMN contact_phone TEXT`);
    if (!existingColumns.includes('status')) migrations.push(`ALTER TABLE opportunities ADD COLUMN status TEXT DEFAULT 'open'`);

    let pending = migrations.length;
    if (pending === 0) return callback?.();

    migrations.forEach(sql => {
      db.run(sql, migrationErr => {
        if (migrationErr) console.error('Migration error:', migrationErr.message);
        else console.log('Migration applied:', sql);
        pending -= 1;
        if (pending === 0) callback?.();
      });
    });
  });
}

function normalizeOpportunitiesData() {
  db.run(`UPDATE opportunities SET status = 'open' WHERE status IS NULL`);
  db.run(`UPDATE opportunities SET company = 'N/A' WHERE company IS NULL`);
  db.run(`UPDATE opportunities SET contact_name = 'N/A' WHERE contact_name IS NULL`);
  db.run(`UPDATE opportunities SET contact_email = 'N/A' WHERE contact_email IS NULL`);
  db.run(`UPDATE opportunities SET contact_phone = 'N/A' WHERE contact_phone IS NULL`);
}

function seedOpportunities() {
  defaultOpportunities.forEach(item => {
    db.get(
      `SELECT id FROM opportunities WHERE title = ? AND company = ? AND location = ?`,
      [item[0], item[1], item[5]],
      (err, row) => {
        if (err) {
          console.error('Seed check error:', err.message);
          return;
        }
        if (!row) {
          db.run(
            `INSERT INTO opportunities
            (title, company, contact_name, contact_email, contact_phone, location, category, description, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            item,
            insertErr => {
              if (insertErr) console.error('Seed insert error:', insertErr.message);
            }
          );
        }
      }
    );
  });
}

function seedEmployers() {
  defaultEmployers.forEach(item => {
    db.get(
      `SELECT id FROM employers WHERE company_name = ?`,
      [item[0]],
      (err, row) => {
        if (err) {
          console.error('Employer seed check error:', err.message);
          return;
        }
        if (!row) {
          db.run(
            `INSERT INTO employers
            (company_name, industry, contact_role, contact_name, phone, email)
            VALUES (?, ?, ?, ?, ?, ?)`,
            item,
            insertErr => {
              if (insertErr) console.error('Employer seed insert error:', insertErr.message);
            }
          );
        }
      }
    );
  });
}

db.serialize(() => {
  db.run('PRAGMA foreign_keys = ON');

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fullname TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('student', 'graduate', 'employer', 'admin')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS opportunities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      company TEXT,
      contact_name TEXT,
      contact_email TEXT,
      contact_phone TEXT,
      location TEXT NOT NULL,
      category TEXT NOT NULL CHECK(category IN ('job', 'internship', 'project')),
      description TEXT,
      status TEXT DEFAULT 'open',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      opportunity_id INTEGER NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (opportunity_id) REFERENCES opportunities(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS employers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_name TEXT NOT NULL,
      industry TEXT,
      contact_role TEXT,
      contact_name TEXT,
      phone TEXT,
      email TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  migrateOpportunitiesTable(err => {
    if (err) return;
    normalizeOpportunitiesData();
    seedOpportunities();
    seedEmployers();
  });
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'mis-opportunity-hub-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      maxAge: 1000 * 60 * 60 * 24
    }
  })
);

app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  next();
});

function runQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

function getOne(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function getAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

async function getOpportunitiesByCategory(category) {
  return getAll(
    `
    SELECT id, title, company, contact_name, contact_email, contact_phone,
           location, category, description, status, created_at
    FROM opportunities
    WHERE category = ?
    ORDER BY id DESC
    `,
    [category]
  );
}

async function searchOpportunities(filters = {}) {
  let sql = `
    SELECT id, title, company, contact_name, contact_email, contact_phone,
           location, category, description, status, created_at
    FROM opportunities
    WHERE 1=1
  `;
  const params = [];

  if (filters.q && filters.q.trim() !== '') {
    sql += ` AND (title LIKE ? OR company LIKE ? OR description LIKE ?)`;
    const keyword = `%${filters.q.trim()}%`;
    params.push(keyword, keyword, keyword);
  }

  if (filters.category && filters.category.trim() !== '') {
    sql += ` AND category = ?`;
    params.push(filters.category.trim());
  }

  if (filters.location && filters.location.trim() !== '') {
    sql += ` AND location LIKE ?`;
    params.push(`%${filters.location.trim()}%`);
  }

  if (filters.status && filters.status.trim() !== '') {
    sql += ` AND status = ?`;
    params.push(filters.status.trim());
  }

  if (filters.company && filters.company.trim() !== '') {
    sql += ` AND company LIKE ?`;
    params.push(`%${filters.company.trim()}%`);
  }

  sql += ` ORDER BY id DESC`;
  return getAll(sql, params);
}

function requireAuth(req, res, next) {
  if (!req.session.user) return res.redirect('/login');
  next();
}

function requireRole(roles) {
  return (req, res, next) => {
    if (!req.session.user) return res.redirect('/login');
    if (!roles.includes(req.session.user.role)) {
      return res.status(403).send('Access denied');
    }
    next();
  };
}

function redirectByRole(role, res) {
  if (role === 'student') return res.redirect('/student-dashboard');
  if (role === 'graduate') return res.redirect('/graduate-dashboard');
  if (role === 'employer') return res.redirect('/employer-dashboard');
  if (role === 'admin') return res.redirect('/admin-dashboard');
  return res.redirect('/');
}

app.get('/', async (req, res) => {
  try {
    const employers = await getAll(
      `SELECT id, company_name, industry, contact_role, contact_name, phone, email
       FROM employers
       ORDER BY id DESC`
    );

    res.render('index', {
      currentPage: 'home',
      employers
    });
  } catch (error) {
    console.error('Error loading home page:', error);
    res.render('index', {
      currentPage: 'home',
      employers: []
    });
  }
});

app.get('/jobs', async (req, res) => {
  try {
    const items = await getOpportunitiesByCategory('job');
    res.render('jobs', {
      currentPage: 'jobs',
      title: 'Jobs',
      subtitle: 'Explore available jobs for Information Systems students and graduates.',
      items
    });
  } catch (error) {
    res.status(500).render('jobs', {
      currentPage: 'jobs',
      title: 'Jobs',
      subtitle: 'Explore available jobs for Information Systems students and graduates.',
      items: []
    });
  }
});

app.get('/internships', async (req, res) => {
  try {
    const items = await getOpportunitiesByCategory('internship');
    res.render('internships', {
      currentPage: 'internships',
      title: 'Internships',
      subtitle: 'Explore available internships for Information Systems students.',
      items
    });
  } catch (error) {
    res.status(500).render('internships', {
      currentPage: 'internships',
      title: 'Internships',
      subtitle: 'Explore available internships for Information Systems students.',
      items: []
    });
  }
});

app.get('/projects', async (req, res) => {
  try {
    const items = await getOpportunitiesByCategory('project');
    res.render('projects', {
      currentPage: 'projects',
      title: 'Projects',
      subtitle: 'Explore available academic and industry projects.',
      items
    });
  } catch (error) {
    res.status(500).render('projects', {
      currentPage: 'projects',
      title: 'Projects',
      subtitle: 'Explore available academic and industry projects.',
      items: []
    });
  }
});

app.get('/contact', (req, res) => {
  res.render('contact', {
    currentPage: 'contact',
    message: '',
    messageType: ''
  });
});

app.get('/search', async (req, res) => {
  try {
    const filters = {
      q: req.query.q || '',
      category: req.query.category || '',
      location: req.query.location || '',
      status: req.query.status || '',
      company: req.query.company || ''
    };

    const items = await searchOpportunities(filters);

    res.render('search', {
      currentPage: 'search',
      title: 'Advanced Search',
      filters,
      items
    });
  } catch (error) {
    console.error('Error searching opportunities:', error);
    res.status(500).render('search', {
      currentPage: 'search',
      title: 'Advanced Search',
      filters: { q: '', category: '', location: '', status: '', company: '' },
      items: []
    });
  }
});

app.post('/contact', async (req, res) => {
  const { name, email, subject, message } = req.body;

  try {
    await runQuery(
      `INSERT INTO contacts (name, email, subject, message) VALUES (?, ?, ?, ?)`,
      [name, email, subject, message]
    );

    res.render('contact', {
      currentPage: 'contact',
      message: 'Message sent successfully',
      messageType: 'success'
    });
  } catch (error) {
    res.status(500).render('contact', {
      currentPage: 'contact',
      message: 'Could not send message',
      messageType: 'error'
    });
  }
});

app.get('/login', (req, res) => {
  res.render('login', {
    currentPage: 'login',
    message: '',
    messageType: ''
  });
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await getOne('SELECT * FROM users WHERE email = ?', [email]);

    if (!user) {
      return res.status(400).render('login', {
        currentPage: 'login',
        message: 'Invalid email or password',
        messageType: 'error'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).render('login', {
        currentPage: 'login',
        message: 'Invalid email or password',
        messageType: 'error'
      });
    }

    req.session.user = {
      id: user.id,
      fullname: user.fullname,
      email: user.email,
      role: user.role
    };

    return redirectByRole(user.role, res);
  } catch (error) {
    res.status(500).render('login', {
      currentPage: 'login',
      message: 'An error occurred while logging in',
      messageType: 'error'
    });
  }
});

app.get('/signup', (req, res) => {
  res.render('signup', {
    currentPage: 'signup',
    message: '',
    messageType: ''
  });
});

app.post('/signup', async (req, res) => {
  const { fullname, email, password, role } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await runQuery(
      `INSERT INTO users (fullname, email, password, role) VALUES (?, ?, ?, ?)`,
      [fullname, email, hashedPassword, role]
    );

    req.session.user = {
      id: result.lastID,
      fullname,
      email,
      role
    };

    return redirectByRole(role, res);
  } catch (error) {
    const message = error.message.includes('UNIQUE')
      ? 'Email already exists'
      : 'Could not create account';

    res.status(400).render('signup', {
      currentPage: 'signup',
      message,
      messageType: 'error'
    });
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

app.get('/student-dashboard', requireRole(['student']), (req, res) => {
  res.render('student-dashboard', {
    currentPage: '',
    user: req.session.user
  });
});

app.get('/graduate-dashboard', requireRole(['graduate']), (req, res) => {
  res.render('graduate-dashboard', {
    currentPage: '',
    user: req.session.user
  });
});

app.get('/employer-dashboard', requireRole(['employer']), (req, res) => {
  res.render('employer-dashboard', {
    currentPage: '',
    user: req.session.user
  });
});

app.get('/admin-dashboard', requireRole(['admin']), async (req, res) => {
  try {
    const users = await getAll('SELECT * FROM users');
    const contacts = await getAll('SELECT * FROM contacts');
    const opportunities = await getAll('SELECT * FROM opportunities');

    res.render('admin-dashboard', {
      currentPage: '',
      user: req.session.user,
      stats: {
        usersCount: users.length,
        contactsCount: contacts.length,
        opportunitiesCount: opportunities.length
      }
    });
  } catch (error) {
    res.status(500).send('Error loading admin dashboard');
  }
});

app.get('/crm', requireRole(['admin']), async (req, res) => {
  try {
    const users = await getAll(
      `SELECT id, fullname, email, role, created_at
       FROM users
       ORDER BY id DESC`
    );

    const opportunities = await getAll(
      `SELECT id, title, company, contact_name, contact_email, contact_phone,
              location, category, description, status, created_at
       FROM opportunities
       ORDER BY id DESC`
    );

    const contacts = await getAll(
      `SELECT id, name, email, subject, message, created_at
       FROM contacts
       ORDER BY id DESC`
    );

    res.render('crm', {
      currentPage: '',
      users,
      opportunities,
      contacts
    });
  } catch (error) {
    console.error('Error loading CRM:', error);
    res.status(500).send('Error loading CRM');
  }
});

app.post('/delete-user/:id', requireRole(['admin']), async (req, res) => {
  const { id } = req.params;
  try {
    await runQuery('DELETE FROM users WHERE id = ?', [id]);
    res.redirect('/crm');
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).send('Error deleting user');
  }
});

app.post('/delete-opportunity/:id', requireRole(['admin']), async (req, res) => {
  const { id } = req.params;
  try {
    await runQuery('DELETE FROM opportunities WHERE id = ?', [id]);
    res.redirect('/crm');
  } catch (error) {
    console.error('Error deleting opportunity:', error);
    res.status(500).send('Error deleting opportunity');
  }
});

app.post('/delete-contact/:id', requireRole(['admin']), async (req, res) => {
  const { id } = req.params;
  try {
    await runQuery('DELETE FROM contacts WHERE id = ?', [id]);
    res.redirect('/crm');
  } catch (error) {
    console.error('Error deleting contact:', error);
    res.status(500).send('Error deleting contact');
  }
});

app.get('/profile', requireAuth, (req, res) => {
  res.json(req.session.user);
});

app.get('/api/opportunities', async (req, res) => {
  try {
    const rows = await getAll(
      `SELECT id, title, company, contact_name, contact_email, contact_phone,
              location, category, description, status, created_at
       FROM opportunities
       ORDER BY id DESC`
    );

    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.use((req, res) => {
  res.status(404).send('Page not found');
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
