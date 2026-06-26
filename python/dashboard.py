import os
import streamlit as st
import pandas as pd
import plotly.express as px
import psycopg2

# ========== הגדרות ==========
DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql://postgresql_jztr_user:XKajGhxhz6OY25fXrROMzBAbGYHfp42s@dpg-d7tnfmosfn5c73enlgq0-a.oregon-postgres.render.com/postgresql_jztr"
)
# ============================


@st.cache_data(ttl=60)
def load_data():
    conn = psycopg2.connect(DATABASE_URL)
    df = pd.read_sql("""
        SELECT
            id, title, company, location, category,
            employment_type, status, source,
            contact_name, contact_email, contact_phone,
            external_job_id AS apply_url,
            description, created_at
        FROM opportunities
        ORDER BY created_at DESC
    """, conn)
    conn.close()
    return df


st.set_page_config(
    page_title="MIS Jobs Dashboard",
    page_icon="📊",
    layout="wide"
)

st.title("📊 MIS Opportunity Hub — Dashboard")
st.caption("נתונים ישירות מ-PostgreSQL | מתרענן כל 60 שניות")

df = load_data()

if df.empty:
    st.warning("לא נמצאו משרות בבסיס הנתונים.")
    st.stop()

# ========== מטריקות ==========
col1, col2, col3, col4, col5 = st.columns(5)
col1.metric("סה\"כ משרות", len(df))
col2.metric("חברות שונות", df["company"].nunique())
col3.metric("עם מייל", df["contact_email"].notna().sum())
col4.metric("עם קישור", df["apply_url"].notna().sum())
col5.metric("מקורות", df["source"].nunique())

st.divider()

# ========== גרפים שורה 1 ==========
left1, right1 = st.columns(2)

with left1:
    st.subheader("משרות לפי מקור")
    source_counts = df["source"].value_counts().reset_index()
    source_counts.columns = ["source", "count"]
    fig = px.bar(source_counts, x="source", y="count", text="count",
                 title="כמות משרות לפי מקור", color="source")
    st.plotly_chart(fig, use_container_width=True)

with right1:
    st.subheader("משרות לפי קטגוריה")
    cat_counts = df["category"].value_counts().reset_index()
    cat_counts.columns = ["category", "count"]
    fig = px.pie(cat_counts, names="category", values="count",
                 title="אחוז משרות לפי קטגוריה", hole=0.4)
    st.plotly_chart(fig, use_container_width=True)

st.divider()

# ========== גרפים שורה 2 ==========
left2, right2 = st.columns(2)

with left2:
    st.subheader("משרות לפי מיקום")
    loc_counts = df["location"].value_counts().head(10).reset_index()
    loc_counts.columns = ["location", "count"]
    fig = px.bar(
        loc_counts,
        x="location",
        y="count",
        text="count",
        title="Top 10 מיקומים"
    )
    st.plotly_chart(fig, use_container_width=True)

with right2:
    st.subheader("סטטוס הזדמנויות")
    status_counts = df["status"].fillna("לא ידוע").value_counts().reset_index()
    status_counts.columns = ["status", "count"]
    fig = px.bar(
        status_counts,
        x="status",
        y="count",
        text="count",
        color="status",
        title="כמות הזדמנויות לפי סטטוס"
    )
    st.plotly_chart(fig, use_container_width=True)
# ========== טבלת משרות עם חיפוש ==========
st.subheader("טבלת משרות")

search = st.text_input("חיפוש חופשי (כותרת, חברה, מיקום, מקור...)")

filtered = df.copy()
if search:
    filtered = filtered[
        filtered.astype(str).apply(
            lambda row: row.str.lower().str.contains(search.lower()).any(), axis=1
        )
    ]

# הצג עמודות רלוונטיות
display_cols = ["title", "company", "location", "category", "source",
                "contact_email", "apply_url", "status", "created_at"]
st.dataframe(filtered[display_cols], use_container_width=True)

# כפתור הורדת Excel
st.download_button(
    label="📥 הורד כ-Excel",
    data=filtered.to_csv(index=False).encode("utf-8-sig"),
    file_name="mis_jobs.csv",
    mime="text/csv"
)
