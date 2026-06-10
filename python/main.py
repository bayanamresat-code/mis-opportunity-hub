import re
import os
import requests
from bs4 import BeautifulSoup
import psycopg2

# ========== הגדרות ==========
DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql://postgresql_jztr_user:XKajGhxhz6OY25fXrROMzBAbGYHfp42s@dpg-d7tnfmosfn5c73enlgq0-a.oregon-postgres.render.com/postgresql_jztr"
)

IS_KEYWORDS = [
    "מערכות מידע", "מנתח מערכות", "מיישם מערכות",
    "ERP", "CRM", "SQL", "BI", "Data Analyst",
    "Business Analyst", "Help Desk", "תמיכה טכנית",
    "Priority", "SAP", "אפיון", "דוחות", "Power BI",
    "Excel", "Database",
]
# ============================


def is_north_job(text):
    text = str(text).lower()
    north_words = [
        "חיפה", "קריות", "קרית", "קריית", "עכו", "נהריה",
        "כרמיאל", "צפת", "טבריה", "קריית שמונה", "קצרין",
        "עפולה", "נוף הגליל", "נצרת", "מעלות", "יוקנעם",
        "גליל", "גולן", "צפון", "הצפון"
    ]
    bad_locations = [
        "תל אביב", "רמת גן", "גבעתיים", "פתח תקווה",
        "ראשון לציון", "חולון", "בת ים", "הרצליה",
        "ירושלים", "באר שבע", "אשדוד", "מרכז", "דרום"
    ]
    has_north = any(word in text for word in north_words)
    has_bad = any(word in text for word in bad_locations)
    return has_north and not has_bad


def is_real_job(text):
    text = str(text).lower()
    job_words = [
        "דרוש", "דרושה", "דרושים", "משרה", "עבודה",
        "job", "jobs", "hiring", "career", "הגש מועמדות"
    ]
    is_words = [
        "מערכות מידע", "מנתח מערכות", "מיישם",
        "sql", "bi", "power bi", "erp", "crm",
        "data analyst", "business analyst", "sap",
        "priority", "database", "help desk"
    ]
    bad_words = [
        "חדשות", "כתבה", "ראיון", "ספורט", "פוליטיקה",
        "מלחמה", "תאונה", "רכילות", "פרסום", "ynet",
        "וואלה", "mako", "ישראל היום"
    ]
    has_job_word = any(word in text for word in job_words)
    has_is_word = any(word in text for word in is_words)
    has_bad_word = any(word in text for word in bad_words)
    return has_job_word and has_is_word and not has_bad_word


def calculate_score(text):
    score = 0
    text = str(text).lower()
    for keyword in IS_KEYWORDS:
        if keyword.lower() in text:
            score += 20
    return min(score, 100)


def extract_requirements(text):
    requirements = []
    for keyword in IS_KEYWORDS:
        if keyword.lower() in str(text).lower():
            requirements.append(keyword)
    return ", ".join(requirements)


def classify_job(score):
    if score >= 60:
        return "התאמה גבוהה למערכות מידע"
    elif score >= 30:
        return "התאמה בינונית"
    else:
        return "התאמה נמוכה"


def extract_email(text):
    match = re.search(r"[\w\.-]+@[\w\.-]+\.\w+", str(text))
    return match.group(0) if match else None


def extract_phone(text):
    match = re.search(r"0\d{1,2}-?\d{7}", str(text))
    return match.group(0) if match else None


def fetch_jobs_from_source(source_name, base_url, search_terms):
    jobs = []
    for term in search_terms:
        url = base_url.format(term=term.replace(' ', '%20' if 'drushim' in base_url else '+'))
        try:
            response = requests.get(url, headers={"User-Agent": "Mozilla/5.0"}, timeout=15)
            soup = BeautifulSoup(response.text, "html.parser")
            for card in soup.find_all(["div", "article", "li"]):
                text = card.get_text(" ", strip=True)
                if not is_real_job(text) or not is_north_job(text):
                    continue
                jobs.append({
                    "title": text[:80],
                    "company": "לא ידוע",
                    "location": "צפון / לבדוק במודעה",
                    "description": text[:1000],
                    "source_url": url,
                    "source": source_name
                })
        except Exception as e:
            print(f"שגיאה ב-{source_name}: {e}")
    return jobs


def fetch_all_jobs():
    search_terms = [
        "מערכות מידע", "מיישם מערכות מידע", "מנתח מערכות",
        "Data Analyst", "SQL", "Power BI", "ERP", "BI",
    ]

    drushim_jobs = fetch_jobs_from_source(
        "Drushim",
        "https://www.drushim.co.il/jobs/search/{term}/",
        search_terms
    )
    print(f"נמשכו {len(drushim_jobs)} משרות מ-Drushim")

    jobmaster_jobs = fetch_jobs_from_source(
        "JobMaster",
        "https://www.jobmaster.co.il/jobs/?q={term}",
        search_terms
    )
    print(f"נמשכו {len(jobmaster_jobs)} משרות מ-JobMaster")

    return drushim_jobs + jobmaster_jobs


def save_jobs_to_postgres(jobs):
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()
    added = 0
    skipped = 0
    seen = set()

    for job in jobs:
        title = str(job.get("title", "")).strip()
        company = str(job.get("company", "")).strip()
        location = str(job.get("location", "")).strip()
        description = str(job.get("description", "")).strip()
        source_url = str(job.get("source_url", "")).strip()
        source = str(job.get("source", "")).strip()

        full_text = f"{title} {company} {location} {description}"

        if not is_real_job(full_text) or not is_north_job(full_text):
            continue

        job_key = (title.lower(), company.lower(), source.lower())
        if job_key in seen:
            continue
        seen.add(job_key)

        # בדוק אם קיים בבסיס הנתונים
        cursor.execute(
            "SELECT id FROM opportunities WHERE title = %s AND company = %s AND source = %s",
            (title, company, source)
        )
        if cursor.fetchone():
            skipped += 1
            continue

        score = calculate_score(full_text)
        category = classify_job(score)
        contact_email = extract_email(full_text)
        contact_phone = extract_phone(full_text)
        requirements = extract_requirements(full_text)

        cursor.execute("""
            INSERT INTO opportunities
            (title, company, contact_name, contact_email, contact_phone,
             location, category, description, status, source, external_job_id, employment_type)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            title, company, None,
            contact_email, contact_phone,
            location, category,
            f"{description[:500]}\nדרישות: {requirements}",
            "open", source, source_url, None
        ))
        added += 1
        print(f"  ✓ נוסף: {title} [{source}]")

    conn.commit()
    cursor.close()
    conn.close()
    print(f"\nסה\"כ: {added} נוספו, {skipped} כבר קיימים")
    return added


def main():
    print("🔍 מתחיל שליפת משרות מ-Drushim ו-JobMaster...")
    jobs = fetch_all_jobs()
    print(f"\nסה\"כ לפני סינון: {len(jobs)}")

    print("\n💾 שומר ל-PostgreSQL...")
    save_jobs_to_postgres(jobs)
    print("\n✅ הושלם!")


if __name__ == "__main__":
    main()
