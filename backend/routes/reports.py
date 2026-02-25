from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from backend.database.db import SessionLocal
from backend.models.detection_log import DetectionLog
from sqlalchemy import func, case
from datetime import datetime, timedelta
import io
import os

router = APIRouter()


def _build_pdf(db) -> io.BytesIO:
    """Generate a professional IDS report PDF."""
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch, cm
    from reportlab.platypus import (
        SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
        Image, PageBreak, HRFlowable,
    )
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt

    width, height = A4
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4,
                            leftMargin=1.5 * cm, rightMargin=1.5 * cm,
                            topMargin=2 * cm, bottomMargin=2 * cm)
    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle("CustomTitle", parent=styles["Title"],
                                  fontSize=28, textColor=colors.HexColor("#1E3A5F"),
                                  spaceAfter=12)
    heading_style = ParagraphStyle("CustomHeading", parent=styles["Heading2"],
                                    fontSize=16, textColor=colors.HexColor("#1E3A5F"),
                                    spaceAfter=8, spaceBefore=16)
    body_style = ParagraphStyle("CustomBody", parent=styles["Normal"],
                                 fontSize=11, leading=16, spaceAfter=8)
    small_style = ParagraphStyle("Small", parent=styles["Normal"],
                                  fontSize=9, textColor=colors.grey)

    elements = []

    # ─── Query data ───
    total = db.query(func.count(DetectionLog.id)).scalar() or 0
    attacks = db.query(func.count(DetectionLog.id)).filter(DetectionLog.result == "ATTACK").scalar() or 0
    normal = total - attacks
    attack_rate = round((attacks / total) * 100, 1) if total > 0 else 0.0

    # Severity counts
    sev_rows = (
        db.query(DetectionLog.severity, func.count(DetectionLog.id))
        .filter(DetectionLog.severity.isnot(None))
        .group_by(DetectionLog.severity).all()
    )
    severity = {s: 0 for s in ["LOW", "MEDIUM", "HIGH", "CRITICAL"]}
    for r in sev_rows:
        if r[0] in severity:
            severity[r[0]] = r[1]

    # Top attack types
    attack_rows = (
        db.query(DetectionLog.attack_type, func.count(DetectionLog.id).label("c"))
        .filter(DetectionLog.result == "ATTACK", DetectionLog.attack_type.isnot(None))
        .group_by(DetectionLog.attack_type).order_by(func.count(DetectionLog.id).desc())
        .limit(10).all()
    )

    # Most frequent
    most_frequent = attack_rows[0][0] if attack_rows else "N/A"
    highest_sev = "CRITICAL" if severity["CRITICAL"] > 0 else (
        "HIGH" if severity["HIGH"] > 0 else "MEDIUM" if severity["MEDIUM"] > 0 else "LOW"
    )

    # System status
    crit_pct = (severity["CRITICAL"] / total * 100) if total > 0 else 0
    if crit_pct > 20:
        system_status = "CRITICAL"
    elif attack_rate > 40:
        system_status = "WARNING"
    else:
        system_status = "SECURE"

    now_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")

    # ═══════════════════════ PAGE 1 — COVER ═══════════════════════
    elements.append(Spacer(1, 2 * inch))
    elements.append(Paragraph("🛡️ Web IDS", title_style))
    elements.append(Paragraph("Security Report", ParagraphStyle(
        "Subtitle", parent=styles["Heading1"], fontSize=22,
        textColor=colors.HexColor("#4A90D9"), spaceAfter=24)))
    elements.append(HRFlowable(width="80%", thickness=2, color=colors.HexColor("#4A90D9")))
    elements.append(Spacer(1, 0.5 * inch))
    elements.append(Paragraph(f"<b>Date Generated:</b> {now_str}", body_style))
    elements.append(Paragraph(f"<b>Total Requests:</b> {total:,}", body_style))
    elements.append(Paragraph(f"<b>Total Attacks:</b> {attacks:,}", body_style))
    elements.append(Paragraph(f"<b>Attack Rate:</b> {attack_rate}%", body_style))

    status_color = {"SECURE": "#10B981", "WARNING": "#F59E0B", "CRITICAL": "#EF4444"}
    elements.append(Paragraph(
        f'<b>System Status:</b> <font color="{status_color.get(system_status, "#888")}">'
        f'{system_status}</font>', body_style))
    elements.append(PageBreak())

    # ═══════════════════════ PAGE 2 — EXECUTIVE SUMMARY ═══════════════════════
    elements.append(Paragraph("Executive Summary", title_style))
    elements.append(HRFlowable(width="100%", thickness=1, color=colors.lightgrey))
    elements.append(Spacer(1, 0.3 * inch))

    summary_data = [
        ["Metric", "Value"],
        ["Total Requests", f"{total:,}"],
        ["Total Attacks", f"{attacks:,}"],
        ["Total Normal", f"{normal:,}"],
        ["Attack Rate", f"{attack_rate}%"],
        ["Most Frequent Attack", most_frequent],
        ["Highest Severity", highest_sev],
    ]
    t = Table(summary_data, colWidths=[3 * inch, 3 * inch])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1E3A5F")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTSIZE", (0, 0), (-1, -1), 11),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 10),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.lightgrey),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F5F7FA")]),
    ]))
    elements.append(t)
    elements.append(Spacer(1, 0.3 * inch))

    # Risk assessment paragraph
    if system_status == "CRITICAL":
        risk_text = (
            "The system is currently in a <b>CRITICAL</b> state. A significant portion of "
            "incoming traffic has been classified as malicious. Immediate review of firewall "
            "rules and network segmentation is recommended."
        )
    elif system_status == "WARNING":
        risk_text = (
            "The system shows <b>elevated</b> threat activity. While not critical, the attack "
            "rate warrants closer monitoring. Consider tightening security policies."
        )
    else:
        risk_text = (
            "The system is operating within <b>normal</b> parameters. Detected threats are "
            "within acceptable thresholds. Continue routine monitoring."
        )
    elements.append(Paragraph("<b>Risk Assessment</b>", heading_style))
    elements.append(Paragraph(risk_text, body_style))
    elements.append(PageBreak())

    # ═══════════════════════ PAGE 3 — CHARTS ═══════════════════════
    elements.append(Paragraph("Visual Analytics", title_style))
    elements.append(HRFlowable(width="100%", thickness=1, color=colors.lightgrey))
    elements.append(Spacer(1, 0.3 * inch))

    chart_dir = "/tmp/ids_report_charts"
    os.makedirs(chart_dir, exist_ok=True)

    # --- Pie Chart: Attack Types ---
    if attack_rows:
        fig, ax = plt.subplots(figsize=(5, 4))
        labels = [r[0] for r in attack_rows]
        sizes = [r[1] for r in attack_rows]
        colors_pie = ["#3B82F6", "#EF4444", "#10B981", "#F59E0B", "#8B5CF6",
                       "#EC4899", "#14B8A6", "#F97316", "#6366F1"]
        ax.pie(sizes, labels=labels, autopct="%1.1f%%", startangle=90,
               colors=colors_pie[:len(labels)], textprops={"fontsize": 8})
        ax.set_title("Attack Type Distribution", fontsize=12, fontweight="bold")
        pie_path = os.path.join(chart_dir, "pie.png")
        fig.savefig(pie_path, dpi=120, bbox_inches="tight", facecolor="white")
        plt.close(fig)
        elements.append(Image(pie_path, width=4.5 * inch, height=3.5 * inch))
        elements.append(Spacer(1, 0.3 * inch))

    # --- Bar Chart: Severity ---
    fig2, ax2 = plt.subplots(figsize=(5, 3.5))
    sev_labels = list(severity.keys())
    sev_values = list(severity.values())
    sev_colors = ["#3B82F6", "#EAB308", "#F59E0B", "#EF4444"]
    ax2.bar(sev_labels, sev_values, color=sev_colors)
    ax2.set_title("Severity Distribution", fontsize=12, fontweight="bold")
    ax2.set_ylabel("Count")
    bar_path = os.path.join(chart_dir, "bar.png")
    fig2.savefig(bar_path, dpi=120, bbox_inches="tight", facecolor="white")
    plt.close(fig2)
    elements.append(Image(bar_path, width=4.5 * inch, height=3 * inch))
    elements.append(Spacer(1, 0.3 * inch))

    # --- Line Chart: Attacks Over Time ---
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    time_rows = (
        db.query(func.date(DetectionLog.timestamp), func.count(DetectionLog.id))
        .filter(DetectionLog.result == "ATTACK", DetectionLog.timestamp >= thirty_days_ago)
        .group_by(func.date(DetectionLog.timestamp))
        .order_by(func.date(DetectionLog.timestamp)).all()
    )
    if time_rows:
        fig3, ax3 = plt.subplots(figsize=(6, 3))
        dates = [str(r[0]) for r in time_rows]
        counts = [r[1] for r in time_rows]
        ax3.plot(dates, counts, marker="o", color="#3B82F6", linewidth=2, markersize=4)
        ax3.fill_between(range(len(dates)), counts, alpha=0.15, color="#3B82F6")
        ax3.set_title("Attacks Over Time", fontsize=12, fontweight="bold")
        ax3.set_ylabel("Attacks")
        ax3.tick_params(axis="x", rotation=45, labelsize=7)
        line_path = os.path.join(chart_dir, "line.png")
        fig3.savefig(line_path, dpi=120, bbox_inches="tight", facecolor="white")
        plt.close(fig3)
        elements.append(Image(line_path, width=5.5 * inch, height=2.8 * inch))

    elements.append(PageBreak())

    # ═══════════════════════ PAGE 4 — LOGS TABLE ═══════════════════════
    elements.append(Paragraph("Detection Logs", title_style))
    elements.append(HRFlowable(width="100%", thickness=1, color=colors.lightgrey))
    elements.append(Spacer(1, 0.2 * inch))

    logs = (
        db.query(DetectionLog)
        .order_by(DetectionLog.timestamp.desc())
        .limit(50)
        .all()
    )

    log_data = [["Timestamp", "Result", "Attack Type", "Severity", "Confidence"]]
    for log in logs:
        ts = log.timestamp.strftime("%Y-%m-%d %H:%M") if log.timestamp else "N/A"
        log_data.append([
            ts,
            log.result or "N/A",
            log.attack_type or "-",
            log.severity or "-",
            f"{log.confidence:.2f}" if log.confidence else "-",
        ])

    col_widths = [1.6 * inch, 0.9 * inch, 1.5 * inch, 1 * inch, 1 * inch]
    lt = Table(log_data, colWidths=col_widths, repeatRows=1)
    lt.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1E3A5F")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTSIZE", (0, 0), (-1, 0), 9),
        ("FONTSIZE", (0, 1), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.lightgrey),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F5F7FA")]),
    ]))
    elements.append(lt)
    elements.append(PageBreak())

    # ═══════════════════════ FINAL PAGE — RECOMMENDATIONS ═══════════════════════
    elements.append(Paragraph("Recommendations", title_style))
    elements.append(HRFlowable(width="100%", thickness=1, color=colors.lightgrey))
    elements.append(Spacer(1, 0.3 * inch))

    recommendations = []

    if severity["CRITICAL"] > 5:
        recommendations.append(
            "🔴 <b>High Critical Alerts:</b> Implement stricter firewall rules and "
            "consider network segmentation to isolate affected segments."
        )

    # Check for specific attack types
    attack_dict = {r[0]: r[1] for r in attack_rows}
    if attack_dict.get("SQL Injection", 0) > 3:
        recommendations.append(
            "🟠 <b>SQL Injection Detected:</b> Deploy a Web Application Firewall (WAF) "
            "and review parameterized query usage across all services."
        )
    if attack_dict.get("Brute Force", 0) > 3:
        recommendations.append(
            "🟡 <b>Brute Force Attacks:</b> Implement rate limiting on authentication "
            "endpoints and enforce multi-factor authentication."
        )
    if attack_dict.get("DDoS", 0) > 3:
        recommendations.append(
            "🔴 <b>DDoS Activity:</b> Consider deploying DDoS mitigation services "
            "and implementing traffic shaping policies."
        )
    if attack_dict.get("Cross-Site Scripting (XSS)", 0) > 3:
        recommendations.append(
            "🟠 <b>XSS Attacks:</b> Implement Content Security Policy (CSP) headers "
            "and review input sanitization across the application."
        )
    if attack_dict.get("Port Scan", 0) > 3:
        recommendations.append(
            "🟡 <b>Port Scanning:</b> Review exposed ports and services. Close "
            "unnecessary ports and implement port knocking."
        )
    if attack_dict.get("Phishing Attempt", 0) > 3:
        recommendations.append(
            "🟠 <b>Phishing Attempts:</b> Enhance email filtering, deploy DMARC/SPF "
            "policies, and conduct user awareness training."
        )

    if not recommendations:
        recommendations.append(
            "✅ <b>System Healthy:</b> No immediate action required. Continue "
            "routine monitoring and periodic security assessments."
        )

    for rec in recommendations:
        elements.append(Paragraph(f"• {rec}", body_style))
        elements.append(Spacer(1, 0.15 * inch))

    elements.append(Spacer(1, 0.5 * inch))
    elements.append(HRFlowable(width="100%", thickness=1, color=colors.lightgrey))
    elements.append(Spacer(1, 0.2 * inch))
    elements.append(Paragraph(
        f"<i>Report generated automatically by Web IDS v1.0 — {now_str}</i>",
        small_style))

    doc.build(elements)
    buf.seek(0)
    return buf


@router.get("/reports/generate")
def generate_report():
    """Generate and return a PDF security report."""
    db = SessionLocal()
    try:
        pdf_buffer = _build_pdf(db)
        filename = f"IDS_Report_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.pdf"
        
        # Create notification for report generation
        from backend.models.notification import Notification
        report_notification = Notification(
            type="REPORT",
            title="Security Report Generated",
            message=f"New IDS report generated: {filename}",
            severity="LOW",
        )
        db.add(report_notification)
        db.commit()
        
        return StreamingResponse(
            pdf_buffer,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={filename}"},
        )
    finally:
        db.close()
