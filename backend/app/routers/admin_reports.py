import io
from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from openpyxl import Workbook
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet
from sqlalchemy.orm import Session

from app.core.deps import require_admin
from app.db.session import get_db
from app.schemas.report import ReportResponse
from app.services.report_service import build_report

router = APIRouter(prefix='/api/admin/reports', tags=['admin-reports'], dependencies=[Depends(require_admin)])


def _resolve_period(period: str | None, start_date: date | None, end_date: date | None) -> tuple[date, date]:
    today = date.today()
    if period == '7d':
        return today - timedelta(days=6), today
    if period == '30d':
        return today - timedelta(days=29), today
    if start_date and end_date:
        return (start_date, end_date) if start_date <= end_date else (end_date, start_date)
    raise HTTPException(status.HTTP_400_BAD_REQUEST, 'Provide period=7d, period=30d, or both start_date and end_date.')


@router.get('', response_model=ReportResponse)
def get_report(
    db: Session = Depends(get_db),
    period: str | None = Query(default='7d'),
    start_date: date | None = None,
    end_date: date | None = None,
):
    resolved_start, resolved_end = _resolve_period(period, start_date, end_date)
    return build_report(db, resolved_start, resolved_end)


@router.get('/export/excel')
def export_excel(
    db: Session = Depends(get_db),
    period: str | None = Query(default='7d'),
    start_date: date | None = None,
    end_date: date | None = None,
):
    resolved_start, resolved_end = _resolve_period(period, start_date, end_date)
    report = build_report(db, resolved_start, resolved_end)

    wb = Workbook()
    summary_ws = wb.active
    summary_ws.title = 'Report summary'
    summary_ws.append(['GHOSTER sales report'])
    summary_ws.append(['Period', f"{report['period']['start_date']} to {report['period']['end_date']}"])
    summary_ws.append([])
    for label, key in [
        ('Total sales', 'total_sales'), ('Total orders', 'total_orders'), ('Completed orders', 'completed_orders'),
        ('Cancelled orders', 'cancelled_orders'), ('Items sold', 'items_sold'), ('Average order value', 'average_order_value'),
    ]:
        summary_ws.append([label, report['summary'][key]])

    daily_ws = wb.create_sheet('Daily sales')
    daily_ws.append(['Date', 'Orders', 'Items sold', 'Sales amount'])
    for row in report['daily_sales']:
        daily_ws.append([str(row['date']), row['orders'], row['items_sold'], row['sales_amount']])

    buffer = io.BytesIO()
    wb.save(buffer)
    buffer.seek(0)
    filename = f"ghoster-report-{report['period']['start_date']}-to-{report['period']['end_date']}.xlsx"
    return StreamingResponse(
        buffer, media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        headers={'Content-Disposition': f'attachment; filename="{filename}"'},
    )


@router.get('/export/pdf')
def export_pdf(
    db: Session = Depends(get_db),
    period: str | None = Query(default='7d'),
    start_date: date | None = None,
    end_date: date | None = None,
):
    resolved_start, resolved_end = _resolve_period(period, start_date, end_date)
    report = build_report(db, resolved_start, resolved_end)

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=20 * mm, bottomMargin=20 * mm)
    styles = getSampleStyleSheet()
    story = [
        Paragraph('GHOSTER sales report', styles['Title']),
        Paragraph(f"Period: {report['period']['start_date']} to {report['period']['end_date']}", styles['Normal']),
        Paragraph(f'Generated: {date.today()}', styles['Normal']),
        Spacer(1, 12),
    ]

    summary_rows = [['Metric', 'Value']] + [
        [label, str(report['summary'][key])] for label, key in [
            ('Total sales', 'total_sales'), ('Total orders', 'total_orders'), ('Completed orders', 'completed_orders'),
            ('Cancelled orders', 'cancelled_orders'), ('Items sold', 'items_sold'), ('Average order value', 'average_order_value'),
        ]
    ]
    summary_table = Table(summary_rows, hAlign='LEFT')
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#b4a979')), ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ]))
    story += [summary_table, Spacer(1, 18), Paragraph('Daily sales', styles['Heading2'])]

    daily_rows = [['Date', 'Orders', 'Items sold', 'Sales amount']] + [
        [str(row['date']), row['orders'], row['items_sold'], str(row['sales_amount'])] for row in report['daily_sales']
    ]
    if len(daily_rows) > 1:
        daily_table = Table(daily_rows, hAlign='LEFT')
        daily_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#b4a979')), ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ]))
        story.append(daily_table)
    else:
        story.append(Paragraph('Range too wide for a daily breakdown.', styles['Normal']))

    doc.build(story)
    buffer.seek(0)
    filename = f"ghoster-report-{report['period']['start_date']}-to-{report['period']['end_date']}.pdf"
    return StreamingResponse(buffer, media_type='application/pdf', headers={'Content-Disposition': f'attachment; filename="{filename}"'})
