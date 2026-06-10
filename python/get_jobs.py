import os
import subprocess
import pandas as pd
import psycopg2

# ========== הגדרות ==========
DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql://postgresql_jztr_user:XKajGhxhz6OY25fXrROMzBAbGYHfp42s@dpg-d7tnfmosfn5c73enlgq0-a.oregon-postgres.render.com/postgresql_jztr"
)
EXCEL_FILE = "jobs_from_site.xlsx"
# ============================


def fetch_jobs():
    print("🔗 מתחבר לבסיס הנתונים...")
    conn = psycopg2.connect(DATABASE_URL)

    df = pd.read_sql("""
        SELECT
            id,
            title          AS "כותרת משרה",
            company        AS "חברה",
            location       AS "מיקום",
            category       AS "קטגוריה",
            employment_type AS "סוג העסקה",
            status         AS "סטטוס",
            source         AS "מקור",
            contact_name   AS "איש קשר",
            contact_email  AS "מייל",
            contact_phone  AS "טלפון",
            external_job_id AS "קישור להגשה",
            description    AS "תיאור",
            created_at     AS "תאריך הוספה"
        FROM opportunities
        ORDER BY created_at DESC
    """, conn)

    conn.close()
    return df


def save_excel(df):
    df.to_excel(EXCEL_FILE, index=False)
    print(f"✅ Excel נוצר: {EXCEL_FILE}")
    print(f"📊 סה\"כ משרות: {len(df)}")
    print(f"📧 עם מייל: {df['מייל'].notna().sum()}")
    print(f"🔗 עם קישור: {df['קישור להגשה'].notna().sum()}")
    print("\n--- דוגמה (5 ראשונות) ---")
    print(df[["כותרת משרה", "חברה", "מייל", "קישור להגשה"]].head())


def open_excel():
    if os.name == 'nt':  # Windows
        os.startfile(EXCEL_FILE)
    else:  # Linux / Mac
        subprocess.Popen(["xdg-open", EXCEL_FILE])


def run_dashboard():
    print("\n🚀 מפעיל Streamlit dashboard...")
    subprocess.Popen("python -m streamlit run dashboard.py", shell=True)


# ========== הרצה ==========
if __name__ == "__main__":
    df = fetch_jobs()
    save_excel(df)
    open_excel()
    run_dashboard()  # מפעיל גם את ה-dashboard
